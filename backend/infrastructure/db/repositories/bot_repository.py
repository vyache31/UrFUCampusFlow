from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from infrastructure.db.models.bot import (
    BotMode, BotCases, RecruitmentCurators, Interviews, InterviewCurators, InterviewStatuses,
)


INTERVIEW_LOAD_OPTIONS = (
    selectinload(Interviews.status),
    selectinload(Interviews.curators),
)


class BotRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_current_mode(self) -> BotMode | None:
        mode = await self.db.execute(
            select(BotMode)
            .where(BotMode.id == 1)
        )

        return mode.scalar_one_or_none()


    async def change_current_mode(self):
        await self.db.flush()


    async def get_all_bot_cases(self):
        bot_cases = await self.db.execute(
            select(BotCases)
        )

        return bot_cases.scalars().all()


    async def get_bot_case_by_id(self, case_id: str, *, for_update: bool = False):
        stmt = (
            select(BotCases)
            .where(BotCases.id == case_id)
        )
        if for_update:
            stmt = stmt.with_for_update()
        case = await self.db.execute(stmt)

        return case.scalar_one_or_none()

    async def has_interviews_for_bot_case(self, bot_case_id: str) -> bool:
        result = await self.db.execute(
            select(select(Interviews.id).where(Interviews.case_id == bot_case_id).exists())
        )
        return result.scalar_one()

    async def get_bot_case_by_case_id(self, case_id: str):
        case = await self.db.execute(
            select(BotCases)
            .where(BotCases.case_id == case_id)
        )

        return case.scalar_one_or_none()

    async def add_bot_case(self, bot_case: BotCases):
        self.db.add(bot_case)
        await self.db.flush()

        return bot_case


    async def delete_bot_case(self, bot_case: BotCases):
        await self.db.delete(bot_case)
        await self.db.flush()


    async def get_all_recruitment_curators(self):
        curators = await self.db.execute(
            select(RecruitmentCurators)
        )

        return curators.scalars().all()

    async def get_recruitment_curator_by_id(self, curator_id: str):
        curator = await self.db.execute(
            select(RecruitmentCurators)
            .where(RecruitmentCurators.id == curator_id)
        )

        return curator.scalar_one_or_none()

    async def add_recruitment_curator(self, curator: RecruitmentCurators):
        self.db.add(curator)
        await self.db.flush()

        return curator


    async def delete_recruitment_curator(self, curator: RecruitmentCurators):
        await self.db.delete(curator)
        await self.db.flush()


    async def get_interview_status_by_code(self, code: str) -> InterviewStatuses | None:
        result = await self.db.execute(
            select(InterviewStatuses).where(InterviewStatuses.code == code)
        )
        return result.scalar_one_or_none()

    async def get_all_interviews(self) -> list[Interviews]:
        interviews = await self.db.execute(
            select(Interviews)
            .options(*INTERVIEW_LOAD_OPTIONS)
        )

        return list(interviews.scalars().all())

    async def get_interview_by_id(self, interview_id: str) -> Interviews | None:
        interview = await self.db.execute(
            select(Interviews)
            .options(*INTERVIEW_LOAD_OPTIONS)
            .where(Interviews.id == interview_id)
        )

        return interview.scalar_one_or_none()

    async def add_interview(self, interview: Interviews) -> Interviews:
        self.db.add(interview)
        await self.db.flush()
        await self.db.refresh(interview, attribute_names=['status', 'curators'])

        return interview

    async def update_interview(self, interview: Interviews) -> Interviews:
        await self.db.flush()
        await self.db.refresh(interview, attribute_names=['status', 'curators'])
        return interview

    async def delete_interview(self, interview: Interviews) -> None:
        await self.db.delete(interview)
        await self.db.flush()

    async def get_recuitment_curator_by_user_id(
        self, user_id: str
    ) -> RecruitmentCurators | None:
        curator = await self.db.execute(
            select(RecruitmentCurators)
            .where(RecruitmentCurators.user_id == user_id)
        )

        return curator.scalar_one_or_none()

    async def get_interviews_by_curator_user_id(self, user_id: str) -> list[Interviews]:
        result = await self.db.execute(
            select(Interviews)
            .join(InterviewCurators, InterviewCurators.interview_id == Interviews.id)
            .options(*INTERVIEW_LOAD_OPTIONS)
            .where(InterviewCurators.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_interview_by_id_to_update(self, interview_id: str) -> Interviews | None:
        interview = await self.db.execute(
            select(Interviews)
            .options(*INTERVIEW_LOAD_OPTIONS)
            .where(Interviews.id == interview_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        return interview.scalar_one_or_none()
