from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Students, TeamMembers, Teams


TEAM_MEMBERS_LOAD_OPTIONS = (
    selectinload(TeamMembers.student),
)


class TeamMembersRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, team_member: TeamMembers) -> TeamMembers:
        self.db.add(team_member)
        await self.db.commit()
        await self.db.refresh(team_member)

        return team_member

    async def get_by_id(self, team_member_id: str) -> TeamMembers | None:
        team_member = await self.db.execute(
            select(TeamMembers)
            .options(*TEAM_MEMBERS_LOAD_OPTIONS)
            .where(TeamMembers.id == team_member_id)
        )

        return team_member.scalar_one_or_none()

    async def get_by_team_id(self, team_id: str) -> list[TeamMembers]:
        team_members = await self.db.execute(
            select(TeamMembers)
            .options(*TEAM_MEMBERS_LOAD_OPTIONS)
            .where(TeamMembers.team_id == team_id)
        )

        return team_members.scalars().all()

    async def get_current_by_team_id(self, team_id: str) -> list[TeamMembers]:
        team_members = await self.db.execute(
            select(TeamMembers)
            .options(*TEAM_MEMBERS_LOAD_OPTIONS)
            .where(
                TeamMembers.team_id == team_id,
                TeamMembers.is_current.is_(True)
            )
        )

        return team_members.scalars().all()

    async def get_current_by_student_id(self, student_id: str) -> TeamMembers | None:
        team_member = await self.db.execute(
            select(TeamMembers)
            .options(*TEAM_MEMBERS_LOAD_OPTIONS)
            .where(
                TeamMembers.student_id == student_id,
                TeamMembers.is_current.is_(True)
            )
        )

        return team_member.scalar_one_or_none()

    async def get_current_by_team_and_student(
            self,
            team_id: str,
            student_id: str
    ) -> TeamMembers | None:
        team_member = await self.db.execute(
            select(TeamMembers)
            .options(*TEAM_MEMBERS_LOAD_OPTIONS)
            .where(
                TeamMembers.team_id == team_id,
                TeamMembers.student_id == student_id,
                TeamMembers.is_current.is_(True)
            )
        )

        return team_member.scalar_one_or_none()

    async def update(self) -> None:
        await self.db.commit()

    async def delete(self, team_member: TeamMembers) -> None:
        await self.db.delete(team_member)
        await self.db.commit()

    async def delete_by_id(self, team_member_id: str) -> None:
        await self.db.execute(
            delete(TeamMembers)
            .where(TeamMembers.id == team_member_id)
        )
        await self.db.commit()

    async def verify_team(self, team_id: str) -> bool:
        team = await self.db.execute(
            select(Teams)
            .where(Teams.id == team_id)
        )

        return team.scalar_one_or_none() is not None

    async def verify_student(self, student_id: str) -> bool:
        student = await self.db.execute(
            select(Students)
            .where(Students.id == student_id)
        )

        return student.scalar_one_or_none() is not None
