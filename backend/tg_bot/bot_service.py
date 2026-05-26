from datetime import datetime, UTC
import uuid
from tg_bot.models.bot import (
    BotMode,
    BotCases,
    RecruitmentCurators,
    Interviews
)
from tg_bot.bot_schemas import (
    BotCaseCreate,
    RecruitmentCuratorCreate,
    InterviewCreate
)


class BotService:

    def __init__(self, bot_repo):
        self.bot_repo = bot_repo

    async def get_current_mode(self) -> BotMode | None:
        return await self.bot_repo.get_current_mode()

    async def change_current_mode(self, mode: str) -> BotMode | None:
        current_mode = await self.bot_repo.get_current_mode()

        if not current_mode:
            return None

        allowed_modes = ["stop", "recruitment"]

        if mode not in allowed_modes:
            raise ValueError("Invalid bot mode")

        current_mode.mode = mode
        current_mode.updated_at = datetime.now(UTC)

        await self.bot_repo.change_current_mode()

        return current_mode

    async def _check_stop_mode(self):
        current_mode = await self.bot_repo.get_current_mode()

        if current_mode.mode != "stop":
            raise PermissionError(
                "редактирование невозможно! измените режим"
            )

    async def get_all_bot_cases(self):
        return await self.bot_repo.get_all_bot_cases()

    async def get_bot_case_by_id(self, bot_case_id: str):
        return await self.bot_repo.get_bot_case_by_id(bot_case_id)

    async def add_bot_case(self, schema: BotCaseCreate):
        await self._check_stop_mode()

        bot_case = BotCases(
            id=str(uuid.uuid4()),
            case_id=schema.case_id,
            created_at=datetime.now(UTC)
        )
        return await self.bot_repo.add_bot_case(bot_case)

    async def delete_bot_case(self, bot_case_id: str):
        await self._check_stop_mode()

        bot_case = await self.bot_repo.get_bot_case_by_id(bot_case_id)
        if not bot_case:
            return None

        await self.bot_repo.delete_bot_case(bot_case)

        return True

    async def get_all_recruitment_curators(self):
        return await self.bot_repo.get_all_recruitment_curators()

    async def get_recruitment_curator_by_id(self, curator_id: str):
        return await self.bot_repo.get_recruitment_curator_by_id(curator_id)

    async def add_recruitment_curator(
        self,
        schema: RecruitmentCuratorCreate
    ):

        await self._check_stop_mode()

        curator = RecruitmentCurators(
            id=str(uuid.uuid4()),
            user_id=schema.curator_id,
            created_at=datetime.now(UTC)
        )
        return await self.bot_repo.add_recruitment_curator(
            curator
        )

    async def delete_recruitment_curator(
        self,
        curator_id: str
    ):

        await self._check_stop_mode()

        curator = await self.bot_repo.get_recruitment_curator_by_id(curator_id)
        if not curator:
            return None

        await self.bot_repo.delete_recruitment_curator(
            curator
        )

        return True

    async def get_all_interviews(self):
        return await self.bot_repo.get_all_interviews()

    async def get_interview_by_id(self, interview_id: str):
        return await self.bot_repo.get_interview_by_id(interview_id)

    async def add_interview(self, schema: InterviewCreate):
        case = await self.bot_repo.get_bot_case_by_id(schema.case_id)
        if not case:
            raise ValueError("данного кейса нет в списке набора!")
        interview = Interviews(
            id=str(uuid.uuid4()),
            tg_user_id=schema.tg_user_id,
            case_id=schema.case_id,
            team_name=schema.team_name,
            date_time=schema.date_time,
            created_at=datetime.now(UTC)
        )
        return await self.bot_repo.add_interview(interview)

    async def delete_interview(self, interview_id: str):
        interview = await self.bot_repo.get_interview_by_id(interview_id)
        if not interview:
            return None

        await self.bot_repo.delete_interview(interview)

        return True