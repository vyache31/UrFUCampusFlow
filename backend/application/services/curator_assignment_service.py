import uuid
from datetime import UTC, datetime

from application.exceptions.curator import (
    CuratorAssignmentAlreadyEndedError,
    CuratorAssignmentAlreadyExistsError,
    CuratorAssignmentNotFoundError,
    UserIsNotCuratorError,
)
from application.exceptions.resources import UserNotFoundError
from application.exceptions.team import TeamNotFoundError
from application.interfaces.uow.curator_assignment_uow_protocol import (
    CuratorAssignmentUoWProtocol,
)
from infrastructure.db.models import CuratorAssignment
from presentation.api.schemas.curators_schemas import (
    CuratorAssignmentCreate,
    CuratorAssignmentResponse,
)


class CuratorAssignmentService:
    def __init__(self, uow: CuratorAssignmentUoWProtocol):
        self.uow = uow

    async def assign_curator(
        self,
        schema: CuratorAssignmentCreate,
    ) -> CuratorAssignmentResponse:
        async with self.uow as uow:
            user = await uow.user_repository.get_by_id(schema.user_id)

            if not user:
                raise UserNotFoundError("Curator user not found")

            if not user.role or user.role.code != "CURATOR":
                raise UserIsNotCuratorError("User does not have the curator role")

            team = await uow.team_repository.get_by_id(
                schema.team_id
            )

            if not team:
                raise TeamNotFoundError("Team not found")

            repository = uow.curator_assignments_repository
            existing_assignment = await (
                repository.get_current_by_user_and_team(
                    user_id=schema.user_id,
                    team_id=schema.team_id,
                )
            )

            if existing_assignment:
                raise CuratorAssignmentAlreadyExistsError(
                    "Curator already has current assignment for this team"
                )

            curator_assignment = CuratorAssignment(
                id=str(uuid.uuid4()),
                user_id=schema.user_id,
                team_id=schema.team_id,
                assigned_at=datetime.now(UTC),
                unassigned_at=None,
                is_current=True,
            )

            curator_assignment = await repository.create(curator_assignment)
            await uow.commit()

            return self._to_response(curator_assignment)

    async def unassign_curator(
        self,
        assignment_id: str,
        team_id: str,
    ) -> CuratorAssignmentResponse | None:
        async with self.uow as uow:
            assignment = await uow.curator_assignments_repository.get_by_id(
                assignment_id
            )

            if (
                not assignment
                or assignment.team_id != team_id
            ):
                return None

            if not assignment.is_current:
                raise CuratorAssignmentAlreadyEndedError(
                    "Curator assignment is already ended"
                )

            assignment.is_current = False
            assignment.unassigned_at = datetime.now(UTC)

            assignment = await uow.curator_assignments_repository.update(assignment)
            await uow.commit()

            return self._to_response(assignment)

    async def get_assignment_by_id(
        self,
        assignment_id: str,
    ) -> CuratorAssignmentResponse:
        async with self.uow as uow:
            assignment = await uow.curator_assignments_repository.get_by_id(
                assignment_id
            )

            if not assignment:
                raise CuratorAssignmentNotFoundError("Curator assignment not found")

            return self._to_response(assignment)

    async def get_by_user_id(
        self,
        user_id: str,
    ) -> list[CuratorAssignmentResponse]:
        async with self.uow as uow:
            assignments = await uow.curator_assignments_repository.get_by_user_id(
                user_id
            )

            return [self._to_response(assignment) for assignment in assignments]

    async def get_by_team_id(
        self,
        team_id: str,
    ) -> list[CuratorAssignmentResponse]:
        async with self.uow as uow:
            assignments = (
                await uow.curator_assignments_repository.get_by_team_id(
                    team_id
                )
            )

            return [self._to_response(assignment) for assignment in assignments]

    async def get_current_by_team_id(
        self,
        team_id: str,
    ) -> list[CuratorAssignmentResponse]:
        async with self.uow as uow:
            repository = uow.curator_assignments_repository
            assignments = await repository.get_current_by_team_id(
                team_id
            )

            return [self._to_response(assignment) for assignment in assignments]

    async def get_current_by_user_and_team(
        self,
        user_id: str,
        team_id: str,
    ) -> CuratorAssignmentResponse:
        async with self.uow as uow:
            repository = uow.curator_assignments_repository
            assignment = await repository.get_current_by_user_and_team(
                user_id=user_id,
                team_id=team_id,
            )

            if not assignment:
                raise CuratorAssignmentNotFoundError(
                    "Current curator assignment not found"
                )

            return self._to_response(assignment)

    @staticmethod
    def _to_response(assignment: CuratorAssignment) -> CuratorAssignmentResponse:
        return CuratorAssignmentResponse(
            id=assignment.id,
            user_id=assignment.user_id,
            team_id=assignment.team_id,
            assigned_at=assignment.assigned_at,
            unassigned_at=assignment.unassigned_at,
            is_current=assignment.is_current,
        )
