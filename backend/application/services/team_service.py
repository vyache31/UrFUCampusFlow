import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError

from application.interfaces.uow.team_uow_protocol import TeamUoWProtocol
from infrastructure.db.models import Teams
from presentation.api.schemas.team import TeamCreate, TeamUpdate


class TeamService:
    def __init__(self, uow: TeamUoWProtocol):
        self.uow = uow

    @staticmethod
    async def _validate_refs(
        uow: TeamUoWProtocol,
        validate_attrs: dict,
    ) -> None:
        if "university_id" not in validate_attrs:
            return

        university = await uow.university_info_repository.get_by_id(
            validate_attrs["university_id"]
        )

        if not university:
            raise ValueError("University not found")

    async def create_team(self, schema: TeamCreate) -> Teams:
        async with self.uow as uow:
            existing_team = await uow.team_repository.get_by_name(schema.name)

            if existing_team:
                raise ValueError("Team already exist")

            await self._validate_refs(
                uow,
                {"university_id": schema.university_id},
            )

            team = Teams(
                id=str(uuid.uuid4()),
                name=schema.name,
                description=schema.description,
                notes=schema.notes,
                university_id=schema.university_id,
                status=schema.status,
                created_at=datetime.now(UTC),
            )

            team = await uow.team_repository.create(team)

            await uow.commit()

            return team

    async def get_team(self, team_id: str) -> Teams | None:
        async with self.uow as uow:
            return await uow.team_repository.get_by_id(team_id)

    async def get_all_teams(self, limit: int = 10) -> list[Teams]:
        async with self.uow as uow:
            teams = await uow.team_repository.get_all(limit)
            return list(teams)

    async def update_team(
        self,
        team_id: str,
        schema: TeamUpdate,
    ) -> Teams | None:
        async with self.uow as uow:
            team = await uow.team_repository.get_by_id(team_id)

            if not team:
                return None

            update_data = schema.model_dump(exclude_unset=True)
            await self._validate_refs(uow, update_data)

            for field, value in update_data.items():
                setattr(team, field, value)

            team.updated_at = datetime.now(UTC)

            await uow.team_repository.update()
            await uow.commit()

            return team

    async def delete_team(self, team_id: str) -> bool | None:
        async with self.uow as uow:
            team = await uow.team_repository.get_by_id(team_id)

            if not team:
                return None

            try:
                await uow.team_repository.delete(team)
                await uow.commit()
            except IntegrityError as err:
                if "foreign key constraint" in str(err.orig).lower():
                    raise TeamHasDependenciesError(
                        "Team cannot be deleted because it has external links"
                    ) from err
                raise

            return True


class TeamHasDependenciesError(Exception):
    """Команда не может быть удалена, так как есть связанные записи"""

    pass
