from typing import Protocol

from application.interfaces.repositories import IterationRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class IterationUoWProtocol(UoWProtocol, Protocol):
    iteration_repository: IterationRepositoryProtocol
