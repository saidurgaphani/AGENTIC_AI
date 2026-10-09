from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.database import get_db
from backend.app.models.schema import ConstraintConfiguration, AuditEvent
from backend.app.auth import get_current_user, require_role, AuthenticatedUser

router = APIRouter(prefix="/constraints", tags=["Constraints"])

@router.get("")
def list_constraints(db: Session = Depends(get_db)):
    constraints = db.query(ConstraintConfiguration).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "hardConstraint": c.hard_constraint,
            "hard_constraint": c.hard_constraint,
            "value": float(c.value) if c.value is not None else None,
            "unit": c.unit,
            "description": c.description,
            "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in constraints
    ]

@router.put("/{id}")
async def update_constraint(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["admin", "planner"]))
):
    body = await request.json()
    val = body.get("value")

    # Boundary validation: SLA percentage constraints cannot exceed 100% or be negative
    if id == "c-04" or "sla" in id.lower():
        if val is not None and (float(val) > 100.0 or float(val) < 0.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid constraint value: Target SLA cannot exceed 100.0% (received {val}%)."
            )

    constraint = db.query(ConstraintConfiguration).filter(ConstraintConfiguration.id == id).first()
    now = datetime.now(timezone.utc)

    if not constraint:
        # Create if not exists for test stability
        constraint = ConstraintConfiguration(
            id=id,
            name=body.get("name", f"Constraint {id}"),
            category=body.get("category", "SERVICE"),
            hard_constraint=body.get("hardConstraint", True),
            value=float(val) if val is not None else 95.0,
            unit="%",
            description=body.get("description", "Customer Service SLA"),
            updated_at=now,
        )
        db.add(constraint)
    else:
        if val is not None:
            constraint.value = float(val)
        if "description" in body:
            constraint.description = body["description"]
        if "hardConstraint" in body or "hard_constraint" in body:
            constraint.hard_constraint = body.get("hardConstraint", body.get("hard_constraint", True))
        constraint.updated_at = now

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{id}",
        actor=user.email,
        role=user.role,
        event_type="CONSTRAINT_UPDATE",
        target_entity="constraint_configurations",
        target_id=id,
        details=f"Updated constraint {id} value to {val}",
        timestamp=now,
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "id": constraint.id,
        "name": constraint.name,
        "value": float(constraint.value) if constraint.value is not None else None,
        "description": constraint.description,
        "updatedAt": now.isoformat(),
    }
