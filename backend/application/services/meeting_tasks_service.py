from application.interfaces.uow.meeting_tasks_uow_protocol import MeetingTasksUoWProtocol
from infrastructure.db.models import MeetingTask, Meetings
from presentation.api.schemas.outlook_meetings import MeetingTaskCreate, MeetingTaskUpdate, MeetingTaskResponse
from application.services.meetings_service import find_next_meeting
import uuid


class NextMeetingNotFoundError(ValueError):
    pass


class MeetingTasksService:
    def __init__(self, uow: MeetingTasksUoWProtocol):
        self.uow = uow


    async def _get_meeting_for_current_history(
        self,
        uow: MeetingTasksUoWProtocol,
        meeting_id: str,
        current_team_case_history_id: str,
    ) -> Meetings:
        meeting = await uow.meetings_repository.get_by_id(meeting_id)

        if not meeting or meeting.team_case_history_id != current_team_case_history_id:
            raise ValueError('This meeting does not exist')

        return meeting


    async def _get_task_for_meeting(
        self, uow: MeetingTasksUoWProtocol, task_id: str, meeting_id: str
    ) -> MeetingTask:
        task = await uow.meeting_tasks_repository.get_by_id(task_id)

        if not task or task.meeting_id != meeting_id:
            raise ValueError('This task does not exist')

        return task


    async def create_task(
            self,
            schema: MeetingTaskCreate,
            meeting_id: str,
            current_team_case_history_id: str
    ) -> MeetingTaskResponse:
        async with self.uow as uow:
            await self._get_meeting_for_current_history(uow, meeting_id, current_team_case_history_id)
            meeting_task = MeetingTask(
                id=str(uuid.uuid4()),
                title=schema.title,
                description=schema.description,
                meeting_id=meeting_id,
                is_completed=False
            )
            await uow.meeting_tasks_repository.create(meeting_task)
            response = self.to_response(meeting_task)
            await uow.commit()
            return response

    async def create_task_for_next_meeting(
        self,
        schema: MeetingTaskCreate,
        meeting_id: str,
        current_team_case_history_id: str
    ) -> MeetingTaskResponse:
        async with self.uow as uow:
            meeting = await find_next_meeting(
                meetings_repository=uow.meetings_repository,
                meeting_id = meeting_id,
                current_team_case_history_id = current_team_case_history_id
            )

            if not meeting:
                raise NextMeetingNotFoundError("Schedule the next meeting before adding tasks")

            meeting_task = MeetingTask(
                id=str(uuid.uuid4()),
                title=schema.title,
                description=schema.description,
                meeting_id=meeting.id,
                is_completed=False
            )

            await uow.meeting_tasks_repository.create(meeting_task)
            response = self.to_response(meeting_task)
            await uow.commit()
            return response

    async def carry_task_to_next_meeting(
        self,
        meeting_id: str,
        current_team_case_history_id: str
    ) -> list[MeetingTaskResponse]:
        async with self.uow as uow:
            carry_to_meeting = await find_next_meeting(
                meetings_repository=uow.meetings_repository,
                meeting_id = meeting_id,
                current_team_case_history_id = current_team_case_history_id
            )

            if not carry_to_meeting:
                raise NextMeetingNotFoundError("Schedule the next meeting before carrying tasks")

            carry_to_meeting_tasks = await uow.meeting_tasks_repository.get_by_meeting_id(
                carry_to_meeting.id
            )

            already_carried = set()

            for task in carry_to_meeting_tasks:
                if task.carried_from_task_id:
                    already_carried.add(task.carried_from_task_id)

            tasks_to_carry = await uow.meeting_tasks_repository.get_by_status_and_meeting_id(
                meeting_id=meeting_id,
                is_completed=False
            )

            response = []

            for task in tasks_to_carry:
                if task.id not in already_carried:
                    carried_task = MeetingTask(
                        id=str(uuid.uuid4()),
                        title=task.title,
                        description=task.description,
                        meeting_id=carry_to_meeting.id,
                        is_completed=False,
                        carried_from_task_id=task.id
                    )

                    await uow.meeting_tasks_repository.create(carried_task)
                    response.append(self.to_response(carried_task))

            await uow.commit()
            return response


    async def update_task(
            self,
            schema: MeetingTaskUpdate,
            meeting_id: str,
            task_id: str,
            current_team_case_history_id: str
    ) -> MeetingTaskResponse:
        async with self.uow as uow:
            await self._get_meeting_for_current_history(uow, meeting_id, current_team_case_history_id)
            task = await self._get_task_for_meeting(uow, task_id, meeting_id)
            update_data = schema.model_dump(exclude_unset=True)
            if 'title' in update_data and update_data['title'] is None:
                raise ValueError('Task title can not be empty')
            for field, value in update_data.items():
                setattr(task, field, value)
            await uow.meeting_tasks_repository.update(task)
            response = self.to_response(task)
            await uow.commit()
            return response


    async def delete_task(
            self,
            meeting_id: str,
            task_id: str,
            current_team_case_history_id: str
    ) -> bool:
        async with self.uow as uow:
            await self._get_meeting_for_current_history(uow, meeting_id, current_team_case_history_id)
            task = await self._get_task_for_meeting(uow, task_id, meeting_id)
            await uow.meeting_tasks_repository.delete(task)
            await uow.commit()
            return True


    async def get_all_meeting_tasks(
            self,
            meeting_id: str,
            current_team_case_history_id: str
    ) -> list[MeetingTaskResponse]:
        async with self.uow as uow:
            await self._get_meeting_for_current_history(uow, meeting_id, current_team_case_history_id)
            tasks = await uow.meeting_tasks_repository.get_by_meeting_id(meeting_id)
            return [self.to_response(task) for task in tasks]


    @staticmethod
    def to_response(meeting_task: MeetingTask) -> MeetingTaskResponse:
        return MeetingTaskResponse(
            id=meeting_task.id,
            title=meeting_task.title,
            description=meeting_task.description,
            meeting_id=meeting_task.meeting_id,
            is_completed=meeting_task.is_completed,
            carried_from_task_id=meeting_task.carried_from_task_id,
        )
