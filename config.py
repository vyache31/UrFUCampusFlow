from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OAUTH_MICROSOFT_CLIENT_ID: str
    OAUTH_MICROSOFT_CLIENT_SECRET: str
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file='.env')


settings = Settings()