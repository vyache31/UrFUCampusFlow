from models import Cases
import uuid
from schemas.case import CaseCreate, CaseUpdate
from repositories.case_repository import CaseRepository
from datetime import datetime, UTC
from typing import Any


FK_FIELDS = {
    "difficulty_level_id",
    "university_id",
    "semester_id",
    "status_id",
    "creator_id"
}

class CaseService:

    def __init__(self, rep: CaseRepository):
        self.rep = rep


    async def _apply_fk_updates(self, case: Cases, fk_data: dict[str, Any]) -> None:
        for key, value in fk_data.items():
            if key == 'creator_id':
                is_ok = await self.rep.verify_creator(creator_id=value)

                if is_ok:
                    case.creator_id = value
                else:
                    raise ValueError('Creator not found')

            elif key == 'status_id':
                is_ok = await self.rep.verify_status(status_id=value)

                if is_ok:
                    case.status_id = value
                else:
                    raise ValueError('Status not found')

            elif key == 'difficulty_level_id':
                is_ok = await self.rep.verify_difficulty_level(level_id=value)

                if is_ok:
                    case.difficulty_level_id = value
                else:
                    raise ValueError('Difficulty level not found')

            elif key == 'university_id':
                is_ok = await self.rep.verify_university(uni_id=value)

                if is_ok:
                    case.university_id = value
                else:
                    raise ValueError('University not found')

            elif key == 'semester_id':
                is_ok = await self.rep.verify_semester(semester_id=value)

                if is_ok:
                    case.semester_id = value
                else:
                    raise ValueError('Semester not found')


    async def create_case(self, schema: CaseCreate) -> None:
        is_exist = await self.rep.get_by_title(schema.title)

        if is_exist:
            raise ValueError("Case with this title already exists")

        case = Cases(
            id = str(uuid.uuid4()),
            title = schema.title,
            difficulty_level_id = schema.difficulty_level_id,
            project_goals = schema.project_goals,
            required_result = schema.required_result,
            grade_criteria = schema.grade_criteria,
            creator_id = schema.creator_id,
            study_program = schema.study_program,
            start_date = schema.start_date,
            end_date = schema.end_date,
            university_id = schema.university_id,
            semester_id = schema.semester_id,
            status_id = schema.status_id,
            created_at = datetime.now(UTC)
        )

        fk_data = {
            "difficulty_level_id": schema.difficulty_level_id,
            "university_id": schema.university_id,
            "semester_id": schema.semester_id,
            "status_id": schema.status_id,
            "creator_id": schema.creator_id,
        }

        await self._apply_fk_updates(case, fk_data)

        return await self.rep.create(case)


    async def get_case_by_id(self, case_id: str) -> Cases | None:
        return await self.rep.get_by_id(case_id=case_id)


    async def get_all_cases(self, limit: int) -> list[Cases] | None:
        return await self.rep.get_all(limit=limit)


    async def update_case(self, case_id: str, schema: CaseUpdate) -> Cases | None:
        case = await self.rep.get_by_id(case_id=case_id)

        if not case:
            return None

        update_data = schema.model_dump(exclude_unset=True, exclude_none=True)

        fk_data = {}
        simple_data = {}

        for key, value in update_data.items():
            if key in FK_FIELDS:
                fk_data[key] = value
            else:
                simple_data[key] = value

        for key, value in simple_data.items():
            setattr(case, key, value)

        await self._apply_fk_updates(case, fk_data)

        case.updated_at = datetime.now(UTC)

        await self.rep.update()

        return case


    async def delete_case(self, case_id: str) -> bool | None:
        case = await self.rep.get_by_id(case_id=case_id)

        if not case:
            return None

        await self.rep.delete(case)

        return True
