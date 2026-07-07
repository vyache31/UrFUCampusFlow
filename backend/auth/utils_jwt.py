import datetime
from enum import Enum

import jwt
from config import settings
import bcrypt
from datetime import timedelta

from schemas.user import UserLoginRequest, UserCreate


class TokenType(Enum):
    field = "type"
    user_access = "user_access"
    refresh = "refresh"
    service_access = "service_access"


def encode_jwt(
        payload: dict,
        private_key: str = settings.auth_jwt.private_key_path.read_text(),
        algorithm: str = settings.auth_jwt.algorithm,
        expire_minutes: int = settings.auth_jwt.access_token_expire_minutes,
        expire_timedelta: timedelta | None = None,
) -> str:
    to_encode = payload.copy()
    now = datetime.datetime.now(datetime.UTC)
    if expire_timedelta:
        expire = now + expire_timedelta
    else:
        expire = now + timedelta(minutes=expire_minutes)
    to_encode.update(
        exp=expire,
        iat=now,
    )
    encoded = jwt.encode(
        to_encode,
        private_key,
        algorithm=algorithm
    )
    return encoded


def decode_jwt(
        token: str | bytes,
        public_key: str = settings.auth_jwt.public_key_path.read_text(),
        algorithm: str = settings.auth_jwt.algorithm,
):
    decoded = jwt.decode(
        token,
        public_key,
        algorithms=[algorithm]
    )

    return decoded


def hash_password(
        password: str
) -> bytes:
    salt = bcrypt.gensalt()
    pwd_bytes: bytes = password.encode()

    return bcrypt.hashpw(pwd_bytes, salt)


def validate_password(
        password: str,
        hashed_password: bytes
) -> bool:
    return bcrypt.checkpw(
        password=password.encode(),
        hashed_password=hashed_password.encode()
    )


def create_jwt(
        token_type: TokenType,
        token_data: dict,
        expire_minutes: int = settings.auth_jwt.access_token_expire_minutes,
        expire_timedelta: timedelta | None = None,
) -> str:
    jwt_payload = {TokenType.field.value: token_type.value}
    jwt_payload.update(token_data)
    return encode_jwt(
        payload=jwt_payload,
        expire_minutes=expire_minutes,
        expire_timedelta=expire_timedelta,
    )


def create_user_access_token(schema: UserLoginRequest | UserCreate) -> str:
    jwt_payload = {
        "sub": schema.email,
        "email": schema.email,
    }
    return create_jwt(
        token_type=TokenType.user_access,
        token_data=jwt_payload,
    )

def create_service_access_token(sub: str) -> str:
    jwt_payload = {
        "sub": sub
    }

    return create_jwt(
        token_type=TokenType.service_access,
        token_data=jwt_payload,
        expire_timedelta=timedelta(days=settings.auth_jwt.access_service_token_expire_days)
    )

def create_refresh_token(
        schema: UserLoginRequest | UserCreate
) -> str:
    jwt_payload = {
        "sub": schema.email,
    }
    return create_jwt(
        token_type=TokenType.refresh,
        token_data=jwt_payload,
        expire_timedelta=timedelta(settings.auth_jwt.refresh_token_expire_days)
    )
