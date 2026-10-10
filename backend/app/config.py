import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Agents for Resilient Supply Chain Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Neon PostgreSQL configuration
    DATABASE_URL: str = ""
    DATABASE_URL_UNPOOLED: str = ""
    NEON_BRANCH: str = "production"
    
    # Gemini / Google ADK API Key
    GEMINI_API_KEY: str = ""
    
    # Clerk / Security
    SECRET_KEY: str = "scm-resilient-ops-secret-key-2026"
    CLERK_SECRET_KEY: str = ""
    
    # Mode
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = ""

    model_config = SettingsConfigDict(
        env_file=[
            str(BASE_DIR / ".env.local"),
            str(BASE_DIR / ".env"),
            str(BASE_DIR / "backend" / ".env")
        ],
        extra="ignore"
    )

    @property
    def sqlalchemy_database_uri(self) -> str:
        url = self.DATABASE_URL or self.DATABASE_URL_UNPOOLED
        if not url:
            # Fallback to local sqlite if no postgres configured in test env
            return "sqlite:///./backend_test.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        # Ensure sslmode=require if connecting to Neon
        if "neon.tech" in url and "sslmode" not in url:
            connector = "&" if "?" in url else "?"
            url = f"{url}{connector}sslmode=require"
        return url

settings = Settings()
