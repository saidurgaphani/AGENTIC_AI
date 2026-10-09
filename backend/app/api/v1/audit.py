from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.schema import AuditEvent
from backend.app.schemas.execution import AuditEventSchema

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("")
def get_audit_summary(limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    formatted = [
        {
            "id": e.id,
            "actor": e.actor,
            "role": e.role,
            "event_type": e.event_type,
            "eventType": e.event_type,
            "target_entity": e.target_entity,
            "targetEntity": e.target_entity,
            "target_id": e.target_id,
            "targetId": e.target_id,
            "details": e.details,
            "beforeState": e.before_state,
            "afterState": e.after_state,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]
    return {
        "count": len(formatted),
        "events": formatted,
    }

@router.get("/events")
def list_audit_events(limit: int = 50, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "actor": e.actor,
            "role": e.role,
            "event_type": e.event_type,
            "eventType": e.event_type,
            "target_entity": e.target_entity,
            "targetEntity": e.target_entity,
            "target_id": e.target_id,
            "targetId": e.target_id,
            "details": e.details,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]
