from application.exceptions.base import ConfigurationError, ConflictError, NotFoundError
class CaseNotFoundError(NotFoundError):
    """The requested case does not exist."""


class CaseAlreadyExistsError(ConflictError):
    """A case with the given title already exists."""


class CaseSemesterNotFoundError(NotFoundError):
    """The requested case-semester connection does not exist."""


class CaseSemesterAlreadyExistsError(ConflictError):
    """The case is already connected to this semester."""


class InvalidCaseStatusTransitionError(ConflictError):
    """The transition from the current case status is forbidden."""


class CaseStatusConfigurationError(ConfigurationError):
    """A status required by the case workflow is missing from reference data."""


class CaseHasDependenciesError(ConflictError):
    """The case cannot be deleted while dependent records exist."""
