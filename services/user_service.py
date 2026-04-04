import uuid
from repositories.user_repository import UserRepository
from schemas.user import UserCreate, UserUpdate
from models.auth import Users


# from core.security import hash_password

class UserService:

    def __init__(self, rep: UserRepository):
        self.rep = rep

    async def create_user(self, schema: UserCreate):
        is_exist = await self.rep.get_by_id(schema.email)

        if is_exist:
            raise ValueError("User already exist")

        user = Users(
            id=uuid.uuid4(),
            email=schema.email,
            role_id=schema.role_id,
            password_hash=schema.password  # Прикрутить хэширование пароля
        )

        return await self.rep.create(user)

    async def get_user(self, user_id: str):
        return await self.rep.get_by_id(user_id)

    async def get_all_users(self, limit: int = 10):
        return await self.rep.get_all(limit)

    async def update_user(self, user_id: str, schema: UserUpdate):
        user = await self.rep.get_by_id(user_id)

        if not user:
            return None

        if schema.email:
            user.email = schema.email
        if schema.password:
            user.password = schema.password
        if schema.role_id:
            user.role_id = schema.role_id

        await self.rep.update()
        return user

    # При удачном удалении возвращает True
    async def delete_user(self, user_id: str) -> bool:
        user = await self.rep.get_by_id(user_id)

        if not user:
            return None

        await self.rep.delete(user)
        return True
