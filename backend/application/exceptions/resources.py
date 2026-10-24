from application.exceptions.base import NotFoundError


class UserNotFoundError(NotFoundError):
    """The referenced user does not exist."""


class UniversityNotFoundError(NotFoundError):
    """The referenced university does not exist."""


class DifficultyLevelNotFoundError(NotFoundError):
    """The referenced difficulty level does not exist."""


class RoleNotFoundError(NotFoundError):
    """The referenced role does not exist."""


class StudentNotFoundError(NotFoundError):
    """The referenced student does not exist."""
