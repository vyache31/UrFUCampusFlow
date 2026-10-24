from typing import Protocol

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    TeamRepositoryProtocol,
    UserRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class CuratorAssignmentUoWProtocol(UoWProtocol, Protocol):
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
    user_repository: UserRepositoryProtocol
    team_repository: TeamRepositoryProtocol
