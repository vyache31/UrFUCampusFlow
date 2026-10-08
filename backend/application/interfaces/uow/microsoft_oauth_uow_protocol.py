from typing import Protocol

from application.interfaces.repositories import MicrosoftOAuthRepositoryProtocol
from application.interfaces.uow.uow_protocol import UoWProtocol


class MicrosoftOAuthUoWProtocol(UoWProtocol, Protocol):
    microsoft_oauth_repository: MicrosoftOAuthRepositoryProtocol
