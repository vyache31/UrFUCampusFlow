from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import get_db
from infrastructure.db.repositories.meeting_tasks_repository import MeetingTaskRepository
from application.services.meeting_tasks_service import MeetingTasksService
from presentation.api.dependencies.meetings_depends import get_meetings_repository
from infrastructure.db.repositories.meetings_repository import MeetingsRepository


def get_meeting_tasks_repo(
        db: AsyncSession = Depends(get_db)
):
    return MeetingTaskRepository(db)


def get_meeting_tasks_service(
        repo: MeetingTaskRepository = Depends(get_meeting_tasks_repo),
        meetings_repo: MeetingsRepository = Depends(get_meetings_repository)
):
    return MeetingTasksService(repo, meetings_repo)
