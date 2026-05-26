from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent

class AuthJWT(BaseModel):
    private_key_path: Path = BASE_DIR / "auth" / "certs" / "jwt-private.pem"
    public_key_path: Path = BASE_DIR / "auth" / "certs" / "jwt-public.pem"
    algorithm: str = 'RS256'
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

class Settings(BaseSettings):
    OAUTH_MICROSOFT_CLIENT_ID: str
    OAUTH_MICROSOFT_CLIENT_SECRET: str
    DATABASE_URL: str
    oauth_microsoft_redirect_url: str
    oauth_microsoft_authority: str
    oauth_microsoft_auth_base_url: str
    oauth_microsoft_token_url: str
    oauth_microsoft_me_url: str
    token_encryption_key: str
    auth_jwt: AuthJWT = AuthJWT()
    OAUTH_MICROSOFT_REDIRECT_URL: str
    OAUTH_MICROSOFT_AUTHORITY: str
    OAUTH_MICROSOFT_AUTH_BASE_URL: str
    OAUTH_MICROSOFT_TOKEN_URL: str
    OAUTH_MICROSOFT_ME_URL: str
    TOKEN_ENCRYPTION_KEY: str
    REDIS_URL: str
    FRONTEND_URL: str
    OAUTH_MICROSOFT_EVENTS_URL: str
    OAUTH_MICROSOFT_CALENDAR_VIEW_URL: str
    AI_MODEL: str
    GROQ_API_KEY: str
    GROQ_REQUEST_URL: str
    BACKEND_URL: str
    BOT_TOKEN: str
    BOT_JWT: str

    model_config = SettingsConfigDict(env_file= BASE_DIR / '.env')


settings = Settings()
