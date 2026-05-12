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
    auth_jwt: AuthJWT = AuthJWT()

    model_config = SettingsConfigDict(env_file= BASE_DIR / '.env')


settings = Settings()