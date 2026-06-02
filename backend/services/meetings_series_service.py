from datetime import datetime

from integrations.microsoft_graph_client import GraphClient
from models import MeetingsSeries
from models.integrations import Meetings
from repositories.meetings_repository import MeetingsRepository
from repositories.meetings_series_repository import MeetingsSeriesRepository
from schemas.meetings_series_schemas import (
    MeetingsSeriesCreate,
    PatternType,
    RangeType,
    Recurrence,
)
from services.microsoft_oauth_service import MicrosoftOAuthService


class MeetingsSeriesService:
    def __init__(
        self,
        graph_client: GraphClient,
        oauth_service: MicrosoftOAuthService,
        meetings_repo: MeetingsRepository,
        repo: MeetingsSeriesRepository,
    ):
        self.repo = repo
        self.graph_client = graph_client
        self.oauth_service = oauth_service
        self.meetings_repo = meetings_repo

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
            pattern_dict["daysOfWeek"] = pattern_data.days_of_week
            if pattern_data.first_day_of_week is not None:
                pattern_dict["firstDayOfWeek"] = pattern_data.first_day_of_week

        elif pattern_data.type is PatternType.absolute_monthly:
            pattern_dict["dayOfMonth"] = pattern_data.day_of_month

        elif pattern_data.type is PatternType.relative_monthly:
            pattern_dict["daysOfWeek"] = pattern_data.days_of_week
            pattern_dict["index"] = (
                pattern_data.index.value if pattern_data.index else None
            )

        elif pattern_data.type is PatternType.absolute_yearly:
            pattern_dict["dayOfMonth"] = pattern_data.day_of_month
            pattern_dict["month"] = pattern_data.month

        elif pattern_data.type is PatternType.relative_yearly:
            pattern_dict["daysOfWeek"] = pattern_data.days_of_week
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
