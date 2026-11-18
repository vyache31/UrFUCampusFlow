from typing import Protocol

from application.interfaces.repositories.ai_chat_repository_protocol import (
    AIChatRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class AIChatUoWProtocol(UoWProtocol, Protocol):
    ai_chat_repository: AIChatRepositoryProtocol
