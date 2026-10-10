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
        # Check DATABASE_URL and DATABASE_URL_UNPOOLED
        raw_url = (self.DATABASE_URL or self.DATABASE_URL_UNPOOLED or "").strip()
        
        # Strip enclosing quotes if user pasted with quotes
        while (raw_url.startswith('"') and raw_url.endswith('"')) or (raw_url.startswith("'") and raw_url.endswith("'")):
            raw_url = raw_url[1:-1].strip()
            
        # Strip 'psql ' if user copied neon's psql command
        if raw_url.startswith("psql "):
            raw_url = raw_url[5:].strip()
            while (raw_url.startswith('"') and raw_url.endswith('"')) or (raw_url.startswith("'") and raw_url.endswith("'")):
                raw_url = raw_url[1:-1].strip()
                
        # Handle empty or obvious placeholders
        if (
            not raw_url
            or raw_url.lower() in ("none", "null", "undefined", "false", "true", "sqlite", "sqlite://")
            or "<" in raw_url
            or ">" in raw_url
        ):
            # Fallback to local sqlite
            db_path = BASE_DIR / "backend" / "backend_app.db"
            return f"sqlite:///{db_path}"
            
        # Normalize postgres:// to postgresql://
        if raw_url.startswith("postgres://"):
            raw_url = "postgresql://" + raw_url[len("postgres://"):]
            
        # Ensure sslmode=require if connecting to Neon
        if "neon.tech" in raw_url and "sslmode" not in raw_url:
            connector = "&" if "?" in raw_url else "?"
            raw_url = f"{raw_url}{connector}sslmode=require"
            
        # Validate that SQLAlchemy can parse it
        try:
            from sqlalchemy.engine.url import make_url
            parsed = make_url(raw_url)
            if not parsed.drivername:
                raise ValueError("No drivername parsed")
            return raw_url
        except Exception:
            # If invalid URL, fallback to sqlite safely
            db_path = BASE_DIR / "backend" / "backend_app.db"
            return f"sqlite:///{db_path}"

settings = Settings()
