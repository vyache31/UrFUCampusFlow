from datetime import date, datetime, UTC, time, timedelta
from zoneinfo import ZoneInfo
import logging
import uuid

import httpx
from application.exceptions.base import ApplicationValidationError, ConfigurationError, ConflictError
from application.exceptions.bot import (
    InterviewTimeConflictError,
    InvalidBotModeError,
    RecruitmentCaseNotFoundError,
    RecruitmentClosedError,
    RecruitmentCuratorNotFound
)
from application.interfaces.integrations import (
    MicrosoftAccessTokenProviderProtocol,
    MicrosoftGraphClientProtocol,
)
from application.interfaces.uow.bot_uow_protocol import BotUow
from infrastructure.db.models.bot import (
    BotCases,
    RecruitmentCurators,
    Interviews
)
from presentation.api.schemas.bot_schemas import (
    BotCaseCreate,
    BotCaseResponse,
    BotModeResponse,
    InterviewSlotResponse,
    RecruitmentCuratorCreate,
    RecruitmentCuratorResponse,
    InterviewCreate,
    InterviewResponse,
)
from aiogram.exceptions import TelegramAPIError

from application.services.const import interview_settings
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

    async def add_interview(self, schema: InterviewCreate) -> InterviewResponse:
        if schema.date_time.utcoffset() is None:
            raise ApplicationValidationError("Interview date must include a timezone")
        if not schema.curator_user_id:
            raise ApplicationValidationError("Interview curator is required")

        tz = ZoneInfo(interview_settings.INTERVIEW_TIMEZONE)
        start_at = schema.date_time.astimezone(tz)
        end_at = start_at + timedelta(minutes=interview_settings.INTERVIEW_DURATION_MINUTES)
        day_start = datetime.combine(
            start_at.date(), time(hour=interview_settings.INTERVIEW_START_HOUR), tzinfo=tz
        )
        day_end = datetime.combine(
            start_at.date(), time(hour=interview_settings.INTERVIEW_END_HOUR), tzinfo=tz
        )
        if start_at <= datetime.now(tz):
            raise ApplicationValidationError("Interview must start in the future")
        if start_at < day_start or end_at > day_end:
            raise ApplicationValidationError("Interview must fit within recruitment hours")
        if (start_at - day_start) % timedelta(minutes=interview_settings.INTERVIEW_SLOT_STEP_MINUTES):
            raise ApplicationValidationError("Interview start must match the available slot grid")

        async with self.uow as uow:
            # Serialize bookings for this curator even when no interviews exist yet.
            curator = await uow.user_repository.get_by_id(schema.curator_user_id, for_update=True)
            if curator is None:
                raise RecruitmentCuratorNotFound('This curator not found in recruitment list')
            curators = await uow.bot_repository.get_all_recruitment_curators()

            if schema.curator_user_id not in [curator.user_id for curator in curators]:
                raise RecruitmentCuratorNotFound('This curator not found in recruitment list')

            mode = await uow.bot_repository.get_current_mode()
            if mode is None:
                raise ConfigurationError("Bot mode not configured")
            if mode.mode != "recruitment":
                raise RecruitmentClosedError("Набор остановлен. Запись на интервью недоступна.")

            case = await uow.bot_repository.get_bot_case_by_id(schema.case_id, for_update=True)
            if not case:
                raise RecruitmentCaseNotFoundError("данного кейса нет в списке набора!")
            interviews = await uow.bot_repository.get_overlapping_interviews(
                curator_user_id=schema.curator_user_id,
                start_at=start_at,
                end_at=end_at,
            )

            if interviews:
                raise InterviewTimeConflictError("время занято, попробуйте другое")

            access_token = await self.oauth_service.get_actual_access_token(schema.curator_user_id)
            calendar_view = await self.graph_client.list_calendar_view(
                params={"startDateTime": start_at.isoformat(), "endDateTime": end_at.isoformat()},
                access_token=access_token,
            )
            for event in calendar_view['value']:
                if event.get('isCancelled') or event.get('showAs') == 'free':
                    continue
                event_start = self._parse_calendar_datetime(event['start'])
                event_end = self._parse_calendar_datetime(event['end'])
                if event_start < end_at and event_end > start_at:
                    raise InterviewTimeConflictError("время занято, попробуйте другое")

            if start_at <= datetime.now(tz):
                raise ApplicationValidationError("Interview must start in the future")

            meeting_data = MeetingCreate(
                title='Interview',
                start_at=start_at,
                location='Контур Толк',
                end_at=end_at,
            )

            outlook_event = await self.graph_client.create_meeting(
                meeting_data=meeting_data,
                access_token=access_token
            )

            interview = Interviews(
                id=str(uuid.uuid4()),
                tg_user_id=schema.tg_user_id,
                case_id=schema.case_id,
                team_name=schema.team_name,
                date_time=start_at,
                end_at=end_at,
                outlook_event_id=outlook_event['id'],
                curator_user_id=schema.curator_user_id,
                created_at=datetime.now(UTC)
            )

            interview = await uow.bot_repository.add_interview(interview)
            response = InterviewResponse.model_validate(interview)
            await uow.commit()
            return response

    async def delete_interview(self, interview_id: str):
        async with self.uow as uow:
            interview = await uow.bot_repository.get_interview_by_id_to_update(interview_id)

            if not interview:
                return None

            if interview.outlook_event_id:
                if not interview.curator_user_id:
                    raise ConfigurationError("Outlook interview has no calendar owner")
                access_token = await self.oauth_service.get_actual_access_token(interview.curator_user_id)
                try:
                    await self.graph_client.delete_event(
                        event_id=interview.outlook_event_id,
                        access_token=access_token,
                    )
                except httpx.HTTPStatusError as err:
                    if not self.graph_client._is_missing_graph_event(err):
                        raise

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

    async def get_available_interview_slots(self, curator_user_id: str, date: date) -> list[InterviewSlotResponse]:
        async with self.uow as uow:
            curators = await uow.bot_repository.get_all_recruitment_curators()

            if curator_user_id not in [curator.user_id for curator in curators]:
                raise RecruitmentCuratorNotFound('This curator not found in recruitment list')

            tz = ZoneInfo(interview_settings.INTERVIEW_TIMEZONE)
            now = datetime.now(tz)
            if date < now.date():
                return []

            access_token = await self.oauth_service.get_actual_access_token(curator_user_id)

            day_start = datetime.combine(
                 date = date,
                 time = time(hour=interview_settings.INTERVIEW_START_HOUR),
                 tzinfo=tz
             )

            day_end = datetime.combine(
                 date=date,
                 time = time(hour=interview_settings.INTERVIEW_END_HOUR),
                 tzinfo=tz
             )

            calendar_view = await self.graph_client.list_calendar_view(
                params={
                    'startDateTime': str(day_start.isoformat()),
                    'endDateTime': str(day_end.isoformat()),
                },
                access_token=access_token
            )

            events_from_response = calendar_view.get('value', [])
            events = [event for event in events_from_response if event['isCancelled'] != True and event['showAs'] != 'free']
            busy_intervals = [
                (
                    self._parse_calendar_datetime(event['start']).astimezone(tz),
                    self._parse_calendar_datetime(event['end']).astimezone(tz),
                )
                for event in events
            ]

            interview_start = day_start

            interview_duration = timedelta(minutes=interview_settings.INTERVIEW_DURATION_MINUTES)
            slots = []

            while interview_start + interview_duration <= day_end:
                for event_start, event_end in busy_intervals:
                    if interview_start < event_end and interview_start + interview_duration > event_start:
                        break
                else:
                    if interview_start > datetime.now(tz):
                        slots.append((interview_start, interview_start + interview_duration))

                interview_start = interview_start + timedelta(
                    minutes=interview_settings.INTERVIEW_SLOT_STEP_MINUTES
                )

            responses = []

            for slot in slots:
                response = InterviewSlotResponse(
                    start_at = slot[0],
                    end_at = slot[1],
                    curator_user_id=curator_user_id
                )

                responses.append(response)

            return responses
