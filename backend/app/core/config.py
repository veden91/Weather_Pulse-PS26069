import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "WeatherPulse India"
    SUBTITLE: str = "National Weather Intelligence & Analytics Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./weatherpulse.db"

    # Security
    SECRET_KEY: str = "weatherpulse-india-national-weather-security-secret-key-sih2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_REPORTS: str = "weatherpulse.reports.incoming"
    KAFKA_TOPIC_EVENTS: str = "weatherpulse.events.clustered"
    KAFKA_ENABLED: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    # Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "weatherpulse-media"
    MINIO_SECURE: bool = False

    # Simulator
    SIMULATOR_INTERVAL_SECONDS: float = 4.0
    SIMULATOR_AUTO_START: bool = False

    # External APIs
    OPENWEATHER_API_KEY: str | None = None
    WEATHERAPI_KEY: str | None = None
    DATA_GOV_IN_API_KEY: str | None = None
    IMD_API_ENDPOINT: str | None = None
    TWITTER_BEARER_TOKEN: str | None = None
    TOMORROW_API_KEY: str | None = None

    @property
    def live_collector_enabled(self) -> bool:
        return any([
            self.OPENWEATHER_API_KEY,
            self.WEATHERAPI_KEY,
            self.DATA_GOV_IN_API_KEY,
            self.IMD_API_ENDPOINT,
            self.TWITTER_BEARER_TOKEN,
            self.TOMORROW_API_KEY
        ])

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
