from application.exceptions.base import ApplicationValidationError, ConflictError, NotFoundError


class UserIsNotCuratorError(ApplicationValidationError):
    """The selected user does not have the curator role."""


class CuratorAssignmentNotFoundError(NotFoundError):
    """The requested curator assignment does not exist."""


class CuratorAssignmentAlreadyExistsError(ConflictError):
    """The curator already has a current assignment to this team."""


class CuratorAssignmentAlreadyEndedError(ConflictError):
    """The curator assignment has already ended."""


class CuratorAttendanceNotFoundError(NotFoundError):
    """The requested curator attendance does not exist in the given scope."""
