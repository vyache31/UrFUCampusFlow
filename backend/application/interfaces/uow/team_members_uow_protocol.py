from typing import Protocol

from application.interfaces.repositories import (
    StudentRepositoryProtocol,
    TeamMembersRepositoryProtocol,
    TeamRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class TeamMembersUoWProtocol(UoWProtocol, Protocol):
    team_members_repository: TeamMembersRepositoryProtocol
    team_repository: TeamRepositoryProtocol
    student_repository: StudentRepositoryProtocol
