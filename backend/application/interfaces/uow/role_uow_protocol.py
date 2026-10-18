from typing import Protocol

from application.interfaces.repositories import RoleRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class RoleUoWProtocol(UoWProtocol, Protocol):
    role_repository: RoleRepositoryProtocol
