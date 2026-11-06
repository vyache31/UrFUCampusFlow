from datetime import datetime, UTC
import logging
import uuid
from application.exceptions.base import ConfigurationError, ConflictError
from application.exceptions.bot import (
    InterviewTimeConflictError,
    InvalidBotModeError,
    RecruitmentCaseNotFoundError,
    RecruitmentClosedError,
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
    RecruitmentCuratorCreate,
    RecruitmentCuratorResponse,
    InterviewCreate,
    InterviewResponse,
)
from aiogram.exceptions import TelegramAPIError


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

            bot_case = await uow.bot_repository.get_bot_case_by_id(bot_case_id)
            if not bot_case:
                return None

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

    async def get_interview_by_datetime(self, date_time: datetime):
        async with self.uow as uow:
            interview = await uow.bot_repository.get_interview_by_datetime(date_time)
            if interview:
                raise InterviewTimeConflictError("время занято, попробуйте другое")


    async def add_interview(self, schema: InterviewCreate) -> InterviewResponse:
        async with self.uow as uow:
            mode = await uow.bot_repository.get_current_mode()
            if mode is None:
                raise ConfigurationError("Bot mode not configured")
            if mode.mode != "recruitment":
                raise RecruitmentClosedError("Набор остановлен. Запись на интервью недоступна.")

            case = await uow.bot_repository.get_bot_case_by_id(schema.case_id)
            if not case:
                raise RecruitmentCaseNotFoundError("данного кейса нет в списке набора!")
            interview = await uow.bot_repository.get_interview_by_datetime(schema.date_time)
            if interview:
                raise InterviewTimeConflictError("время занято, попробуйте другое")

            interview = Interviews(
                id=str(uuid.uuid4()),
                tg_user_id=schema.tg_user_id,
                case_id=schema.case_id,
                team_name=schema.team_name,
                date_time=schema.date_time,
                curator_user_id=schema.curator_user_id,
                created_at=datetime.now(UTC)
            )
            interview = await uow.bot_repository.add_interview(interview)
            response = InterviewResponse.model_validate(interview)
            await uow.commit()
            return response

    async def delete_interview(self, interview_id: str):
        async with self.uow as uow:
            interview = await uow.bot_repository.get_interview_by_id(interview_id)
            if not interview:
                return None

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
