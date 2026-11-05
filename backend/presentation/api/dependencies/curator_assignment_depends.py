from application.services.curator_assignment_service import CuratorAssignmentService
from application.exceptions.base import ForbiddenError
from application.exceptions.curator import CuratorAssignmentNotFoundError
from fastapi import Depends
from presentation.api.dependencies.auth_depends import get_current_auth_user
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.curator_assignment_uow import (
    SqlAlchemyCuratorAssignmentUoW,
)


def get_curator_assignment_service() -> CuratorAssignmentService:
    return CuratorAssignmentService(SqlAlchemyCuratorAssignmentUoW(SessionLocal))


async def require_team_files_access(
    team_id: str,
    user=Depends(get_current_auth_user),
    service: CuratorAssignmentService = Depends(get_curator_assignment_service),
):
    if user.role is not None and user.role.code == "ADMIN":
        return user
    if user.role is None or user.role.code != "CURATOR":
        raise ForbiddenError("Only administrators and curators can delete task parents")
    try:
        await service.get_current_by_user_and_team(user_id=user.id, team_id=team_id)
    except CuratorAssignmentNotFoundError as exc:
        raise ForbiddenError("You are not a current curator of this team") from exc
    return user
