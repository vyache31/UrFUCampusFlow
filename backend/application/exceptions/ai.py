from application.exceptions.base import ApplicationError, NotFoundError


class AIChatNotFoundError(NotFoundError):
    """Requested AI Chat not found in user's chats list."""


class AIAssistantMessageValidationError(ApplicationError):
    """Response from AI Provider in the wrong format"""


class AIProviderError(ApplicationError):
    """The AI provider could not complete the request."""


class AIProviderTimeoutError(AIProviderError):
    """The AI provider did not respond within the timeout."""
