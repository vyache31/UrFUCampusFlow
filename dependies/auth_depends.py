from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from services.auth_service import AuthService
from dependies.user_depends import get_user_service
from services.user_service import UserService
from services.auth_service import auth_utils
from models.auth import Users

security = HTTPBearer()


def get_auth_service(user_service: UserService = Depends(get_user_service)):
    return AuthService(user_service)


async def check_auth(
    credentials=Depends(security),
    user_service: UserService = Depends(get_user_service),
) -> Users:
    token = credentials.credentials

    try:
        payload = auth_utils.decode_jwt(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token"
        )

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


async def require_admin_role(
        user=Depends(check_auth)
):
    if not user.role.code == 'ADMIN':
        raise HTTPException(
            status_code=403,
            detail="forbidden"
        )

    return user
