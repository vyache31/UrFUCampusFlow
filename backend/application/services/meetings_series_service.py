import uuid
from datetime import UTC, datetime, timedelta

import httpx

from application.services.meetings_service import MeetingsService

from application.exceptions.base import InvalidPeriodError
from application.exceptions.meeting import InvalidRecurrenceError
from application.exceptions.team import TeamCaseHistoryNotFoundError
from application.interfaces.integrations import (
    MicrosoftAccessTokenProviderProtocol,
    MicrosoftGraphClientProtocol,
)
from application.interfaces.uow.meetings_series_uow_protocol import MeetingsSeriesUoWProtocol
from infrastructure.db.models import MeetingsSeries, S3FilesCleanUp
from infrastructure.db.models.integrations import Meetings
from presentation.api.schemas.meetings_series_schemas import (
    MeetingsSeriesCreate,
    MeetingsSeriesResponse,
    RangeType,
    Recurrence,
    RecurrencePattern,
    RecurrenceRange,
)


class MeetingsSeriesService:
    def __init__(
        self,
        uow: MeetingsSeriesUoWProtocol,
        graph_client: MicrosoftGraphClientProtocol,
        oauth_service: MicrosoftAccessTokenProviderProtocol,
    ):
        self.uow = uow
        self.graph_client = graph_client
        self.oauth_service = oauth_service

    async def _resolve_instances_window(
        self,
        uow: MeetingsSeriesUoWProtocol,
        schema: MeetingsSeriesCreate,
        team_case_history_id: str,
    ) -> dict:
        if schema.recurrence.range.type is RangeType.end_date:
            end_date = schema.recurrence.range.end_date

            if end_date is None:
                raise InvalidRecurrenceError("end_date обязателен для типа endDate")

            end_time = datetime.combine(end_date, schema.end_at.time())

        else:
            team_case_history = await uow.team_case_history_repository.get_by_id(
                team_case_history_id
            )

            if not team_case_history:
                raise TeamCaseHistoryNotFoundError("TeamCaseHistory entry not found")

            end_time = team_case_history.case_semester.semester.end_date

        return {
            "startDateTime": str(schema.start_at.isoformat()),
            "endDateTime": str(end_time.isoformat()),
        }

    async def _create_series_instances(
        self,
        uow: MeetingsSeriesUoWProtocol,
        instances: dict,
        team_case_history_id: str,
        meetings_series_id: str,
    ) -> None:
        meetings = []
        for instance in instances["value"]:
            meetings.append(
                Meetings(
                    id=str(uuid.uuid4()),
                    team_case_history_id=team_case_history_id,
                    title=instance["subject"],
                    location=instance["location"]["displayName"],
                    start_at=datetime.fromisoformat(instance["start"]["dateTime"]),
                    end_at=datetime.fromisoformat(instance["end"]["dateTime"]),
                    outlook_event_id=instance["id"],
                    event_link=instance.get("onlineMeetingUrl"),
                    notes=None,
                    meetings_series_id=meetings_series_id,
                    timezone=None,
                )
            )

        await uow.meetings_repository.create_many(meetings)

    @staticmethod
    def _to_response(series: MeetingsSeries) -> MeetingsSeriesResponse:
        return MeetingsSeriesResponse(
            title=series.title,
            start_at=series.start_at,
            location=series.location,
            end_at=series.end_at,
            event_link=series.event_link,
            recurrence=Recurrence(
                pattern=RecurrencePattern.model_validate(series.recurrence_pattern),
                range=RecurrenceRange.model_validate(series.recurrence_range),
            ),
        )

    async def create_series(
        self, user_id: str, team_case_history_id: str, schema: MeetingsSeriesCreate
    ) -> MeetingsSeriesResponse:
        if schema.start_at >= schema.end_at:
            raise InvalidPeriodError(
                "Meetings start time must be earlier than end time"
            )
        async with self.uow as uow:
            team_case_history = await uow.team_case_history_repository.get_by_id(
                team_case_history_id
            )
            if not team_case_history:
                raise TeamCaseHistoryNotFoundError("TeamCaseHistory entry not found")

            window = await self._resolve_instances_window(
                uow=uow, schema=schema, team_case_history_id=team_case_history_id
            )
            access_token = await self.oauth_service.get_actual_access_token(user_id)
            payload = await self.graph_client.create_series(
                series_data=schema,
                access_token=access_token,
            )
            created_series = MeetingsSeries(
                id=str(uuid.uuid4()),
                team_case_history_id=team_case_history_id,
                outlook_series_master_id=payload["id"],
                title=schema.title,
                location=schema.location,
                start_at=schema.start_at,
                end_at=schema.end_at,
                event_link=schema.event_link,
                recurrence_pattern=schema.recurrence.pattern.model_dump(mode="json"),
                recurrence_range=schema.recurrence.range.model_dump(mode="json"),
            )
            await uow.meetings_series_repository.create(created_series)
            instances = await self.graph_client.get_series_instances(
                series_id=created_series.outlook_series_master_id,
                access_token=access_token,
                params=window,
            )
            await self._create_series_instances(
                uow=uow,
                instances=instances,
                team_case_history_id=team_case_history_id,
                meetings_series_id=created_series.id,
            )
            response = self._to_response(created_series)
            await uow.commit()
            return response

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[MeetingsSeriesResponse]:
        async with self.uow as uow:
            series = await uow.meetings_series_repository.get_by_team_case_history_id(
                team_case_history_id
            )
            return [self._to_response(item) for item in series]

    async def delete_meetings_series(
        self, series_id: str, current_team_case_history_id: str, user_id: str
    ) -> bool | None:
        async with self.uow as uow:
            series = await uow.meetings_series_repository.get_by_id(series_id, for_update=True)
            if not series or series.team_case_history_id != current_team_case_history_id:
                return None
            try:
                await self.graph_client.delete_series(
                    access_token=await self.oauth_service.get_actual_access_token(user_id),
                    series_id=series.outlook_series_master_id,
                )
            except httpx.HTTPStatusError as err:
                if not MeetingsService._is_missing_graph_event(err):
                    raise
            meetings = await uow.meetings_repository.get_by_series_id(series_id, for_update=True)
            for meeting in meetings:
                for task in meeting.tasks:
                    files_meta = await uow.s3_files_repository.get_by_task_id(task_id=task.id, for_update=True)
                    for meta in files_meta:
                        now = datetime.now(UTC)
                        cleanup = S3FilesCleanUp(
                            id=str(uuid.uuid4()),
                            object_key=meta.object_key,
                            created_at=now,
                            next_attempt_at=now + timedelta(minutes=5) if meta.status == 'uploading' else now,
                            attempts=0,
                            last_error=None,
                        )
                        await uow.s3_files_cleanup_repository.create(cleanup)
                        await uow.s3_files_repository.delete(meta)

            await uow.meetings_series_repository.delete_by_id(series_id)
            await uow.commit()
            return True
