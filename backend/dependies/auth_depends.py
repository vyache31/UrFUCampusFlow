from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from services.auth_service import AuthService
from dependies.user_depends import get_user_service
from services.user_service import UserService
from auth import utils_jwt
from models.auth import Users
from auth.utils_jwt import TokenType
from jwt.exceptions import ExpiredSignatureError

security = HTTPBearer(auto_error=False)


def get_auth_service(user_service: UserService = Depends(get_user_service)):
    return AuthService(user_service)


def get_validate_token_type(payload: dict, allowed_types: set[TokenType]) -> TokenType:
    current_token_type = payload.get(TokenType.field.value)
    print(f"LOG: curr - {current_token_type}, token_type - {allowed_types}!")
    for token_type in allowed_types:
        if current_token_type == token_type.value:
            return current_token_type
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Invalid token type {current_token_type!r} excepted {', '.join(t.value for t in allowed_types)}",
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


class GetterFromToken:
    def __init__(self, token_type: set[TokenType]):
        self.token_type = token_type

    async def __call__(self,
                       credentials=Depends(security),
                       user_service: UserService = Depends(get_user_service),
                       ):
        try:
            token = credentials.credentials
            payload = utils_jwt.decode_jwt(token)
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
                detail=f"invalid token {e}" # ONLY FOR DEV MODE
            )
        token_type = get_validate_token_type(payload, self.token_type)
        match token_type:
            case TokenType.user_access.value:
                print("LOG: received user access")
                print(await get_user_by_token_type(
                    payload=payload,
                    user_service=user_service,
                ))
                return await get_user_by_token_type(
                    payload=payload,
                    user_service=user_service,
                )

            case TokenType.service_access.value:
                return payload[TokenType.field.value]


get_current_auth_user = GetterFromToken({TokenType.user_access})
get_current_auth_user_for_refresh = GetterFromToken({TokenType.refresh})
get_current_subject = GetterFromToken({TokenType.service_access, TokenType.user_access})



async def require_admin_role(
        user=Depends(get_current_auth_user)
):
    if not user.role.code == 'ADMIN':
        raise HTTPException(
            status_code=403,
            detail="forbidden"
        )

    return user
