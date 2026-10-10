from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

db_uri = settings.sqlalchemy_database_uri

# Connection engine parameters
engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" in db_uri:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

try:
    engine = create_engine(db_uri, **engine_kwargs)
except Exception as e:
    # Graceful fallback to SQLite if PostgreSQL connection fails
    fallback_path = settings.BASE_DIR / "backend" / "backend_app.db"
    db_uri = f"sqlite:///{fallback_path}"
    engine_kwargs = {
        "pool_pre_ping": True,
        "connect_args": {"check_same_thread": False},
    }
    engine = create_engine(db_uri, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
