from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.schema import RecoveryPlan, PlannerDecision, AuditEvent
from backend.app.schemas.execution import PlanDecisionRequest

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.post("/{id}/approve")
def approve_plan(id: str, payload: PlanDecisionRequest, db: Session = Depends(get_db)):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    plan.status = "APPROVED"

    decision = PlannerDecision(
        plan_id=plan.id,
        run_id=plan.run_id,
        user_id=payload.user_id or "lead_planner",
        decision="APPROVED",
        rationale=payload.rationale,
        authorized_budget_delta=payload.authorized_budget_delta or 0.0,
        timestamp=datetime.utcnow(),
    )
    db.add(decision)

    audit = AuditEvent(
        id=f"AUD-{int(datetime.utcnow().timestamp())}",
        actor=payload.user_id or "lead_planner",
        role="planner",
        event_type="PLAN_APPROVED",
        target_entity="recovery_plans",
        target_id=plan.id,
        details=f"Plan {plan.id} approved with rationale: {payload.rationale}",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "plan_id": plan.id,
        "approval_status": "APPROVED",
        "authorized_budget_delta": payload.authorized_budget_delta,
        "timestamp": decision.timestamp.isoformat(),
    }

@router.post("/{id}/reject")
def reject_plan(id: str, payload: PlanDecisionRequest, db: Session = Depends(get_db)):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    plan.status = "REJECTED"

    decision = PlannerDecision(
        plan_id=plan.id,
        run_id=plan.run_id,
        user_id=payload.user_id or "lead_planner",
        decision="REJECTED",
        rationale=payload.rationale,
        authorized_budget_delta=0.0,
        timestamp=datetime.utcnow(),
    )
    db.add(decision)

    audit = AuditEvent(
        id=f"AUD-{int(datetime.utcnow().timestamp())}",
        actor=payload.user_id or "lead_planner",
        role="planner",
        event_type="PLAN_REJECTED",
        target_entity="recovery_plans",
        target_id=plan.id,
        details=f"Plan {plan.id} rejected. Reason: {payload.rationale}",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "plan_id": plan.id,
        "approval_status": "REJECTED",
        "timestamp": decision.timestamp.isoformat(),
    }
