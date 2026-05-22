from services.user_service import UserService, InvalidCredentialsError
from schemas.user import (
    UserCreate, UserTokenInfo,
    UserLoginRequest
)
from auth.utils_jwt import create_access_token, create_refresh_token
from fastapi import HTTPException, status


class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def register_user(
            self,
            schema: UserCreate
    ) -> UserTokenInfo:
        await self.user_service.create_user(schema)

        access_token = create_access_token(schema)
        refresh_token = create_refresh_token(schema)
        return UserTokenInfo(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def login_user(
            self,
            schema: UserLoginRequest
    ) -> UserTokenInfo:

        try:
            await self.user_service.authenticate_user(
                email=schema.email,
                password=schema.password
            )
        except InvalidCredentialsError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid username or password"
            )
        access_token = create_access_token(schema)
        refresh_token = create_refresh_token(schema)
        return UserTokenInfo(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_user(
            self,
            schema: UserLoginRequest
    ):
        access_token = create_access_token(schema)
        return UserTokenInfo(
            access_token=access_token,
        )