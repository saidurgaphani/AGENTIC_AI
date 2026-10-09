from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.schema import AuditEvent
from backend.app.schemas.execution import AuditEventSchema

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/events", response_model=List[AuditEventSchema])
def list_audit_events(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
