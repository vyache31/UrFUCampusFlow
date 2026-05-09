from models import Cases
import uuid
from services.const.case_status_workflow import ALLOWED_CASE_STATUS_TRANSITIONS, CASE_STATUS_DRAFT
from repositories.case_repository import CaseRepository
from schemas.case import CaseCreate, CaseUpdate, CaseResponse
from repositories.user_repository import UserRepository
from repositories.university_info_repository import UniversityInfoRepository
from repositories.difficulty_level_repository import DifficultyLevelRepository
from repositories.case_status_repository import CaseStatusRepository
from datetime import datetime, UTC
from typing import Any
from fastapi import HTTPException
from services.semesters_service import SemestersService



FK_FIELDS = {
    "difficulty_level_id",
    "university_id",
    "creator_id"
}


class CaseService:

    def __init__(
            self,
            case_repo: CaseRepository,
            user_repo: UserRepository,
            uni_repo: UniversityInfoRepository,
            diff_repo: DifficultyLevelRepository,
            statuses_repo: CaseStatusRepository,
            semesters_service: SemestersService
        ):
        self.case_repo = case_repo
        self.user_repo = user_repo
        self.uni_repo = uni_repo
        self.diff_repo = diff_repo
        self.statuses_repo = statuses_repo
        self.semesters_service = semesters_service

    async def _apply_fk_updates(self, case: Cases, fk_data: dict[str, Any]) -> None:
        config = {
            'creator_id': (self.user_repo.get_by_id, 'Creator not found.'),
            'university_id': (self.uni_repo.get_by_id, 'University not found.'),
            'difficulty_level_id': (self.diff_repo.get_by_id, 'Difficulty level not found'),
        }

        for key, value in fk_data.items():
            is_ok = await config[key][0](value)

            if is_ok:
                setattr(case, key, value)
            else:
                raise ValueError(config[key][1])

    async def create_case(self, schema: CaseCreate, creator_id: str) -> CaseResponse | None:
        is_exist = await self.case_repo.get_by_title(schema.title)

        if is_exist:
            raise HTTPException(status_code=409, detail="Case already exists")

        draft_status = await self.statuses_repo.get_by_code(CASE_STATUS_DRAFT)

        if not draft_status:
            raise ValueError('Draft status not found in db')

        case = Cases(
            id=str(uuid.uuid4()),
            title=schema.title,
            difficulty_level_id=schema.difficulty_level_id,
            project_goals=schema.project_goals,
            required_result=schema.required_result,
            grade_criteria=schema.grade_criteria,
            creator_id=creator_id,
            study_program=schema.study_program,
            start_date=schema.start_date,
            end_date=schema.end_date,
            university_id=schema.university_id,
            status_id=draft_status.id,
            created_at=datetime.now(UTC)
        )

        await self._apply_fk_updates(case, {
            "difficulty_level_id": schema.difficulty_level_id,
            "university_id": schema.university_id,
            "creator_id": creator_id,
        })

        case = await self.case_repo.create(case)
        case = await self.case_repo.get_with_relations(case.id)

        return self._to_response(case)

    async def get_case_by_id(self, case_id: str) -> Cases | None:
        return await self.case_repo.get_by_id(case_id=case_id)

    async def get_all_cases(self, limit: int) -> list[Cases]:
        return await self.case_repo.get_all(limit=limit)

    async def update_case(self, case_id: str, schema: CaseUpdate) -> Cases | None:
        case = await self.case_repo.get_by_id(case_id=case_id)

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

        await self.case_repo.update()

        return case

    async def delete_case(self, case_id: str) -> bool | None:
        case = await self.case_repo.get_by_id(case_id=case_id)

        if not case:
            return None

        await self.case_repo.delete(case)

        return True

    def _to_response(self, case: Cases) -> CaseResponse:
        return CaseResponse(
            id=case.id,
            title=case.title,
            difficulty_level_id=case.difficulty_level_id,
            difficulty_level_name=case.difficulty_level.level_name if case.difficulty_level else None,
            project_goals=case.project_goals,
            required_result=case.required_result,
            grade_criteria=case.grade_criteria,
            study_program=case.study_program,
            university_id=case.university_id,
            university_name=case.university.uni_name if case.university else None,
            start_date=case.start_date,
            end_date=case.end_date,
            status_id=case.status_id,
            status_name=case.status.status_name if case.status else None,
            creator_id=case.creator_id,
            creator_email=case.creator.email if case.creator else None,
            created_at=case.created_at,
            updated_at=case.updated_at,
        )


    #Работа с переходами статусов кейсов
    async def _transit_case_status(self, case_id: str, new_status_code: str) -> Cases | None:
        case = await self.case_repo.get_by_id(case_id)

        if not case:
            return None

        if new_status_code not in ALLOWED_CASE_STATUS_TRANSITIONS[case.status.code]:
            raise ValueError('Invalid status transition')

        new_status = await self.statuses_repo.get_by_code(status_code=new_status_code)

        if not new_status:
            raise ValueError(f'Status with code {new_status_code} not found')

        case.status = new_status

        await self.case_repo.update()

        return case


    async def send_to_review(self, case_id: str) -> Cases | None:
        return await self._transit_case_status(case_id=case_id, new_status_code='IN_REVIEW')


    async def reject(self, case_id: str) -> Cases | None:
        return await self._transit_case_status(case_id=case_id, new_status_code='REVISION')


    async def activate_after_submition(self, case_id: str) -> Cases | None:
        return await self._transit_case_status(case_id=case_id, new_status_code='ACTIVE')


    async def archive(self, case_id: str) -> Cases | None:
        return await self._transit_case_status(case_id=case_id, new_status_code='ARCHIVED')
