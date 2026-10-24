from application.exceptions.base import ConflictError, NotFoundError
class TeamNotFoundError(NotFoundError):
    """The requested team does not exist."""


class TeamAlreadyExistsError(ConflictError):
    """A team with the given name already exists."""


class TeamMembershipAlreadyExistsError(ConflictError):
    """The student is already a current member of this team."""


class StudentAlreadyAssignedToTeamError(ConflictError):
    """The student already has a current membership in another team."""


class TeamMembershipAlreadyEndedError(ConflictError):
    """The team membership has already ended."""


class TeamCaseHistoryNotFoundError(NotFoundError):
    """The requested team-case history does not exist."""


class TeamCaseAssignmentAlreadyExistsError(ConflictError):
    """The team already has a current connection to this case and semester."""


class TeamAlreadyAssignedToCaseError(ConflictError):
    """The team already has a current case assignment."""


class TeamHasDependenciesError(ConflictError):
    """The team cannot be deleted while dependent records exist."""
