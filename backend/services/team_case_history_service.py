import uuid
from datetime import UTC, datetime

from models import TeamCaseHistory
from repositories.team_case_history_repository import TeamCaseHistoryRepository
from schemas.team_case_history import TeamCaseHistoryResponse


class TeamCaseHistoryService:

    def __init__(self, team_case_history_repo: TeamCaseHistoryRepository):
        self.team_case_history_repo = team_case_history_repo

    async def assign_team_to_case_semester(
            self,
            team_id: str,
            case_semesters_id: str,
            started_at: datetime | None = None,
            is_current: bool = True
    ) -> TeamCaseHistory:
        if not await self.team_case_history_repo.verify_team(team_id):
            raise ValueError('Team not found')

        if not await self.team_case_history_repo.verify_case_semester(case_semesters_id):
            raise ValueError('Case semester not found')

        existing_connection = await self.team_case_history_repo.get_current_by_team_and_case_semester(
            team_id=team_id,
            case_semesters_id=case_semesters_id
        )

        if existing_connection:
            raise ValueError('Team already has current connection with this case semester')

        if is_current:
            current_connection = await self.team_case_history_repo.get_current_by_team_id(team_id)

            if current_connection:
                raise ValueError('Team already has current case history')

        now = datetime.now(UTC)

        if started_at is None:
            started_at = now

        team_case_history = TeamCaseHistory(
            id=str(uuid.uuid4()),
            team_id=team_id,
            case_semesters_id=case_semesters_id,
            started_at=started_at,
            is_current=is_current,
            created_at=now,
            updated_at=now
        )

        created_history = await self.team_case_history_repo.create(team_case_history)
        return await self.team_case_history_repo.get_by_id(created_history.id)

    async def get_by_id(self, team_case_history_id: str) -> TeamCaseHistory | None:
        return await self.team_case_history_repo.get_by_id(team_case_history_id)

    async def get_by_team_id(self, team_id: str) -> list[TeamCaseHistory]:
        if not await self.team_case_history_repo.verify_team(team_id):
            raise ValueError('Team not found')

        return await self.team_case_history_repo.get_by_team_id(team_id)

    async def get_team_history_response(self, team_id: str) -> list[TeamCaseHistoryResponse]:
        history = await self.get_by_team_id(team_id)

        return [
            self.to_response(team_case_history)
            for team_case_history in history
        ]

    async def get_current_by_team_id(self, team_id: str) -> TeamCaseHistory | None:
        return await self.team_case_history_repo.get_current_by_team_id(team_id)

    async def get_by_case_semester_id(self, case_semesters_id: str) -> list[TeamCaseHistory]:
        return await self.team_case_history_repo.get_by_case_semester_id(case_semesters_id)

    async def end_current_for_team(
            self,
            team_id: str,
            ended_at: datetime | None = None
    ) -> TeamCaseHistory | None:
        team_case_history = await self.team_case_history_repo.get_current_by_team_id(team_id)

        if not team_case_history:
            return None

        if ended_at is None:
            ended_at = datetime.now(UTC)

        if team_case_history.started_at and ended_at < team_case_history.started_at:
            raise ValueError('Case history end date cannot be earlier than start date')

        team_case_history.ended_at = ended_at
        team_case_history.is_current = False
        team_case_history.updated_at = datetime.now(UTC)

        await self.team_case_history_repo.update()

        return team_case_history

    async def delete(self, team_case_history_id: str) -> bool | None:
        team_case_history = await self.team_case_history_repo.get_by_id(team_case_history_id)

        if not team_case_history:
            return None

        await self.team_case_history_repo.delete(team_case_history)

        return True

    @staticmethod
    def to_response(team_case_history: TeamCaseHistory) -> TeamCaseHistoryResponse:
        case_semester = team_case_history.case_semester
        case = case_semester.case if case_semester else None
        semester = case_semester.semester if case_semester else None

        return TeamCaseHistoryResponse(
            id=team_case_history.id,
            team_id=team_case_history.team_id,
            case_semesters_id=team_case_history.case_semesters_id,
            case_id=case.id if case else None,
            case_title=case.title if case else None,
            semester_id=semester.id if semester else None,
            semester_season=semester.season if semester else None,
            semester_year=semester.year if semester else None,
            started_at=team_case_history.started_at,
            ended_at=team_case_history.ended_at,
            is_current=team_case_history.is_current,
            created_at=team_case_history.created_at,
            updated_at=team_case_history.updated_at
        )
