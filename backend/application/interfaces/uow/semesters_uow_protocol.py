from typing import Protocol

from application.interfaces.repositories import SemestersRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class SemestersUoWProtocol(UoWProtocol, Protocol):
    semesters_repository: SemestersRepositoryProtocol
