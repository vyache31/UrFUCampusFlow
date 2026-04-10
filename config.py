from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    OAUTH_MICROSOFT_CLIENT_ID: str
    OAUTH_MICROSOFT_CLIENT_SECRET: str
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file= BASE_DIR / '.env')


settings = Settings()