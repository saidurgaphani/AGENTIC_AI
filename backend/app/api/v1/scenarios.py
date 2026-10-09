from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from backend.app.database import get_db
from backend.app.models.schema import Scenario
from backend.app.schemas.scenario import ScenarioSchema, ScenarioCreateSchema
from backend.app.services.simulation_service import SimulationService
from backend.app.schemas.execution import RunCreateRequest

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.get("", response_model=List[ScenarioSchema])
def list_scenarios(db: Session = Depends(get_db)):
    return db.query(Scenario).all()

@router.post("", response_model=ScenarioSchema)
def create_scenario(payload: ScenarioCreateSchema, db: Session = Depends(get_db)):
    scenario_id = f"SCN-2026-CUSTOM-{int(datetime.utcnow().timestamp())}"
    scenario = Scenario(
        id=scenario_id,
        name=payload.name,
        description=payload.description,
        dataset_version="1.0.0-canonical",
        random_seed="SEED_2026_SCM_V1",
        critical_supplier_id=payload.critical_supplier_id,
        disruption_start_day=payload.disruption_start_day,
        disruption_duration_days=payload.disruption_duration_days,
        evaluation_horizon_days=payload.evaluation_horizon_days,
        safety_stock_days=payload.safety_stock_days,
        daily_demand_units=payload.daily_demand_units,
        shortage_penalty_per_unit=payload.shortage_penalty_per_unit,
        status="READY",
        created_at=datetime.utcnow(),
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario

@router.get("/{id}", response_model=ScenarioSchema)
def get_scenario(id: str, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.post("/{id}/runs")
def trigger_scenario_run(id: str, payload: RunCreateRequest, db: Session = Depends(get_db)):
    sim_service = SimulationService(db)
    try:
        results = sim_service.run_all_strategies(
            scenario_id=id,
            initiating_user=payload.user_id or "lead_planner",
        )
        return {
            "status": "COMPLETED",
            "scenario_id": id,
            "strategies_executed": len(results),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")
