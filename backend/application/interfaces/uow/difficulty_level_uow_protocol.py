from typing import Protocol

from application.interfaces.repositories import DifficultyLevelRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class DifficultyLevelUoWProtocol(UoWProtocol, Protocol):
    difficulty_level_repository: DifficultyLevelRepositoryProtocol
