from typing import Protocol

from application.interfaces.repositories import (
    CaseRepositoryProtocol,
    EvaluationRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class EvaluationUoWProtocol(UoWProtocol, Protocol):
    case_repository: CaseRepositoryProtocol
    evaluation_repository: EvaluationRepositoryProtocol
