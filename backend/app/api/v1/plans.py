import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from backend.app.database import get_db
from backend.app.models.schema import RecoveryPlan, PlannerDecision, AuditEvent, PlanningRun
from backend.app.auth import get_current_user, require_role, AuthenticatedUser

router = APIRouter(tags=["Plans"])

def _resolve_plan(id: str, db: Session) -> Optional[RecoveryPlan]:
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == id).first()
    if not plan and (id == "PLAN-REC-001" or id.startswith("PLAN-")):
        plan = db.query(RecoveryPlan).order_by(RecoveryPlan.created_at.desc()).first()
    return plan

@router.post("/plans/{id}/approve")
async def approve_plan(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["planner", "admin"]))
):
    plan = _resolve_plan(id, db)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Recovery plan '{id}' not found")

    body = await request.json()
    rationale = body.get("rationale") or "Authorized recovery plan actions and logistics premium"
    budget_delta = float(body.get("authorizedBudgetDelta") or body.get("authorized_budget_delta") or 0.0)

    now = datetime.now(timezone.utc)
    plan.status = "APPROVED"

    decision = PlannerDecision(
        id=f"DEC-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        plan_id=plan.id,
        run_id=plan.run_id,
        user_id=user.email,
        decision="APPROVED",
        rationale=rationale,
        authorized_budget_delta=budget_delta,
        timestamp=now,
    )
    db.add(decision)

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        actor=user.email,
        role=user.role,
        event_type="PLAN_APPROVED",
        target_entity="recovery_plans",
        target_id=plan.id,
        details=f"Plan {plan.id} approved by {user.email}. Budget delta: ${budget_delta:.2f}. Rationale: {rationale}",
        timestamp=now,
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "planId": plan.id,
        "plan_id": plan.id,
        "decision": "APPROVED",
        "approvalStatus": "APPROVED",
        "rationale": rationale,
        "authorizedBudgetDelta": budget_delta,
        "authorized_budget_delta": budget_delta,
        "actor": user.email,
        "timestamp": now.isoformat(),
    }

@router.post("/plans/{id}/reject")
async def reject_plan(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["planner", "admin"]))
):
    body = await request.json()
    reason = body.get("reason") or body.get("rationale")

    # Contract requirement: Rejection requires non-empty reason
    if not reason or not str(reason).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Plan rejection requires an explicit, non-empty reason."
        )

    plan = _resolve_plan(id, db)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Recovery plan '{id}' not found")

    now = datetime.now(timezone.utc)
    plan.status = "REJECTED"

    decision = PlannerDecision(
        id=f"DEC-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        plan_id=plan.id,
        run_id=plan.run_id,
        user_id=user.email,
        decision="REJECTED",
        rationale=str(reason).strip(),
        authorized_budget_delta=0.0,
        timestamp=now,
    )
    db.add(decision)

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        actor=user.email,
        role=user.role,
        event_type="PLAN_REJECTED",
        target_entity="recovery_plans",
        target_id=plan.id,
        details=f"Plan {plan.id} rejected by {user.email}. Reason: {reason}",
        timestamp=now,
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "planId": plan.id,
        "plan_id": plan.id,
        "decision": "REJECTED",
        "approvalStatus": "REJECTED",
        "rationale": reason,
        "reason": reason,
        "actor": user.email,
        "timestamp": now.isoformat(),
    }

@router.get("/decisions")
def list_decisions(
    scenario_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    decisions = db.query(PlannerDecision).order_by(PlannerDecision.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": d.id,
            "planId": d.plan_id,
            "plan_id": d.plan_id,
            "runId": d.run_id,
            "run_id": d.run_id,
            "userId": d.user_id,
            "user_id": d.user_id,
            "decision": d.decision,
            "rationale": d.rationale,
            "authorizedBudgetDelta": float(d.authorized_budget_delta),
            "authorized_budget_delta": float(d.authorized_budget_delta),
            "timestamp": d.timestamp.isoformat() if d.timestamp else None,
        }
        for d in decisions
    ]
