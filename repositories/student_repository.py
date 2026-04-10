from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models import Students, Universities


class StudentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(self, limit: int = 10):
        students = await self.db.execute(
            select(Students)
            .limit(limit)
        )

        return students.scalars().all()


    async def get_student_by_id(self, student_id: str) -> Students | None:
        student = await self.db.execute(
            select(Students)
            .where(Students.id == student_id)
        )

        return student.scalar_one_or_none()


    async def verify_university(self, university_id: int) -> bool:
        university = await self.db.execute(
            select(Universities)
            .where(Universities.id == university_id)
        )

        return university.scalar_one_or_none() is not None


    async def create_student(self, student: Students) -> Students:
        self.db.add(student)
        await self.db.commit()
        await self.db.refresh(student)

        return student


    async def update(self) -> None:
        await self.db.commit()


    async def delete(self, student: Students) -> None:
        await self.db.delete(student)
        await self.db.commit()


    async def delete_by_id(self, student_id: str) -> None:
        await self.db.execute(
            delete(Students)
            .where(Students.id == student_id)
        )

        await self.db.commit()
