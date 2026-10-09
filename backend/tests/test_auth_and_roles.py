import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_unauthenticated_request_has_valid_identity():
    """Verify default authentication contract in development environment."""
    res = client.get("/api/v1/me")
    assert res.status_code == 200
    data = res.json()
    assert "role" in data
    assert data["role"] in ["ADMIN", "SUPPLY_CHAIN_PLANNER"]

def test_viewer_role_rejected_from_plan_approval():
    """Verify that a user with VIEWER role is rejected with 403 when trying to approve a plan."""
    res = client.post(
        "/api/v1/plans/PLAN-REC-001/approve",
        headers={"x-user-role": "viewer", "x-user-id": "usr-viewer-01"},
        json={"rationale": "Viewer attempting approval", "authorizedBudgetDelta": 0},
    )
    assert res.status_code == 403
    assert "Forbidden" in res.json().get("detail", "")

def test_planner_role_permitted_for_plan_approval():
    """Verify that a user with PLANNER role is permitted to approve plans."""
    res = client.post(
        "/api/v1/plans/PLAN-REC-001/approve",
        headers={"x-user-role": "planner", "x-user-id": "usr-planner-01"},
        json={"rationale": "Planner authorized emergency air expedite", "authorizedBudgetDelta": 48200},
    )
    assert res.status_code in [200, 404] # 200 if plan exists, 404 if not found (not 403 Forbidden!)
    if res.status_code == 200:
        data = res.json()
        assert data["decision"] == "APPROVED"
        assert data["authorizedBudgetDelta"] == 48200

def test_plan_rejection_requires_non_empty_reason():
    """Verify that rejecting a plan with an empty reason returns 422 Unprocessable Entity."""
    res = client.post(
        "/api/v1/plans/PLAN-REC-001/reject",
        headers={"x-user-role": "planner", "x-user-id": "usr-planner-01"},
        json={"reason": ""},
    )
    assert res.status_code == 422
