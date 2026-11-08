from typing import Protocol
from application.interfaces.repositories import (
    BotRepositoryProtocol,
    UserRepositoryProtocol
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class BotUow(UoWProtocol, Protocol):
    bot_repository: BotRepositoryProtocol
    user_repository: UserRepositoryProtocol
