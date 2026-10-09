from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.schema import PlanningRun, AgentProposal, RecoveryPlan
from backend.app.schemas.execution import PlanningRunSchema, AgentProposalSchema, RecoveryPlanSchema

router = APIRouter(prefix="/runs", tags=["Runs"])

@router.get("", response_model=List[PlanningRunSchema])
def list_runs(db: Session = Depends(get_db)):
    return db.query(PlanningRun).order_by(PlanningRun.created_at.desc()).limit(20).all()

@router.get("/{id}", response_model=PlanningRunSchema)
def get_run(id: str, db: Session = Depends(get_db)):
    run = db.query(PlanningRun).filter(PlanningRun.id == id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Planning run not found")
    return run

@router.get("/{id}/proposals", response_model=List[AgentProposalSchema])
def get_run_proposals(id: str, db: Session = Depends(get_db)):
    return db.query(AgentProposal).filter(AgentProposal.run_id == id).all()

@router.get("/{id}/plan", response_model=RecoveryPlanSchema)
def get_run_plan(id: str, db: Session = Depends(get_db)):
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.run_id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No recovery plan associated with run")
    return plan
