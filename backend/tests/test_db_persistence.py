import pytest
from sqlalchemy import create_engine, text
from backend.app.config import settings

def test_neon_connection():
    engine = create_engine(settings.sqlalchemy_database_uri)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1")).scalar()
        assert res == 1

def test_neon_tables_exist():
    engine = create_engine(settings.sqlalchemy_database_uri)
    with engine.connect() as conn:
        tables = conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )).fetchall()
        table_names = [t[0] for t in tables]
        assert "suppliers" in table_names
        assert "products" in table_names
        assert "scenarios" in table_names
        assert "planning_runs" in table_names
        assert "recovery_plans" in table_names
