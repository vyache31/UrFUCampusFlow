from application.exceptions.base import ConflictError, ForbiddenError, NotFoundError


class CaseNotReadyForEvaluationError(ConflictError):
    """The current case status does not allow creating an evaluation form."""


class EvaluationFormNotFoundError(NotFoundError):
    """The requested evaluation form does not exist."""


class EvaluationReactionNotFoundError(NotFoundError):
    """The requested evaluation reaction does not exist."""


class EvaluationCommentNotFoundError(NotFoundError):
    """The requested evaluation comment does not exist."""


class EvaluationReactionAlreadyExistsError(ConflictError):
    """The user has already reacted to this evaluation form."""


class EvaluationEditForbiddenError(ForbiddenError):
    """The caller cannot edit another user's evaluation reaction or comment."""
