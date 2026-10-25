from application.exceptions.base import (
    ApplicationValidationError,
    ConflictError,
    NotFoundError,
)
class MeetingNotFoundError(NotFoundError):
    """The requested meeting does not exist in the given team-case history."""


class MeetingTaskNotFoundError(NotFoundError):
    """The requested task does not exist in the given meeting."""


class MeetingTimeConflictError(ConflictError):
    """The selected meeting time overlaps a busy calendar event."""


class InvalidRecurrenceError(ApplicationValidationError):
    """The recurrence settings are missing required values or are invalid."""


class NextMeetingNotFoundError(ConflictError):
    """A next meeting must be scheduled before tasks can be added or carried."""
