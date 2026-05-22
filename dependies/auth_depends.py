from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from services.auth_service import AuthService
from dependies.user_depends import get_user_service
from services.user_service import UserService
from services.auth_service import auth_utils
from models.auth import Users
from auth.utils_jwt import (
    TOKEN_TYPE_FIELD, TOKEN_TYPE_REFRESH,
    TOKEN_TYPE_ACCESS,
)
from jwt.exceptions import ExpiredSignatureError

security = HTTPBearer(auto_error=False)


def get_auth_service(user_service: UserService = Depends(get_user_service)):
    return AuthService(user_service)


def get_validate_token_type(payload: dict, token_type: str) -> bool:
    current_token_type = payload.get(TOKEN_TYPE_FIELD)
    if current_token_type == token_type:
        return True
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid token type {current_token_type!r} excepted {token_type!r}",
    )


async def get_user_by_token_type(
        payload: dict,
        user_service: UserService,
) -> Users:
    user_email = payload.get('sub')
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='invalid token'
        )

    user = await user_service.get_user_by_email(user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='user not found'
        )

    return user


class UserGetterFromToken:
    def __init__(self, token_type: str):
        self.token_type = token_type

    async def __call__(self,
                       credentials=Depends(security),
                       user_service: UserService = Depends(get_user_service),
                       ):
        try:
            token = credentials.credentials
            payload = auth_utils.decode_jwt(token)
        except AttributeError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="request must include a token"
            )
        except ExpiredSignatureError as err:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"token was expired"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"invalid token"
            )
        get_validate_token_type(payload, self.token_type)
        return await get_user_by_token_type(
            payload=payload,
            user_service=user_service,
        )


get_current_auth_user = UserGetterFromToken(TOKEN_TYPE_ACCESS)
get_current_auth_user_for_refresh = UserGetterFromToken(TOKEN_TYPE_REFRESH)


async def require_admin_role(
        user=Depends(get_current_auth_user)
):
    if not user.role.code == 'ADMIN':
        raise HTTPException(
            status_code=403,
            detail="forbidden"
        )

    return user
