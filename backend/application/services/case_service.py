import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from application.interfaces.uow.case_uow_protocol import CaseUoWProtocol
from application.services.const.case_status_workflow import (
    ALLOWED_CASE_STATUS_TRANSITIONS,
    CASE_STATUS_DRAFT,
)
from application.services.evaluation_service import EvaluationService
from application.services.semesters_service import SemestersService
from infrastructure.db.models import Cases, CaseSemesters
from presentation.api.schemas.case import CaseCreate, CaseResponse, CaseUpdate


FK_FIELDS = {"difficulty_level_id", "university_id", "creator_id"}


class CaseService:
    def __init__(self, case_uow: CaseUoWProtocol):
        self.uow = case_uow

    async def _apply_fk_updates(
        self,
        case: Cases,
        fk_data: dict[str, Any],
        uow: CaseUoWProtocol,
    ) -> None:
        config = {
            "creator_id": (uow.user_repository.get_by_id, "Creator not found."),
            "university_id": (
                uow.university_info_repository.get_by_id,
                "University not found.",
            ),
            "difficulty_level_id": (
                uow.difficulty_level_repository.get_by_id,
                "Difficulty level not found",
            ),
        }

        for key, value in fk_data.items():
            is_ok = await config[key][0](value)

            if is_ok:
                setattr(case, key, value)
            else:
                raise ValueError(config[key][1])

    async def create_case(
        self, schema: CaseCreate, creator_id: str
    ) -> CaseResponse | None:
        async with self.uow as uow:
            is_exist = await uow.case_repository.get_by_title(schema.title)

            if is_exist:
                raise HTTPException(status_code=409, detail="Case already exists")

            draft_status = await uow.case_statuses_repository.get_by_code(
                CASE_STATUS_DRAFT
            )

            if not draft_status:
                raise ValueError("Draft status not found in db")

            case = Cases(
                id=str(uuid.uuid4()),
                title=schema.title,
                short_title=schema.short_title,
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
                created_at=datetime.now(UTC),
            )

            await self._apply_fk_updates(
                case,
                {
                    "difficulty_level_id": schema.difficulty_level_id,
                    "university_id": schema.university_id,
                    "creator_id": creator_id,
                },
                uow,
            )

            case = await uow.case_repository.create(case)

            semesters_service = SemestersService(uow.semesters_repository)
            semester = await semesters_service.get_or_create_current()

            case_semester_existing_connection = (
                await uow.case_semesters_repository.get_by_case_and_semester(
                    case.id,
                    semester.id,
                )
            )

            if case_semester_existing_connection:
                raise ValueError("This Case already exists in the current semester")

            case_semester_connection = CaseSemesters(
                id=str(uuid.uuid4()), case_id=case.id, semester_id=semester.id
            )

            await uow.case_semesters_repository.create(case_semester_connection)
            case = await uow.case_repository.get_with_relations(case.id)
            response = self._to_response(case)

            await uow.commit()

            return response

    async def get_case_by_id(self, case_id: str) -> CaseResponse | None:
        async with self.uow as uow:
            case = await uow.case_repository.get_by_id(case_id=case_id)

            if not case:
                return None

            return self._to_response(case)

    async def get_all_cases(self, limit: int) -> list[CaseResponse]:
        async with self.uow as uow:
            cases = await uow.case_repository.get_all(limit=limit)
            return [self._to_response(case) for case in cases]

    async def update_case(
        self, case_id: str, schema: CaseUpdate
    ) -> CaseResponse | None:
        async with self.uow as uow:
            case = await uow.case_repository.get_by_id(case_id=case_id)

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

            await self._apply_fk_updates(case, fk_data, uow)

            case.updated_at = datetime.now(UTC)
            case = await uow.case_repository.get_with_relations(case.id)
            response = self._to_response(case)

            await uow.commit()

            return response

    async def delete_case(self, case_id: str) -> bool | None:
        async with self.uow as uow:
            case = await uow.case_repository.get_by_id(case_id=case_id)

            if not case:
                return None

            try:
                await uow.case_repository.delete_by_id(case_id)
                await uow.commit()
            except IntegrityError as err:
                if "foreign key constraint" in str(err.orig).lower():
                    raise CaseHasDependenciesError(
                        "Case cannot be deleted because it has external links"
                    ) from err
                raise

            return True

    def _get_case_semester(self, case: Cases) -> CaseSemesters | None:
        if not case.case_semesters:
            return None

        return case.case_semesters[0]

    @staticmethod
    def _get_semester_name(semester) -> str | None:
        if not semester:
            return None

        seasons = {
            "FALL": "Осенний",
            "SPRING": "Весенний",
        }
        season_name = seasons.get(semester.season, semester.season)

        return f"{season_name} {semester.year}"

    def _to_response(self, case: Cases) -> CaseResponse:
        case_semester = self._get_case_semester(case)
        semester = case_semester.semester if case_semester else None

        return CaseResponse(
            id=case.id,
            title=case.title,
            short_title=case.short_title,
            difficulty_level_id=case.difficulty_level_id,
            difficulty_level_name=case.difficulty_level.level_name
            if case.difficulty_level
            else None,
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
            case_semesters_id=case_semester.id if case_semester else None,
            semester_id=semester.id if semester else None,
            semester_season=semester.season if semester else None,
            semester_year=semester.year if semester else None,
            semester_name=self._get_semester_name(semester),
            creator_id=case.creator_id,
            creator_email=case.creator.email if case.creator else None,
            created_at=case.created_at,
            updated_at=case.updated_at,
        )

    # Работа с переходами статусов кейсов
    async def _transit_case_status(
        self,
        uow: CaseUoWProtocol,
        case_id: str,
        new_status_code: str,
    ) -> Cases | None:
        case = await uow.case_repository.get_by_id(case_id)

        if not case:
            return None

        if new_status_code not in ALLOWED_CASE_STATUS_TRANSITIONS[case.status.code]:
            raise ValueError("Invalid status transition")

        new_status = await uow.case_statuses_repository.get_by_code(
            status_code=new_status_code
        )

        if not new_status:
            raise ValueError(f"Status with code {new_status_code} not found")

        case.status = new_status
        case.status_id = new_status.id
        case.updated_at = datetime.now(UTC)

        return case

    async def send_to_review(self, case_id: str) -> CaseResponse | None:
        async with self.uow as uow:
            case = await self._transit_case_status(
                uow=uow,
                case_id=case_id,
                new_status_code="IN_REVIEW",
            )

            if not case:
                return None

            evaluation_service = EvaluationService(
                uow.evaluation_repository,
                uow.case_repository,
            )
            await evaluation_service.create_evaluation_form(
                case_id=case_id,
                creator_id=case.creator_id,
            )
            response = self._to_response(case)

            await uow.commit()

            return response

    async def reject(self, case_id: str) -> CaseResponse | None:
        return await self._change_case_status(case_id, "REVISION")

    async def activate_after_submition(self, case_id: str) -> CaseResponse | None:
        return await self._change_case_status(case_id, "ACTIVE")

    async def archive(self, case_id: str) -> CaseResponse | None:
        return await self._change_case_status(case_id, "ARCHIVED")

    async def _change_case_status(
        self,
        case_id: str,
        new_status_code: str,
    ) -> CaseResponse | None:
        async with self.uow as uow:
            case = await self._transit_case_status(
                uow=uow,
                case_id=case_id,
                new_status_code=new_status_code,
            )

            if not case:
                return None

            response = self._to_response(case)

            await uow.commit()

            return response


class CaseHasDependenciesError(Exception):
    """Кейс не может быть удален, так как есть связанные записи"""

    pass
