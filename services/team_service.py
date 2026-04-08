import uuid
from datetime import datetime, UTC

from schemas.team import TeamCreate, TeamUpdate
from models.teams import Teams
from repositories.team_repository import TeamRepository


class TeamService:

    def __init__(self, team_repo: TeamRepository):
        self.team_repo = team_repo
        # self.semester_repo = semester_repo
        # self.university_repo = university_repo
        # self.case_repo = case_repo

        """
        Словарь атрибутов, существование которых нужно проверять
        при обновлении объекта Team. Он будет использован в
        маппинге validate_refs() в самом конце файла
        """
        self.validators = {
            # "role_id": (self.role_repo.get_by_id, "Role not found"),
            "university_id": (self.team_repo.verify_university, "University not found"),
        }

    async def create_team(self, schema: TeamCreate):
        is_exist = await self.team_repo.get_by_name(schema.name)
        if is_exist:
            raise ValueError("Team already exist")

        await self.validate_refs({"university_id": schema.university_id})

        team = Teams(
            id=str(uuid.uuid4()),
            name=schema.name,
            university_id=schema.university_id,
            status=schema.status,
            created_at=datetime.now(UTC)
        )

        return await self.team_repo.create(team)

    async def get_team(self, team_id: str):
        return await self.team_repo.get_by_id(team_id)

    async def get_all_teams(self, limit: int = 10):
        return await self.team_repo.get_all(limit)

    async def update_team(self, team_id: str, schema: TeamUpdate):
        team = await self.team_repo.get_by_id(team_id)

        if not team:
            return None

        update_data = schema.dict(exclude_unset=True)  # берет только те поля, которые реально передал фронт

        await self.validate_refs(update_data)

        for field, value in update_data.items():
            setattr(team, field, value)
        team.updated_at = datetime.now(UTC)

        await self.team_repo.update()
        return team

    async def delete_team(self, team_id: str) -> bool:
        team = await self.team_repo.get_by_id(team_id)

        if not team:
            return None

        await self.team_repo.delete(team)
        return True

    """
    Используется для того, чтобы не писать 3+ одинаковых if'ов
    при валидации в team_update()
    """

    async def validate_refs(self, validate_attrs: dict):
        for field, (getter, error) in self.validators.items():
            if field in validate_attrs:
                attr = await getter(validate_attrs[field])
                if not attr:
                    raise ValueError(error)
