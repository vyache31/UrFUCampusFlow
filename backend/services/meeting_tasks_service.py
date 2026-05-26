from repositories.meeting_tasks_repository import MeetingTaskRepository
from repositories.meetings_repository import MeetingsRepository
from models import MeetingTask
from schemas.outlook_meetings import MeetingTaskCreate, MeetingTaskUpdate, MeetingTaskResponse
import uuid

class MeetingTasksService:
    def __init__(self, repo: MeetingTaskRepository, meetings_repo: MeetingsRepository):
        self.repo = repo
        self.meetings_repo = meetings_repo


    async def _get_meeting_for_current_history(self, meeting_id: str, current_team_case_history_id: str):
        meeting = await self.meetings_repo.get_by_id(meeting_id)

        if not meeting or meeting.team_case_history_id != current_team_case_history_id:
            raise ValueError('This meeting does not exist')

        return meeting


    async def _get_task_for_meeting(self, task_id: str, meeting_id: str) -> MeetingTask:
        task = await self.repo.get_by_id(task_id)

        if not task or task.meeting_id != meeting_id:
            raise ValueError('This task does not exist')

        return task


    async def create_task(
            self,
            schema: MeetingTaskCreate,
            meeting_id: str,
            current_team_case_history_id: str
    ) -> MeetingTaskResponse:
        await self._get_meeting_for_current_history(meeting_id, current_team_case_history_id)

        meeting_task = MeetingTask(
            id=str(uuid.uuid4()),
            title=schema.title,
            description=schema.description,
            meeting_id=meeting_id,
            is_completed=False
        )

        await self.repo.create(meeting_task)

        return self.to_response(meeting_task)


    async def update_task(
            self,
            schema: MeetingTaskUpdate,
            meeting_id: str,
            task_id: str,
            current_team_case_history_id: str
    ) -> MeetingTaskResponse:
        await self._get_meeting_for_current_history(meeting_id, current_team_case_history_id)
        task = await self._get_task_for_meeting(task_id, meeting_id)

        update_data = schema.model_dump(exclude_unset=True)

        if 'title' in update_data and update_data['title'] is None:
            raise ValueError('Task title can not be empty')

        for field, value in update_data.items():
            setattr(task, field, value)

        await self.repo.update(task)

        return self.to_response(task)


    async def delete_task(
            self,
            meeting_id: str,
            task_id: str,
            current_team_case_history_id: str
    ) -> bool:
        await self._get_meeting_for_current_history(meeting_id, current_team_case_history_id)
        task = await self._get_task_for_meeting(task_id, meeting_id)

        await self.repo.delete(task)

        return True


    async def get_all_meeting_tasks(
            self,
            meeting_id: str,
            current_team_case_history_id: str
    ) -> list[MeetingTaskResponse]:
        await self._get_meeting_for_current_history(meeting_id, current_team_case_history_id)

        tasks = await self.repo.get_by_meeting_id(meeting_id)

        tasks_list = [
            self.to_response(task)
            for task in tasks
        ]

        return tasks_list


    @staticmethod
    def to_response(meeting_task: MeetingTask) -> MeetingTaskResponse:
        return MeetingTaskResponse(
            id=meeting_task.id,
            title=meeting_task.title,
            description=meeting_task.description,
            meeting_id=meeting_task.meeting_id,
            is_completed=meeting_task.is_completed
        )
