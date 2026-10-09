import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schema import Scenario, Supplier, TransportLane, AuditEvent
from backend.app.services.simulation_service import SimulationService
from backend.app.services.impact_service import ImpactService
from backend.app.auth import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.get("")
def list_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).order_by(Scenario.created_at.desc()).all()
    # Format for both snake_case and camelCase consumers
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "dataset_version": s.dataset_version,
            "datasetVersion": s.dataset_version,
            "random_seed": s.random_seed,
            "randomSeed": s.random_seed,
            "critical_supplier_id": s.critical_supplier_id,
            "criticalSupplierId": s.critical_supplier_id,
            "disruption_start_day": s.disruption_start_day,
            "disruptionStartDay": s.disruption_start_day,
            "disruption_duration_days": s.disruption_duration_days,
            "disruptionDurationDays": s.disruption_duration_days,
            "evaluation_horizon_days": s.evaluation_horizon_days,
            "evaluationHorizonDays": s.evaluation_horizon_days,
            "safety_stock_days": s.safety_stock_days,
            "safetyStockDays": s.safety_stock_days,
            "daily_demand_units": s.daily_demand_units,
            "dailyDemandUnits": s.daily_demand_units,
            "shortage_penalty_per_unit": float(s.shortage_penalty_per_unit),
            "shortagePenaltyPerUnit": float(s.shortage_penalty_per_unit),
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
        }
        for s in scenarios
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_scenario(
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    body = await request.json()
    now = datetime.now(timezone.utc)
    scenario_id = body.get("id") or f"SCN-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    crit_sup = body.get("criticalSupplierId") or body.get("critical_supplier_id") or "sup-01"
    start_day = int(body.get("disruptionStartDay") or body.get("disruption_start_day") or 4)
    duration = int(body.get("disruptionDurationDays") or body.get("disruption_duration_days") or 7)
    horizon = int(body.get("evaluationHorizonDays") or body.get("evaluation_horizon_days") or 14)
    safety_days = int(body.get("safetyStockDays") or body.get("safety_stock_days") or 3)
    demand = int(body.get("dailyDemandUnits") or body.get("daily_demand_units") or 200)
    penalty = float(body.get("shortagePenaltyPerUnit") or body.get("shortage_penalty_per_unit") or 150.0)

    scenario = Scenario(
        id=scenario_id,
        name=body.get("name", "Custom Disruption Scenario"),
        description=body.get("description", "User-configured resilience scenario"),
        dataset_version=body.get("datasetVersion") or body.get("dataset_version") or "1.0.0-canonical",
        random_seed=body.get("randomSeed") or body.get("random_seed") or "SEED_2026_SCM_V1",
        critical_supplier_id=crit_sup,
        disruption_start_day=start_day,
        disruption_duration_days=duration,
        evaluation_horizon_days=horizon,
        safety_stock_days=safety_days,
        daily_demand_units=demand,
        shortage_penalty_per_unit=penalty,
        status="ACTIVE",
        created_at=now,
    )
    db.add(scenario)

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        actor=user.email,
        role=user.role,
        event_type="SCENARIO_CREATED",
        target_entity="scenarios",
        target_id=scenario.id,
        details=f"Created scenario {scenario.name} targeting supplier {crit_sup}",
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(scenario)

    return {
        "id": scenario.id,
        "name": scenario.name,
        "description": scenario.description,
        "criticalSupplierId": scenario.critical_supplier_id,
        "critical_supplier_id": scenario.critical_supplier_id,
        "disruptionStartDay": scenario.disruption_start_day,
        "disruption_start_day": scenario.disruption_start_day,
        "disruptionDurationDays": scenario.disruption_duration_days,
        "disruption_duration_days": scenario.disruption_duration_days,
        "safetyStockDays": scenario.safety_stock_days,
        "dailyDemandUnits": scenario.daily_demand_units,
        "shortagePenaltyPerUnit": float(scenario.shortage_penalty_per_unit),
        "status": scenario.status,
        "createdAt": scenario.created_at.isoformat(),
    }

@router.get("/{id}")
def get_scenario(id: str, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    return {
        "id": scenario.id,
        "name": scenario.name,
        "description": scenario.description,
        "dataset_version": scenario.dataset_version,
        "datasetVersion": scenario.dataset_version,
        "random_seed": scenario.random_seed,
        "randomSeed": scenario.random_seed,
        "critical_supplier_id": scenario.critical_supplier_id,
        "criticalSupplierId": scenario.critical_supplier_id,
        "disruption_start_day": scenario.disruption_start_day,
        "disruptionStartDay": scenario.disruption_start_day,
        "disruption_duration_days": scenario.disruption_duration_days,
        "disruptionDurationDays": scenario.disruption_duration_days,
        "evaluation_horizon_days": scenario.evaluation_horizon_days,
        "evaluationHorizonDays": scenario.evaluation_horizon_days,
        "safety_stock_days": scenario.safety_stock_days,
        "safetyStockDays": scenario.safety_stock_days,
        "daily_demand_units": scenario.daily_demand_units,
        "dailyDemandUnits": scenario.daily_demand_units,
        "shortage_penalty_per_unit": float(scenario.shortage_penalty_per_unit),
        "shortagePenaltyPerUnit": float(scenario.shortage_penalty_per_unit),
        "status": scenario.status,
        "created_at": scenario.created_at.isoformat() if scenario.created_at else None,
        "createdAt": scenario.created_at.isoformat() if scenario.created_at else None,
    }

@router.patch("/{id}")
async def update_scenario(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    scenario = db.query(Scenario).filter(Scenario.id == id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    body = await request.json()
    if "name" in body:
        scenario.name = body["name"]
    if "description" in body:
        scenario.description = body["description"]
    if "disruptionDurationDays" in body or "disruption_duration_days" in body:
        scenario.disruption_duration_days = int(body.get("disruptionDurationDays") or body.get("disruption_duration_days"))
    if "dailyDemandUnits" in body or "daily_demand_units" in body:
        scenario.daily_demand_units = int(body.get("dailyDemandUnits") or body.get("daily_demand_units"))

    scenario.updated_at = datetime.now(timezone.utc)
    db.commit()
    return scenario

@router.post("/{id}/validate")
def validate_scenario(id: str, db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    supplier = db.query(Supplier).filter(Supplier.id == scenario.critical_supplier_id).first()
    lanes = db.query(TransportLane).filter(TransportLane.origin_id == scenario.critical_supplier_id).all()

    validations = [
        {
            "check": f"Target Critical Supplier Exists: {scenario.critical_supplier_id}",
            "passed": supplier is not None,
            "details": f"Found supplier: {supplier.name if supplier else 'NOT FOUND'}"
        },
        {
            "check": f"{scenario.disruption_duration_days}-Day Disruption Window Feasibility",
            "passed": scenario.disruption_duration_days > 0 and scenario.disruption_duration_days <= scenario.evaluation_horizon_days,
            "details": f"Disruption duration is {scenario.disruption_duration_days} days within {scenario.evaluation_horizon_days} day horizon"
        },
        {
            "check": "Supply Network Connectivity",
            "passed": len(lanes) > 0,
            "details": f"Found {len(lanes)} active transport lanes from {scenario.critical_supplier_id}"
        }
    ]

    all_passed = all(v["passed"] for v in validations)
    return {
        "valid": all_passed,
        "scenarioId": scenario.id,
        "validations": validations,
    }

@router.post("/{id}/impact-analysis")
def calculate_impact_analysis(id: str, db: Session = Depends(get_db)):
    service = ImpactService(db)
    try:
        return service.calculate_impact(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{id}/runs", status_code=status.HTTP_201_CREATED)
async def trigger_scenario_runs(
    id: str,
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    scenario = db.query(Scenario).filter(Scenario.id == id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    body = await request.json().catch(lambda: {}) if hasattr(request.json, "catch") else await request.json()
    sim_service = SimulationService(db)

    try:
        results = sim_service.run_all_strategies(
            scenario_id=id,
            initiating_user=user.email,
        )

        run_ids = [r["runId"] for r in results]
        multi_result = next((r for r in results if r["strategy"] == "MULTI_AGENT_OPTIMIZATION"), results[0])

        return {
            "status": "COMPLETED",
            "scenarioId": id,
            "scenario_id": id,
            "runIds": run_ids,
            "run_ids": run_ids,
            "runId": multi_result["runId"],
            "solverStatus": multi_result["solverStatus"],
            "solver_status": multi_result["solverStatus"],
            "result": multi_result,
            "strategies_executed": len(results),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation run failed: {str(e)}")
