from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models.bot import BotMode, BotCases, RecruitmentCurators, Interviews


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
        await self.db.commit()


    async def get_all_bot_cases(self):
        bot_cases = await self.db.execute(
            select(BotCases)
        )

        return bot_cases.scalars().all()


    async def add_bot_case(self, bot_case: BotCases):
        self.db.add(bot_case)
        await self.db.commit()

        return bot_case


    async def delete_bot_case(self, bot_case: BotCases):
        await self.db.delete(bot_case)
        await self.db.commit()


    async def get_all_recruitment_curators(self):
        curators = await self.db.execute(
            select(RecruitmentCurators)
        )

        return curators.scalars().all()


    async def add_recruitment_curator(self, curator: RecruitmentCurators):
        self.db.add(curator)
        await self.db.commit()

        return curator


    async def delete_recruitment_curator(self, curator: RecruitmentCurators):
        await self.db.delete(curator)
        await self.db.commit()


    async def get_all_interviews(self):
        interviews = await self.db.execute(
            select(Interviews)
        )

        return interviews.scalars().all()

    async def add_interview(self, interview: Interviews):
        self.db.add(interview)
        await self.db.commit()

        return interview

    async def delete_interview(self, interview: Interviews):
        await self.db.delete(interview)
        await self.db.commit()
