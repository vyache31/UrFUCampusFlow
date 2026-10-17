import uuid
from collections.abc import Sequence
from datetime import datetime, UTC

from application.interfaces.uow.student_uow_protocol import StudentUoWProtocol
from infrastructure.db.models import Students
from presentation.api.schemas.student import StudentCreate, StudentUpdate


class StudentService:

    def __init__(self, uow: StudentUoWProtocol):
        self.uow = uow


    async def create_student(self, schema: StudentCreate) -> Students:
        async with self.uow as uow:
            is_exist = await uow.student_repository.verify_university(
                schema.university_id
            )

            if not is_exist:
                raise ValueError('University not found')

            student = Students(
                id=str(uuid.uuid4()),
                name=schema.name,
                group=schema.group,
                university_id=schema.university_id,
                created_at=datetime.now(UTC),
            )

            student = await uow.student_repository.create_student(student)
            await uow.commit()
            return student


    async def update_student(self, student_id: str, schema: StudentUpdate) -> Students | None:
        async with self.uow as uow:
            student = await uow.student_repository.get_student_by_id(student_id)

            if not student:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            if 'university_id' in update_data:
                is_exist = await uow.student_repository.verify_university(
                    update_data['university_id']
                )

                if not is_exist:
                    raise ValueError('University not found')

            for key, value in update_data.items():
                setattr(student, key, value)

            student.updated_at = datetime.now(UTC)

            await uow.student_repository.update()
            await uow.commit()

            return student


    async def delete_student(self, student_id: str) -> bool:
        async with self.uow as uow:
            student = await uow.student_repository.get_student_by_id(student_id)

            if not student:
                return False

            await uow.student_repository.delete(student)
            await uow.commit()

            return True


    async def get_all_students(self, limit: int = 10) -> Sequence[Students]:
        async with self.uow as uow:
            return await uow.student_repository.get_all(limit)


    async def get_student_by_id(self, student_id: str) -> Students | None:
        async with self.uow as uow:
            return await uow.student_repository.get_student_by_id(student_id)
