from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.meeting_tasks_uow import SqlAlchemyMeetingTasksUoW
from application.services.meeting_tasks_service import MeetingTasksService


def get_meeting_tasks_service() -> MeetingTasksService:
    return MeetingTasksService(SqlAlchemyMeetingTasksUoW(SessionLocal))
