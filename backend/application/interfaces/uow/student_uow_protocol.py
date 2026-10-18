from typing import Protocol

from application.interfaces.repositories import StudentRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class StudentUoWProtocol(UoWProtocol, Protocol):
    student_repository: StudentRepositoryProtocol
