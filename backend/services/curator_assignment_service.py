import uuid
from datetime import UTC, datetime

from models import CuratorAssignment
from repositories.curator_assignments_repository import CuratorAssignmentsRepository
from schemas.curators_schemas import CuratorAssignmentCreate, CuratorAssignmentResponse


class CuratorAssignmentService:
    def __init__(self, repo: CuratorAssignmentsRepository):
        self.repo = repo

    async def assign_curator(
        self, schema: CuratorAssignmentCreate
    ) -> CuratorAssignmentResponse:
        if not await self.repo.verify_user(schema.user_id):
            raise ValueError('User not found')

        if not await self.repo.verify_team_case_history(schema.team_case_history_id):
            raise ValueError('Team case history not found')

        existing_assignment = await self.repo.get_current_by_user_and_team_case_history(
            user_id=schema.user_id,
            team_case_history_id=schema.team_case_history_id,
        )

        if existing_assignment:
            raise ValueError('Curator already has current assignment for this team case history')

        curator_assignment = CuratorAssignment(
            id=str(uuid.uuid4()),
            user_id=schema.user_id,
            team_case_history_id=schema.team_case_history_id,
            assigned_at=datetime.now(UTC),
            unassigned_at=None,
            is_current=True,
        )

        await self.repo.create(curator_assignment)

        return self._to_response(curator_assignment)

    async def unassign_curator(
        self, assignment_id: str
    ) -> CuratorAssignmentResponse:
        assignment = await self.repo.get_by_id(assignment_id)

        if not assignment:
            raise ValueError('Curator assignment not found')

        if not assignment.is_current:
            raise ValueError('Curator assignment is already ended')

        assignment.is_current = False
        assignment.unassigned_at = datetime.now(UTC)

        await self.repo.update(assignment)

        return self._to_response(assignment)

    async def get_assignment_by_id(
        self, assignment_id: str
    ) -> CuratorAssignmentResponse:
        assignment = await self.repo.get_by_id(assignment_id)

        if not assignment:
            raise ValueError('Curator assignment not found')

        return self._to_response(assignment)

    async def get_by_user_id(
        self, user_id: str
    ) -> list[CuratorAssignmentResponse]:
        assignments = await self.repo.get_by_user_id(user_id)

        return [
            self._to_response(assignment)
            for assignment in assignments
        ]

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[CuratorAssignmentResponse]:
        assignments = await self.repo.get_by_team_case_history_id(
            team_case_history_id
        )

        return [
            self._to_response(assignment)
            for assignment in assignments
        ]

    async def get_current_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[CuratorAssignmentResponse]:
        assignments = await self.repo.get_current_by_team_case_history_id(
            team_case_history_id
        )

        return [
            self._to_response(assignment)
            for assignment in assignments
        ]

    async def get_current_by_user_and_team_case_history(
        self, user_id: str, team_case_history_id: str
    ) -> CuratorAssignmentResponse:
        assignment = await self.repo.get_current_by_user_and_team_case_history(
            user_id=user_id,
            team_case_history_id=team_case_history_id,
        )

        if not assignment:
            raise ValueError('Current curator assignment not found')

        return self._to_response(assignment)

    @staticmethod
    def _to_response(assignment: CuratorAssignment) -> CuratorAssignmentResponse:
        return CuratorAssignmentResponse(
            id=assignment.id,
            user_id=assignment.user_id,
            team_case_history_id=assignment.team_case_history_id,
            assigned_at=assignment.assigned_at,
            unassigned_at=assignment.unassigned_at,
            is_current=assignment.is_current,
        )
