import uuid
from datetime import datetime

from integrations.microsoft_graph_client import GraphClient
from models import MeetingsSeries
from models.integrations import Meetings
from repositories.meetings_repository import MeetingsRepository
from repositories.meetings_series_repository import MeetingsSeriesRepository
from repositories.team_case_history_repository import TeamCaseHistoryRepository
from schemas.meetings_series_schemas import (
    MeetingsSeriesCreate,
    MeetingsSeriesResponse,
    PatternType,
    RangeType,
    Recurrence,
    RecurrencePattern,
    RecurrenceRange,
)
from services.microsoft_oauth_service import MicrosoftOAuthService


class MeetingsSeriesService:
    def __init__(
        self,
        graph_client: GraphClient,
        oauth_service: MicrosoftOAuthService,
        meetings_repo: MeetingsRepository,
        repo: MeetingsSeriesRepository,
        team_case_history_repo: TeamCaseHistoryRepository,
    ):
        self.repo = repo
        self.graph_client = graph_client
        self.oauth_service = oauth_service
        self.meetings_repo = meetings_repo
        self.team_case_history_repo = team_case_history_repo

    @staticmethod
    def _build_recurrence_pattern(recurrence: Recurrence) -> dict:
        pattern_data = recurrence.pattern

        pattern_dict = {
            "type": pattern_data.type.value,
            "interval": pattern_data.interval,
        }

        if pattern_data.type is PatternType.daily:
            return pattern_dict

        elif pattern_data.type is PatternType.weekly:
            pattern_dict["daysOfWeek"] = [
                day.value for day in pattern_data.days_of_week
            ]
            if pattern_data.first_day_of_week is not None:
                pattern_dict["firstDayOfWeek"] = pattern_data.first_day_of_week.value

        elif pattern_data.type is PatternType.absolute_monthly:
            pattern_dict["dayOfMonth"] = pattern_data.day_of_month

        elif pattern_data.type is PatternType.relative_monthly:
            pattern_dict["daysOfWeek"] = [
                day.value for day in pattern_data.days_of_week
            ]
            pattern_dict["index"] = (
                pattern_data.index.value if pattern_data.index else None
            )

        elif pattern_data.type is PatternType.absolute_yearly:
            pattern_dict["dayOfMonth"] = pattern_data.day_of_month
            pattern_dict["month"] = pattern_data.month

        elif pattern_data.type is PatternType.relative_yearly:
            pattern_dict["daysOfWeek"] = [
                day.value for day in pattern_data.days_of_week
            ]
            pattern_dict["index"] = (
                pattern_data.index.value if pattern_data.index else None
            )
            pattern_dict["month"] = pattern_data.month

        return pattern_dict

    @staticmethod
    def _build_recurrence_range(recurrence: Recurrence) -> dict[str, str | int]:
        range_data = recurrence.range

        range_dict = {
            "type": range_data.type.value,
            "startDate": str(range_data.start_date.isoformat()),
        }

        if range_data.type is RangeType.no_end:
            return range_dict

        elif range_data.type is RangeType.end_date:
            range_dict["endDate"] = str(range_data.end_date.isoformat())

        elif range_data.type is RangeType.numbered:
            range_dict["numberOfOccurrences"] = range_data.number_of_occurrences

        return range_dict

    @staticmethod
    def _build_meetings_series_data(
        title: str,
        start_at: datetime,
        end_at: datetime,
        location: str | None,
        event_link: str | None,
        recurrence: Recurrence,
    ) -> dict:

        data = {
            "subject": title,
            "location": {"displayName": location or ""},
            "start": {
                "dateTime": str(start_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time",
            },
            "end": {
                "dateTime": str(end_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time",
            },
            "recurrence": {
                "pattern": MeetingsSeriesService._build_recurrence_pattern(recurrence),
                "range": MeetingsSeriesService._build_recurrence_range(recurrence),
            },
            "isOnlineMeeting": False,
        }

        if event_link is not None:
            data["onlineMeetingUrl"] = event_link

        return data

    @staticmethod
    def _handle_meetings_series_data(series_data: MeetingsSeriesCreate) -> dict:
        return MeetingsSeriesService._build_meetings_series_data(
            title=series_data.title,
            start_at=series_data.start_at,
            end_at=series_data.end_at,
            location=series_data.location,
            event_link=series_data.event_link,
            recurrence=series_data.recurrence,
        )

    async def _resolve_instances_window(
        self, schema: MeetingsSeriesCreate, team_case_history_id: str
    ) -> dict:
        if schema.recurrence.range.type is RangeType.end_date:
            end_date = schema.recurrence.range.end_date

            if end_date is None:
                raise ValueError("end_date обязателен для типа endDate")

            end_time = datetime.combine(end_date, schema.end_at.time())

        else:
            team_case_history = await self.team_case_history_repo.get_by_id(
                team_case_history_id
            )

            if not team_case_history:
                raise ValueError("TeamCaseHistory entry not found")

            end_time = team_case_history.case_semester.semester.end_date

        return {
            "startDateTime": str(schema.start_at.isoformat()),
            "endDateTime": str(end_time.isoformat()),
        }

    async def _create_series_instances(
        self, instances: dict, team_case_history_id: str, meetings_series_id: str
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

        await self.meetings_repo.create_many(meetings)

    async def _build_headers(self, user_id: str) -> dict:
        access_token = await self.oauth_service.get_actual_access_token(user_id)

        return {"Authorization": f"Bearer {access_token}"}

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

        correct_timelime = schema.start_at < schema.end_at

        if not correct_timelime:
            raise ValueError("Meetings start time must be earlier than end time")

        team_case_history = await self.team_case_history_repo.get_by_id(
            team_case_history_id
        )

        if not team_case_history:
            raise ValueError("TeamCaseHistory entry not found")

        payload = await self.graph_client.create_event(
            event_info=self._handle_meetings_series_data(schema),
            headers=await self._build_headers(user_id),
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

        await self.repo.create(created_series)

        instances = await self.graph_client.get_series_instances(
            series_id=created_series.outlook_series_master_id,
            headers=await self._build_headers(user_id),
            params=await self._resolve_instances_window(
                schema=schema, team_case_history_id=team_case_history_id
            ),
        )

        await self._create_series_instances(
            instances=instances,
            team_case_history_id=team_case_history_id,
            meetings_series_id=created_series.id,
        )

        return MeetingsSeriesService._to_response(created_series)

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[MeetingsSeriesResponse]:
        series = await self.repo.get_by_team_case_history_id(team_case_history_id)

        return [MeetingsSeriesService._to_response(item) for item in series]

    async def delete_meetings_series(
        self, series_id: str, current_team_case_history_id: str, user_id: str
    ) -> bool | None:

        series = await self.repo.get_by_id(series_id)

        if not series or series.team_case_history_id != current_team_case_history_id:
            return None

        await self.graph_client.delete_series(
            headers=await self._build_headers(user_id),
            series_id=series.outlook_series_master_id,
        )

        await self.meetings_repo.delete_by_series_id(series_id)

        await self.repo.delete_by_id(series_id)

        return True
