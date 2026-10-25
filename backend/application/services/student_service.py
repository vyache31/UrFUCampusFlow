import uuid
from datetime import datetime, UTC

from application.exceptions.resources import UniversityNotFoundError
from application.interfaces.uow.student_uow_protocol import StudentUoWProtocol
from infrastructure.db.models import Students
from presentation.api.schemas.student import StudentCreate, StudentResponse, StudentUpdate


class StudentService:

    def __init__(self, uow: StudentUoWProtocol):
        self.uow = uow


    async def create_student(self, schema: StudentCreate) -> StudentResponse:
        async with self.uow as uow:
            is_exist = await uow.student_repository.verify_university(
                schema.university_id
            )

            if not is_exist:
                raise UniversityNotFoundError('University not found')

            student = Students(
                id=str(uuid.uuid4()),
                name=schema.name,
                group=schema.group,
                university_id=schema.university_id,
                created_at=datetime.now(UTC),
            )

            student = await uow.student_repository.create_student(student)
            response = StudentResponse.model_validate(student)
            await uow.commit()
            return response


    async def update_student(
        self, student_id: str, schema: StudentUpdate
    ) -> StudentResponse | None:
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
                    raise UniversityNotFoundError('University not found')

            for key, value in update_data.items():
                setattr(student, key, value)

            student.updated_at = datetime.now(UTC)

            await uow.student_repository.update()
            response = StudentResponse.model_validate(student)
            await uow.commit()

            return response


    async def delete_student(self, student_id: str) -> bool:
        async with self.uow as uow:
            student = await uow.student_repository.get_student_by_id(student_id)

            if not student:
                return False

            await uow.student_repository.delete(student)
            await uow.commit()

            return True


    async def get_all_students(self, limit: int = 10) -> list[StudentResponse]:
        async with self.uow as uow:
            students = await uow.student_repository.get_all(limit)
            return [StudentResponse.model_validate(student) for student in students]


    async def get_student_by_id(self, student_id: str) -> StudentResponse | None:
        async with self.uow as uow:
            student = await uow.student_repository.get_student_by_id(student_id)
            return StudentResponse.model_validate(student) if student else None
