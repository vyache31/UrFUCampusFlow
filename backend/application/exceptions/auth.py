from application.exceptions.base import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
)
class InvalidServiceCredentialsError(AuthenticationError):
    """The service client supplied an invalid secret."""


class OAuthAccountAlreadyLinkedError(ConflictError):
    """The provider account is already linked to a user."""


class OAuthConnectionNotFoundError(NotFoundError):
    """The user has no OAuth connection."""


class OAuthConnectionInactiveError(ConflictError):
    """The OAuth connection is inactive and cannot provide an access token."""


class InvalidCredentialsError(AuthenticationError):
    """The supplied user credentials are invalid."""
