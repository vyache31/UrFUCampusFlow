from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from infrastructure.db.models import CuratorAssignment


CURATOR_ASSIGNMENT_LOAD_OPTIONS = (
    selectinload(CuratorAssignment.user),
    selectinload(CuratorAssignment.team_case_history),
)


class CuratorAssignmentsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, curator_assignment: CuratorAssignment) -> CuratorAssignment:
        self.db.add(curator_assignment)
        await self.db.flush()
        await self.db.refresh(curator_assignment)

        return curator_assignment

    async def get_by_id(
        self, curator_assignment_id: str
    ) -> CuratorAssignment | None:
        curator_assignment = await self.db.execute(
            select(CuratorAssignment)
            .options(*CURATOR_ASSIGNMENT_LOAD_OPTIONS)
            .where(CuratorAssignment.id == curator_assignment_id)
        )

        return curator_assignment.scalar_one_or_none()

    async def get_by_user_id(self, user_id: str) -> list[CuratorAssignment]:
        curator_assignments = await self.db.execute(
            select(CuratorAssignment)
            .options(*CURATOR_ASSIGNMENT_LOAD_OPTIONS)
            .where(CuratorAssignment.user_id == user_id)
        )

        return list(curator_assignments.scalars().all())

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[CuratorAssignment]:
        curator_assignments = await self.db.execute(
            select(CuratorAssignment)
            .options(*CURATOR_ASSIGNMENT_LOAD_OPTIONS)
            .where(CuratorAssignment.team_case_history_id == team_case_history_id)
        )

        return list(curator_assignments.scalars().all())

    async def get_current_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[CuratorAssignment]:
        curator_assignments = await self.db.execute(
            select(CuratorAssignment)
            .options(*CURATOR_ASSIGNMENT_LOAD_OPTIONS)
            .where(
                CuratorAssignment.team_case_history_id == team_case_history_id,
                CuratorAssignment.is_current.is_(True),
            )
        )

        return list(curator_assignments.scalars().all())

    async def get_current_by_user_and_team_case_history(
        self, user_id: str, team_case_history_id: str
    ) -> CuratorAssignment | None:
        curator_assignment = await self.db.execute(
            select(CuratorAssignment)
            .options(*CURATOR_ASSIGNMENT_LOAD_OPTIONS)
            .where(
                CuratorAssignment.user_id == user_id,
                CuratorAssignment.team_case_history_id == team_case_history_id,
                CuratorAssignment.is_current.is_(True),
            )
        )

        return curator_assignment.scalar_one_or_none()

    async def update(self, curator_assignment: CuratorAssignment) -> CuratorAssignment:
        await self.db.flush()
        await self.db.refresh(curator_assignment)

        return curator_assignment

    async def delete(self, curator_assignment: CuratorAssignment) -> None:
        await self.db.delete(curator_assignment)
        await self.db.flush()

    async def delete_by_id(self, curator_assignment_id: str) -> None:
        await self.db.execute(
            delete(CuratorAssignment).where(
                CuratorAssignment.id == curator_assignment_id
            )
        )
        await self.db.flush()
