from services.user_service import UserService
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
        unauthed_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid username or password",
        )

        await self.user_service.validate_auth_user(
            email=schema.email,
            password=schema.password
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

