from typing import Protocol

from application.interfaces.repositories import (
    TeamRepositoryProtocol,
    UniversityInfoRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class TeamUoWProtocol(UoWProtocol, Protocol):
    team_repository: TeamRepositoryProtocol
    university_info_repository: UniversityInfoRepositoryProtocol
