from models import Students
import uuid
from schemas.student import StudentCreate, StudentUpdate
from repositories.student_repository import StudentRepository
from datetime import datetime, UTC


class StudentService:

    def __init__(self, rep: StudentRepository):
        self.rep = rep


    async def create_student(self, schema: StudentCreate) -> Students:
        student = Students(
            id = str(uuid.uuid4()),
            name = schema.name,
            group = schema.group,
            created_at = datetime.now(UTC)
        )

        return await self.rep.create_student(student)


    async def update_student(self, student_id: str, schema: StudentUpdate) -> Students | None:
        student = await self.rep.get_student_by_id(student_id)

        if not student:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(student, key, value)

        student.updated_at = datetime.now(UTC)

        await self.rep.update()

        return student


    async def delete_student(self, student_id: str) -> bool:
        student = await self.rep.get_student_by_id(student_id)

        if not student:
            return False

        await self.rep.delete(student)

        return True


    async def get_all_students(self, limit: int = 10) -> list[Students]:
        students = await self.rep.get_all(limit)

        return students


    async def get_student_by_id(self, student_id: str) -> Students | None:
        student = await self.rep.get_student_by_id(student_id)

        return student