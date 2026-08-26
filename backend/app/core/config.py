from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    postgres_user: str = "vpnadmin"
    postgres_password: str = "vpnadmin"
    postgres_db: str = "vpnadmin"
    postgres_host: str = "db"
    postgres_port: int = 5432

    cors_origins: list[str] = ["http://localhost:5173"]

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expires_minutes: int = 30
    jwt_refresh_expires_days: int = 30

    bot_api_key: str = "change-me-bot-api-key"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
