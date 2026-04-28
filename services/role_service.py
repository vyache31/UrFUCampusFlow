from models import Roles
from schemas.role import RoleCreate, RoleUpdate
from repositories.role_repository import RoleRepository


class RoleService:

    def __init__(self, rep: RoleRepository):
        self.rep = rep

    async def create_role(self, schema: RoleCreate) -> Roles:
        role = Roles(
            role_name=schema.role_name
        )

        return await self.rep.create(role)

    async def get_role_by_id(self, role_id: int) -> Roles | None:
        return await self.rep.get_by_id(role_id)

    async def get_all_roles(self, limit: int = 10) -> list[Roles]:
        return await self.rep.get_all(limit=limit)

    async def update_role(self, role_id: int, schema: RoleUpdate) -> Roles | None:
        role = await self.rep.get_by_id(role_id)
        if not role:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(role, key, value)

        return await self.rep.update(role)

    async def delete_role(self, role_id: int) -> bool:
        role = await self.rep.get_by_id(role_id)
        if not role:
            return None

        await self.rep.delete(role)
        return True
