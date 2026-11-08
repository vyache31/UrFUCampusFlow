from application.exceptions.base import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
)


class AIChatNotFoundError(NotFoundError):
    """Requested AI Chat not found in user's chats list."""
