import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

def test_api_network_summary():
    res = client.get("/api/v1/network/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_suppliers"] >= 3
    assert data["critical_supplier"] == "SUP-01"

def test_api_dataset_validate():
    res = client.get("/api/v1/datasets/validate")
    assert res.status_code == 200
    data = res.json()
    assert data["validation_status"] == "PASSED"
    assert data["hard_violations"] == 0
    assert len(data["checks"]) >= 4

def test_api_scenarios_list():
    res = client.get("/api/v1/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["critical_supplier_id"] == "sup-01"
