from application.exceptions.base import ApplicationValidationError, ConflictError, NotFoundError


class InvalidBotModeError(ApplicationValidationError):
    """The requested bot mode is not supported."""


class InterviewTimeConflictError(ConflictError):
    """The selected interview time is already occupied."""


class RecruitmentCaseNotFoundError(NotFoundError):
    """The requested case is not available for recruitment."""


class RecruitmentClosedError(ConflictError):
    """Interviews cannot be booked while recruitment is closed."""

class RecruitmentCuratorNotFound(NotFoundError):
    """Requested curator not found in the list of recruitment curators."""
