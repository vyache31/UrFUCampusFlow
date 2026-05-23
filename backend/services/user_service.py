import uuid
from datetime import datetime, UTC
from repositories.user_repository import UserRepository
from schemas.user import (
    UserCreate, UserUpdate,
    UserResponse
)
from models import Users
import auth.utils_jwt as auth_utils_jwt
from fastapi import HTTPException, status


class InvalidCredentialsError(Exception):
    pass


class UserService:

    def __init__(self, rep: UserRepository):
        self.rep = rep

    async def create_user(
            self,
            schema: UserCreate
    ) -> UserResponse:
        is_exist = await self.rep.get_by_email(schema.email)
        role = await self.rep.get_role_by_id(schema.role_id)

        # TODO: заменить на HTTPException's, убрать HTTP из сервисного слоя!!!!
        if is_exist:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exist"
            )
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )

        user = Users(
            id=str(uuid.uuid4()),
            email=schema.email,
            role_id=schema.role_id,
            password_hash=auth_utils_jwt.hash_password(schema.password).decode('utf-8'),
            created_at=datetime.now(UTC)
        )

        user = await self.rep.create(user)
        user = await self.rep.get_with_relations(user.id)

        return self._to_response(user)

    async def get_user_by_id(self, user_id: str):
        user = await self.rep.get_by_id(user_id)

        return user

    async def get_user_by_email(self, user_email: str):
        user = await self.rep.get_by_email(user_email)

        return user

    async def get_all_users(self, limit: int) -> list[UserResponse]:
        users = await self.rep.get_all(limit)

        return [
            UserResponse(
                id=user.id,
                role_id=user.role_id,
                email=user.email,
                role_name=user.role.role_name if user.role else None,
                created_at=user.created_at
            )
            for user in users
        ]

    async def update_user(self, user_id: str, schema: UserUpdate):
        user = await self.rep.get_by_id(user_id)

        if not user:
            return None

        if schema.email:
            user.email = schema.email
        if schema.password:
            user.password_hash = auth_utils_jwt.hash_password(schema.password).decode('utf-8')
        if schema.role_id:
            role = await self.rep.get_role_by_id(schema.role_id)  # TODO: переделать, убрав в role_service
            if not role:
                raise ValueError("Role not found")
            user.role_id = schema.role_id
        user.updated_at = datetime.now(UTC)

        await self.rep.update()
        return user

    # При удачном удалении возвращает True
    async def delete_user(self, user_id: str) -> bool:
        user = await self.rep.get_by_id(user_id)

        if not user:
            return None

        await self.rep.delete(user)
        return True

    async def authenticate_user(
            self,
            email: str,
            password: str,
    ) -> Users:
        user = await self.rep.get_by_email(email)
        if not user:
            raise InvalidCredentialsError()

        if not auth_utils_jwt.validate_password(
                password=password,
                hashed_password=user.password_hash,
        ):
            raise InvalidCredentialsError()

        return user


    def _to_response(self, user: Users) -> UserResponse:
        return UserResponse(
            id=user.id,
            email=user.email,
            role_id=user.role_id,
            role_name=user.role.role_name if user.role else None,
            created_at=user.created_at
        )
