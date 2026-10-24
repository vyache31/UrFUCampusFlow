from application.interfaces.uow.role_uow_protocol import RoleUoWProtocol
from infrastructure.db.models import Roles
from presentation.api.schemas.role import RoleCreate, RoleResponse, RoleUpdate


class RoleService:

    def __init__(self, uow: RoleUoWProtocol):
        self.uow = uow

    async def create_role(self, schema: RoleCreate) -> RoleResponse:
        role = Roles(
            code=schema.code,
            role_name=schema.role_name
        )

        async with self.uow as uow:
            role = await uow.role_repository.create(role)
            response = RoleResponse.model_validate(role)
            await uow.commit()
            return response

    async def get_role_by_id(self, role_id: int) -> RoleResponse | None:
        async with self.uow as uow:
            role = await uow.role_repository.get_by_id(role_id)
            return RoleResponse.model_validate(role) if role else None

    async def get_all_roles(self, limit: int = 10) -> list[RoleResponse]:
        async with self.uow as uow:
            roles = await uow.role_repository.get_all(limit=limit)
            return [RoleResponse.model_validate(role) for role in roles]

    async def update_role(self, role_id: int, schema: RoleUpdate) -> RoleResponse | None:
        async with self.uow as uow:
            role = await uow.role_repository.get_by_id(role_id)
            if not role:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(role, key, value)

            role = await uow.role_repository.update(role)
            response = RoleResponse.model_validate(role)
            await uow.commit()
            return response

    async def delete_role(self, role_id: int) -> bool:
        async with self.uow as uow:
            role = await uow.role_repository.get_by_id(role_id)
            if not role:
                return False

            await uow.role_repository.delete(role)
            await uow.commit()
            return True
