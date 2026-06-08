from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import CuratorMeetingsAttendance

CURATOR_MEETINGS_ATTENDANCE_LOAD_OPTIONS = (
    selectinload(CuratorMeetingsAttendance.meeting),
    selectinload(CuratorMeetingsAttendance.curator_assignment),
)


class CuratorMeetingsAttendanceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, attendance: CuratorMeetingsAttendance
    ) -> CuratorMeetingsAttendance:
        self.db.add(attendance)
        await self.db.commit()
        await self.db.refresh(attendance)

        return await self.get_by_id(attendance.id)

    async def create_many(
        self, attendances: list[CuratorMeetingsAttendance]
    ) -> list[CuratorMeetingsAttendance]:
        self.db.add_all(attendances)

        await self.db.commit()

        return attendances

    async def get_by_id(self, attendance_id: str) -> CuratorMeetingsAttendance | None:
        attendance = await self.db.execute(
            select(CuratorMeetingsAttendance)
            .options(*CURATOR_MEETINGS_ATTENDANCE_LOAD_OPTIONS)
            .where(CuratorMeetingsAttendance.id == attendance_id)
        )

        return attendance.scalar_one_or_none()

    async def get_by_meeting_id(
        self, meeting_id: str
    ) -> list[CuratorMeetingsAttendance]:
        attendance = await self.db.execute(
            select(CuratorMeetingsAttendance)
            .options(*CURATOR_MEETINGS_ATTENDANCE_LOAD_OPTIONS)
            .where(CuratorMeetingsAttendance.meeting_id == meeting_id)
        )

        return attendance.scalars().all()

    async def get_by_curator_assignment_id(
        self, curator_assignment_id: str
    ) -> list[CuratorMeetingsAttendance]:
        attendance = await self.db.execute(
            select(CuratorMeetingsAttendance)
            .options(*CURATOR_MEETINGS_ATTENDANCE_LOAD_OPTIONS)
            .where(
                CuratorMeetingsAttendance.curator_assignment_id == curator_assignment_id
            )
        )

        return attendance.scalars().all()

    async def get_by_meeting_and_curator_assignment(
        self, meeting_id: str, curator_assignment_id: str
    ) -> CuratorMeetingsAttendance | None:
        attendance = await self.db.execute(
            select(CuratorMeetingsAttendance)
            .options(*CURATOR_MEETINGS_ATTENDANCE_LOAD_OPTIONS)
            .where(
                CuratorMeetingsAttendance.meeting_id == meeting_id,
                CuratorMeetingsAttendance.curator_assignment_id
                == curator_assignment_id,
            )
        )

        return attendance.scalar_one_or_none()

    async def update(
        self, attendance: CuratorMeetingsAttendance
    ) -> CuratorMeetingsAttendance:
        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance

    async def delete(self, attendance: CuratorMeetingsAttendance) -> None:
        await self.db.delete(attendance)
        await self.db.commit()

    async def delete_by_id(self, attendance_id: str) -> None:
        await self.db.execute(
            delete(CuratorMeetingsAttendance).where(
                CuratorMeetingsAttendance.id == attendance_id
            )
        )
        await self.db.commit()
