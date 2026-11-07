from datetime import date, datetime, UTC, time, timedelta
from zoneinfo import ZoneInfo
from html import escape
import logging
import uuid

import httpx
from application.exceptions.base import ApplicationValidationError, ConfigurationError, ConflictError
from application.exceptions.bot import (
    InterviewTimeConflictError,
    InvalidBotModeError,
    RecruitmentCaseNotFoundError,
    RecruitmentClosedError,
    RecruitmentCuratorNotFound,
    InvalidInterviewStatusTransitionError,
)
from application.interfaces.integrations import (
    MicrosoftAccessTokenProviderProtocol,
    MicrosoftGraphClientProtocol,
)
from application.interfaces.uow.bot_uow_protocol import BotUow
from infrastructure.db.models.bot import (
    BotCases,
    RecruitmentCurators,
    Interviews,
    InterviewCurators,
)
from presentation.api.schemas.bot_schemas import (
    BotCaseCreate,
    BotCaseResponse,
    BotModeResponse,
    InterviewSlotResponse,
    RecruitmentCuratorCreate,
    RecruitmentCuratorResponse,
    InterviewCreate,
    InterviewConfirm,
    InterviewResponse,
)
from aiogram.exceptions import TelegramAPIError

from application.services.const import interview_settings
from application.services.const.interview_status_workflow import (
    ALLOWED_INTERVIEW_STATUS_TRANSITIONS,
    INTERVIEW_STATUS_CANCELLED,
    INTERVIEW_STATUS_CONFIRMED,
    INTERVIEW_STATUS_IN_REVIEW,
)
from presentation.api.schemas.outlook_meetings import MeetingCreate


logger = logging.getLogger(__name__)



class BotService:

    def __init__(
        self,
        uow: BotUow,
        oauth_service: MicrosoftAccessTokenProviderProtocol,
        graph_client: MicrosoftGraphClientProtocol,
    ):
        self.uow = uow
        self.oauth_service = oauth_service
        self.graph_client = graph_client
        self.timezone = ZoneInfo(interview_settings.INTERVIEW_TIMEZONE)

    async def get_current_mode(self) -> BotModeResponse | None:
        async with self.uow as uow:
            mode = await uow.bot_repository.get_current_mode()
            return BotModeResponse.model_validate(mode) if mode else None

    async def change_current_mode(self, mode: str) -> BotModeResponse | None:
        async with self.uow as uow:
            current_mode = await uow.bot_repository.get_current_mode()

            if not current_mode:
                return None

            allowed_modes = ["stop", "recruitment"]

            if mode not in allowed_modes:
                raise InvalidBotModeError("Invalid bot mode")

            current_mode.mode = mode
            current_mode.updated_at = datetime.now(UTC)

            await uow.bot_repository.change_current_mode()
            response = BotModeResponse.model_validate(current_mode)
            await uow.commit()
            return response

    async def _check_stop_mode(self, uow: BotUow):
        current_mode = await uow.bot_repository.get_current_mode()

        if current_mode.mode != "stop":
            raise ConflictError(
                "редактирование невозможно! измените режим"
            )

    async def get_all_bot_cases(self) -> list[BotCaseResponse]:
        async with self.uow as uow:
            cases = await uow.bot_repository.get_all_bot_cases()
            return [BotCaseResponse.model_validate(case) for case in cases]

    async def get_bot_case_by_id(self, case_id: str) -> BotCaseResponse | None:
        async with self.uow as uow:
            case = await uow.bot_repository.get_bot_case_by_id(case_id)
            return BotCaseResponse.model_validate(case) if case else None

    async def get_bot_case_by_case_id(self, bot_case_id: str) -> BotCaseResponse | None:
        async with self.uow as uow:
            case = await uow.bot_repository.get_bot_case_by_case_id(bot_case_id)
            return BotCaseResponse.model_validate(case) if case else None

    async def add_bot_case(self, schema: BotCaseCreate) -> BotCaseResponse:
        async with self.uow as uow:
            await self._check_stop_mode(uow)

            bot_case = BotCases(
                id=str(uuid.uuid4()),
                case_id=schema.case_id,
                created_at=datetime.now(UTC)
            )
            bot_case = await uow.bot_repository.add_bot_case(bot_case)
            response = BotCaseResponse.model_validate(bot_case)
            await uow.commit()
            return response

    async def delete_bot_case(self, bot_case_id: str):
        async with self.uow as uow:
            await self._check_stop_mode(uow)

            bot_case = await uow.bot_repository.get_bot_case_by_id(bot_case_id, for_update=True)
            if not bot_case:
                return None

            if await uow.bot_repository.has_interviews_for_bot_case(bot_case_id):
                raise ConflictError("Сначала удалите записи на интервью этого кейса")

            await uow.bot_repository.delete_bot_case(bot_case)
            await uow.commit()
            return True

    async def get_all_recruitment_curators(self) -> list[RecruitmentCuratorResponse]:
        async with self.uow as uow:
            curators = await uow.bot_repository.get_all_recruitment_curators()
            return [RecruitmentCuratorResponse.model_validate(curator) for curator in curators]

    async def get_recruitment_curator_by_id(
        self, curator_id: str
    ) -> RecruitmentCuratorResponse | None:
        async with self.uow as uow:
            curator = await uow.bot_repository.get_recruitment_curator_by_id(curator_id)
            return RecruitmentCuratorResponse.model_validate(curator) if curator else None

    async def add_recruitment_curator(
        self,
        schema: RecruitmentCuratorCreate
    ) -> RecruitmentCuratorResponse:
        async with self.uow as uow:
            await self._check_stop_mode(uow)

            curator = RecruitmentCurators(
                id=str(uuid.uuid4()),
                user_id=schema.curator_id,
                created_at=datetime.now(UTC)
            )
            curator = await uow.bot_repository.add_recruitment_curator(curator)
            response = RecruitmentCuratorResponse.model_validate(curator)
            await uow.commit()
            return response

    async def delete_recruitment_curator(
        self,
        curator_id: str
    ):

        async with self.uow as uow:
            await self._check_stop_mode(uow)

            curator = await uow.bot_repository.get_recruitment_curator_by_id(curator_id)
            if not curator:
                return None

            await uow.bot_repository.delete_recruitment_curator(curator)
            await uow.commit()
            return True

    async def get_all_interviews(self) -> list[InterviewResponse]:
        async with self.uow as uow:
            interviews = await uow.bot_repository.get_all_interviews()
            return [InterviewResponse.model_validate(interview) for interview in interviews]

    async def get_interview_by_id(self, interview_id: str) -> InterviewResponse | None:
        async with self.uow as uow:
            interview = await uow.bot_repository.get_interview_by_id(interview_id)
            return InterviewResponse.model_validate(interview) if interview else None

    async def _get_required_curator_ids(self, uow: BotUow) -> list[str]:
        curators = await uow.bot_repository.get_all_recruitment_curators()
        if not curators:
            raise RecruitmentCuratorNotFound("No recruitment curators configured")
        return sorted({curator.user_id for curator in curators})

    def _get_day_bounds(self, day: date) -> tuple[datetime, datetime]:
        day_start = datetime.combine(
            day, time(hour=interview_settings.INTERVIEW_START_HOUR), tzinfo=self.timezone
        )
        day_end = datetime.combine(
            day, time(hour=interview_settings.INTERVIEW_END_HOUR), tzinfo=self.timezone
        )
        return day_start, day_end

    @staticmethod
    def _check_future_start(start_at: datetime) -> None:
        if start_at <= datetime.now(UTC):
            raise ApplicationValidationError("Interview must start in the future")

    def _prepare_interview_interval(self, date_time: datetime) -> tuple[datetime, datetime]:
        if date_time.utcoffset() is None:
            raise ApplicationValidationError("Interview date must include a timezone")
        start_at = date_time.astimezone(self.timezone)
        end_at = start_at + timedelta(minutes=interview_settings.INTERVIEW_DURATION_MINUTES)
        self._check_future_start(start_at)
        day_start, day_end = self._get_day_bounds(start_at.date())
        if start_at < day_start or end_at > day_end:
            raise ApplicationValidationError("Interview must fit within recruitment hours")
        step = timedelta(minutes=interview_settings.INTERVIEW_SLOT_STEP_MINUTES)
        if (start_at - day_start) % step:
            raise ApplicationValidationError("Interview start must match the available slot grid")
        return start_at, end_at

    async def _lock_curators(self, uow: BotUow, curator_ids: list[str]) -> None:
        # Every booking locks users in the same order to avoid deadlocks.
        for user_id in sorted(curator_ids):
            user = await uow.user_repository.get_by_id(user_id, for_update=True)
            if user is None:
                raise RecruitmentCuratorNotFound("Interview curator user not found")

    @staticmethod
    def _is_interval_free(
        start_at: datetime,
        end_at: datetime,
        busy_intervals: list[tuple[datetime, datetime]],
    ) -> bool:
        for busy_start, busy_end in busy_intervals:
            if busy_start < end_at and busy_end > start_at:
                return False
        return True

    async def _check_curators_availability(
        self,
        uow: BotUow,
        curator_ids: list[str],
        start_at: datetime,
        end_at: datetime,
        *,
        exclude_interview_id: str | None = None,
    ) -> None:
        for user_id in curator_ids:
            intervals = await self._get_busy_intervals(
                uow, user_id, start_at, end_at, exclude_interview_id=exclude_interview_id
            )
            if not self._is_interval_free(start_at, end_at, intervals):
                raise InterviewTimeConflictError("время занято, попробуйте другое")

    async def _get_busy_intervals(
        self,
        uow: BotUow,
        curator_user_id: str,
        start_at: datetime,
        end_at: datetime,
        *,
        exclude_interview_id: str | None = None,
    ) -> list[tuple[datetime, datetime]]:
        interviews = await uow.bot_repository.get_interviews_by_curator_user_id(curator_user_id)
        blocking_statuses = {INTERVIEW_STATUS_IN_REVIEW, INTERVIEW_STATUS_CONFIRMED}
        intervals = []
        for interview in interviews:
            if interview.id == exclude_interview_id:
                continue
            if interview.status.code not in blocking_statuses:
                continue
            if interview.date_time is None or interview.end_at is None:
                raise ConfigurationError("Active interview has no start or end time")
            intervals.append((interview.date_time, interview.end_at))

        access_token = await self.oauth_service.get_actual_access_token(curator_user_id)
        calendar_view = await self.graph_client.list_calendar_view(
            params={"startDateTime": start_at.isoformat(), "endDateTime": end_at.isoformat()},
            access_token=access_token,
        )
        for event in calendar_view['value']:
            if event.get('isCancelled') or event.get('showAs') == 'free':
                continue
            intervals.append((
                self._parse_calendar_datetime(event['start']),
                self._parse_calendar_datetime(event['end']),
            ))
        return intervals

    async def add_interview(self, schema: InterviewCreate) -> InterviewResponse:
        start_at, end_at = self._prepare_interview_interval(schema.date_time)
        async with self.uow as uow:
            curator_ids = await self._get_required_curator_ids(uow)
            await self._lock_curators(uow, curator_ids)

            mode = await uow.bot_repository.get_current_mode()
            if mode is None:
                raise ConfigurationError("Bot mode not configured")
            if mode.mode != "recruitment":
                raise RecruitmentClosedError("Набор остановлен. Запись на интервью недоступна.")

            case = await uow.bot_repository.get_bot_case_by_id(schema.case_id, for_update=True)
            if not case:
                raise RecruitmentCaseNotFoundError("данного кейса нет в списке набора!")
            status = await uow.bot_repository.get_interview_status_by_code(
                INTERVIEW_STATUS_IN_REVIEW
            )
            if status is None:
                raise ConfigurationError("IN_REVIEW interview status is not configured")

            await self._check_curators_availability(uow, curator_ids, start_at, end_at)

            interview = Interviews(
                id=str(uuid.uuid4()),
                tg_user_id=schema.tg_user_id,
                case_id=schema.case_id,
                team_name=schema.team_name,
                date_time=start_at,
                end_at=end_at,
                status_id=status.id,
                curators=[InterviewCurators(user_id=user_id) for user_id in curator_ids],
                created_at=datetime.now(UTC)
            )

            interview = await uow.bot_repository.add_interview(interview)
            response = InterviewResponse.model_validate(interview)
            await uow.commit()
            return response

    async def _transit_interview_status(
        self, uow: BotUow, interview_id: str, new_status_code: str
    ) -> Interviews | None:
        interview = await uow.bot_repository.get_interview_by_id_to_update(interview_id)
        if interview is None:
            return None

        allowed = ALLOWED_INTERVIEW_STATUS_TRANSITIONS.get(interview.status.code)
        if allowed is None:
            raise ConfigurationError("Unknown interview status")
        if new_status_code not in allowed:
            raise InvalidInterviewStatusTransitionError(
                f"Cannot change interview status from {interview.status.code} to {new_status_code}"
            )
        status = await uow.bot_repository.get_interview_status_by_code(new_status_code)
        if status is None:
            raise ConfigurationError(f"Interview status {new_status_code} is not configured")
        interview.status = status
        interview.status_id = status.id
        return interview

    async def confirm_interview(
        self, interview_id: str, schema: InterviewConfirm
    ) -> InterviewResponse | None:
        async with self.uow as uow:
            interview = await self._transit_interview_status(uow, interview_id, INTERVIEW_STATUS_CONFIRMED)
            if interview is None:
                return None
            start_at = interview.date_time
            end_at = interview.end_at
            if start_at is None or end_at is None or start_at >= end_at:
                raise ConfigurationError("Interview has an invalid time interval")
            start_at = start_at.astimezone(self.timezone)
            end_at = end_at.astimezone(self.timezone)
            self._check_future_start(start_at)
            if not interview.curators:
                raise ConfigurationError("Interview has no assigned curators")

            curator_ids = []
            for participant in interview.curators:
                curator_ids.append(participant.user_id)
            await self._lock_curators(uow, curator_ids)
            await self._check_curators_availability(
                uow, curator_ids, start_at, end_at, exclude_interview_id=interview.id
            )
            event_link = str(schema.event_link)
            meeting_data = MeetingCreate(
                title=f"Интервью: {interview.team_name}",
                start_at=start_at,
                end_at=end_at,
                location=event_link,
                notes=f'<p>Ссылка на интервью: <a href="{escape(event_link, quote=True)}">{escape(event_link)}</a></p>',
            )
            for participant in interview.curators:
                access_token = await self.oauth_service.get_actual_access_token(participant.user_id)
                event = await self.graph_client.create_meeting(meeting_data, access_token)
                participant.outlook_event_id = event['id']

            interview.event_link = event_link
            interview = await uow.bot_repository.update_interview(interview)
            response = InterviewResponse.model_validate(interview)
            await uow.commit()
            return response

    async def _delete_interview_events(self, interview: Interviews) -> None:
        for participant in interview.curators:
            if not participant.outlook_event_id:
                continue
            access_token = await self.oauth_service.get_actual_access_token(participant.user_id)
            try:
                await self.graph_client.delete_event(
                    event_id=participant.outlook_event_id,
                    access_token=access_token,
                )
            except httpx.HTTPStatusError as err:
                if not self.graph_client._is_missing_graph_event(err):
                    raise
            participant.outlook_event_id = None

    async def cancel_interview(self, interview_id: str) -> InterviewResponse | None:
        async with self.uow as uow:
            interview = await self._transit_interview_status(uow, interview_id, INTERVIEW_STATUS_CANCELLED)
            if interview is None:
                return None
            await self._delete_interview_events(interview)
            interview = await uow.bot_repository.update_interview(interview)
            response = InterviewResponse.model_validate(interview)
            await uow.commit()
            return response

    async def delete_interview(self, interview_id: str):
        async with self.uow as uow:
            interview = await uow.bot_repository.get_interview_by_id_to_update(interview_id)
            if interview is None:
                return None
            await self._delete_interview_events(interview)
            await uow.bot_repository.delete_interview(interview)
            await uow.commit()
            return True

    async def get_all_tg_users(self) -> list[InterviewResponse]:
        return await self.get_all_interviews()

    async def broadcast_message(self, text: str):
        from presentation.telegram.tg_routers import bot
        users = await self.get_all_tg_users()

        success = 0
        failed = 0

        for user in users:
            try:
                await bot.send_message(
                    chat_id=user.tg_user_id,
                    text=text
                )
                success += 1

            except TelegramAPIError:
                logger.exception("Failed to send message to %s", user.tg_user_id)
                failed += 1

        return {
            "total": len(users),
            "success": success,
            "failed": failed
        }

    @staticmethod
    def _parse_calendar_datetime(value: dict[str, str]) -> datetime:
        parsed = datetime.fromisoformat(value['dateTime'])
        if parsed.utcoffset() is None:
            timezone_name = value['timeZone']
            if timezone_name == 'Ekaterinburg Standard Time':
                timezone_name = 'Asia/Yekaterinburg'
            parsed = parsed.replace(tzinfo=ZoneInfo(timezone_name))
        return parsed

    async def get_available_interview_slots(self, date: date) -> list[InterviewSlotResponse]:
        async with self.uow as uow:
            curator_ids = await self._get_required_curator_ids(uow)
            now = datetime.now(self.timezone)
            if date < now.date():
                return []

            day_start, day_end = self._get_day_bounds(date)

            interview_duration = timedelta(minutes=interview_settings.INTERVIEW_DURATION_MINUTES)
            step = timedelta(minutes=interview_settings.INTERVIEW_SLOT_STEP_MINUTES)
            slots_by_curator: dict[str, list[tuple[datetime, datetime]]] = {}
            for user_id in curator_ids:
                busy_intervals = await self._get_busy_intervals(uow, user_id, day_start, day_end)
                slots = []
                interview_start = day_start
                while interview_start + interview_duration <= day_end:
                    interview_end = interview_start + interview_duration
                    is_free = self._is_interval_free(interview_start, interview_end, busy_intervals)
                    if interview_start > now and is_free:
                        slots.append((interview_start, interview_end))
                    interview_start += step
                slots_by_curator[user_id] = slots

            common_slots = []
            first_curator_id = curator_ids[0]
            for slot in slots_by_curator[first_curator_id]:
                is_common = True
                for user_id in curator_ids:
                    if slot not in slots_by_curator[user_id]:
                        is_common = False
                        break
                if is_common:
                    common_slots.append(slot)

            responses = []
            for start, end in common_slots:
                response = InterviewSlotResponse(
                    start_at=start,
                    end_at=end,
                    curator_user_ids=curator_ids,
                )
                responses.append(response)

            return responses
