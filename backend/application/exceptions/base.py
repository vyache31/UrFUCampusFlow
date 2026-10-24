class ApplicationError(Exception):
    """Base exception for application operations."""


class NotFoundError(ApplicationError):
    """A requested resource was not found in the given scope."""


class ConflictError(ApplicationError):
    """The operation conflicts with the current application state."""


class ApplicationValidationError(ApplicationError):
    """Input violates an application rule."""


class ForbiddenError(ApplicationError):
    """The caller is not allowed to perform the operation."""


class AuthenticationError(ApplicationError):
    """Authentication credentials are invalid."""


class ConfigurationError(ApplicationError):
    """Required application configuration or reference data is missing."""


class InvalidPeriodError(ApplicationValidationError):
    """The start and end of a period violate the operation's rules."""


class RequiredFieldError(ApplicationValidationError):
    """An explicitly supplied required field is null."""
