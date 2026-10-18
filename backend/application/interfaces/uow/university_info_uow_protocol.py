from typing import Protocol

from application.interfaces.repositories import UniversityInfoRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class UniversityInfoUoWProtocol(UoWProtocol, Protocol):
    university_info_repository: UniversityInfoRepositoryProtocol
