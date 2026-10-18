from typing import Protocol

from application.interfaces.repositories import CaseStatusRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class CaseStatusUoWProtocol(UoWProtocol, Protocol):
    case_status_repository: CaseStatusRepositoryProtocol
