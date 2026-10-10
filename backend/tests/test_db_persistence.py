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
    from sqlalchemy import inspect
    insp = inspect(engine)
    table_names = insp.get_table_names()
    assert "suppliers" in table_names
    assert "products" in table_names
    assert "scenarios" in table_names
    assert "planning_runs" in table_names
    assert "recovery_plans" in table_names
