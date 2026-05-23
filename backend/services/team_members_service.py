import uuid
from datetime import UTC, datetime

from models import TeamMembers
from repositories.team_members_repository import TeamMembersRepository
from schemas.team_members import TeamMemberResponse


class TeamMembersService:

    def __init__(self, team_members_repo: TeamMembersRepository):
        self.team_members_repo = team_members_repo

    async def add_member(
            self,
            team_id: str,
            student_id: str,
            position: str,
            joined_at: datetime | None = None
    ) -> TeamMembers:
        if not await self.team_members_repo.verify_team(team_id):
            raise ValueError('Team not found')

        if not await self.team_members_repo.verify_student(student_id):
            raise ValueError('Student not found')

        existing_member = await self.team_members_repo.get_current_by_team_and_student(
            team_id=team_id,
            student_id=student_id
        )

        if existing_member:
            raise ValueError('Student is already a current member of this team')

        current_student_membership = await self.team_members_repo.get_current_by_student_id(student_id)

        if current_student_membership:
            raise ValueError('Student is already a current member of another team')

        if joined_at is None:
            joined_at = datetime.now(UTC)

        team_member = TeamMembers(
            id=str(uuid.uuid4()),
            team_id=team_id,
            student_id=student_id,
            position=position,
            joined_at=joined_at,
            is_current=True
        )

        created_member = await self.team_members_repo.create(team_member)
        return await self.team_members_repo.get_by_id(created_member.id)

    async def get_member(self, team_member_id: str) -> TeamMembers | None:
        return await self.team_members_repo.get_by_id(team_member_id)

    async def get_team_members(
            self,
            team_id: str,
            current_only: bool = True
    ) -> list[TeamMembers]:
        if not await self.team_members_repo.verify_team(team_id):
            raise ValueError('Team not found')

        if current_only:
            return await self.team_members_repo.get_current_by_team_id(team_id)

        return await self.team_members_repo.get_by_team_id(team_id)

    async def get_team_members_response(
            self,
            team_id: str,
            current_only: bool = True
    ) -> list[TeamMemberResponse]:
        team_members = await self.get_team_members(
            team_id=team_id,
            current_only=current_only
        )

        return [
            self.to_response(team_member)
            for team_member in team_members
        ]

    async def end_membership(
            self,
            team_member_id: str,
            left_at: datetime | None = None
    ) -> TeamMembers | None:
        team_member = await self.team_members_repo.get_by_id(team_member_id)

        if not team_member:
            return None

        if not team_member.is_current:
            raise ValueError('Team membership is already ended')

        if left_at is None:
            left_at = datetime.now(UTC)

        if left_at < team_member.joined_at:
            raise ValueError('Membership end date cannot be earlier than join date')

        team_member.left_at = left_at
        team_member.is_current = False

        await self.team_members_repo.update()

        return team_member

    async def delete_member(self, team_member_id: str) -> bool | None:
        team_member = await self.team_members_repo.get_by_id(team_member_id)

        if not team_member:
            return None

        await self.team_members_repo.delete(team_member)

        return True

    @staticmethod
    def to_response(team_member: TeamMembers) -> TeamMemberResponse:
        return TeamMemberResponse(
            id=team_member.id,
            team_id=team_member.team_id,
            student_id=team_member.student_id,
            student_name=team_member.student.name if team_member.student else None,
            position=team_member.position,
            joined_at=team_member.joined_at,
            left_at=team_member.left_at,
            is_current=team_member.is_current
        )
