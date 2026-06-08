from tg_bot.models.bot import BotCases, BotMode, Interviews, RecruitmentCurators

from .auth import Roles, Users
from .cases import (
    Cases,
    CaseSemesters,
    CaseStatuses,
    DifficultyLevels,
    EvaluationForm,
    EvaluationFormComments,
    EvaluationFormReactions,
)
from .grades import Grades, Iterations
from .integrations import (
    CuratorMeetingsAttendance,
    Meetings,
    MeetingsSeries,
    MeetingTask,
    MicrosoftOAuth,
)
from .teams import (
    CuratorAssignment,
    Semesters,
    Students,
    TeamCaseHistory,
    TeamMembers,
    Teams,
    Universities,
)
