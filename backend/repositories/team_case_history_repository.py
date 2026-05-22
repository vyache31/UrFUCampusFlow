from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import CaseSemesters, TeamCaseHistory, Teams


TEAM_CASE_HISTORY_LOAD_OPTIONS = (
    selectinload(TeamCaseHistory.case_semester)
    .selectinload(CaseSemesters.case),
    selectinload(TeamCaseHistory.case_semester)
    .selectinload(CaseSemesters.semester),
)


class TeamCaseHistoryRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, team_case_history: TeamCaseHistory) -> TeamCaseHistory:
        self.db.add(team_case_history)
        await self.db.commit()
        await self.db.refresh(team_case_history)

        return team_case_history

    async def get_by_id(self, team_case_history_id: str) -> TeamCaseHistory | None:
        team_case_history = await self.db.execute(
            select(TeamCaseHistory)
            .options(*TEAM_CASE_HISTORY_LOAD_OPTIONS)
            .where(TeamCaseHistory.id == team_case_history_id)
        )

        return team_case_history.scalar_one_or_none()

    async def get_by_team_id(self, team_id: str) -> list[TeamCaseHistory]:
        team_case_history = await self.db.execute(
            select(TeamCaseHistory)
            .options(*TEAM_CASE_HISTORY_LOAD_OPTIONS)
            .where(TeamCaseHistory.team_id == team_id)
        )

        return team_case_history.scalars().all()

    async def get_current_by_team_id(self, team_id: str) -> TeamCaseHistory | None:
        team_case_history = await self.db.execute(
            select(TeamCaseHistory)
            .options(*TEAM_CASE_HISTORY_LOAD_OPTIONS)
            .where(
                TeamCaseHistory.team_id == team_id,
                TeamCaseHistory.is_current.is_(True)
            )
        )

        return team_case_history.scalar_one_or_none()

    async def get_by_case_semester_id(self, case_semesters_id: str) -> list[TeamCaseHistory]:
        team_case_history = await self.db.execute(
            select(TeamCaseHistory)
            .options(*TEAM_CASE_HISTORY_LOAD_OPTIONS)
            .where(TeamCaseHistory.case_semesters_id == case_semesters_id)
        )

        return team_case_history.scalars().all()

    async def get_current_by_team_and_case_semester(
            self,
            team_id: str,
            case_semesters_id: str
    ) -> TeamCaseHistory | None:
        team_case_history = await self.db.execute(
            select(TeamCaseHistory)
            .options(*TEAM_CASE_HISTORY_LOAD_OPTIONS)
            .where(
                TeamCaseHistory.team_id == team_id,
                TeamCaseHistory.case_semesters_id == case_semesters_id,
                TeamCaseHistory.is_current.is_(True)
            )
        )

        return team_case_history.scalar_one_or_none()

    async def update(self) -> None:
        await self.db.commit()

    async def delete(self, team_case_history: TeamCaseHistory) -> None:
        await self.db.delete(team_case_history)
        await self.db.commit()

    async def delete_by_id(self, team_case_history_id: str) -> None:
        await self.db.execute(
            delete(TeamCaseHistory)
            .where(TeamCaseHistory.id == team_case_history_id)
        )
        await self.db.commit()

    async def verify_team(self, team_id: str) -> bool:
        team = await self.db.execute(
            select(Teams)
            .where(Teams.id == team_id)
        )

        return team.scalar_one_or_none() is not None

    async def verify_case_semester(self, case_semesters_id: str) -> bool:
        case_semester = await self.db.execute(
            select(CaseSemesters)
            .where(CaseSemesters.id == case_semesters_id)
        )

        return case_semester.scalar_one_or_none() is not None
