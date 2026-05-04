from services.user_service import UserService, InvalidCredentialsError
from schemas.user import (
    UserCreate, UserTokenInfo,
    UserLoginRequest
)
import auth.utils_jwt as auth_utils
from fastapi import HTTPException, status


class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def register_user(
            self,
            schema: UserCreate
    ) -> UserTokenInfo:
        user = await self.user_service.create_user(schema)

        jwt_payload = {
            "sub": user.email,
            "email": user.email,
        }
        access_token = auth_utils.encode_jwt(jwt_payload)

        return UserTokenInfo(
            access_token=access_token,
            token_type="Bearer"
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
                status_code=401,
                detail="invalid username or password"
            )

        jwt_payload = {
            "sub": schema.email,
            "email": schema.email,
        }
        access_token = auth_utils.encode_jwt(jwt_payload)
        return UserTokenInfo(
            access_token=access_token,
            token_type="Bearer"
        )
