import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.services.optimization_service import SupplyChainOptimizer
from backend.app.models.schema import PlanningRun, RecoveryPlan, Scenario
from backend.app.agents.coordinator import CoordinatorService

class SimulationService:
    def __init__(self, db: Session):
        self.db = db
        self.coordinator = CoordinatorService(db)

    def run_all_strategies(self, scenario_id: str, initiating_user: str = "lead_planner") -> List[Dict[str, Any]]:
        scenario = self.db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        optimizer = SupplyChainOptimizer(
            horizon_days=scenario.evaluation_horizon_days,
            daily_demand=scenario.daily_demand_units,
            initial_stock=scenario.safety_stock_days * scenario.daily_demand_units,
            plant_capacity=300,
            disruption_start=scenario.disruption_start_day,
            disruption_end=scenario.disruption_start_day + scenario.disruption_duration_days - 1,
            shortage_penalty=float(scenario.shortage_penalty_per_unit),
        )

        results = []
        strategies = ["REORDER_BASELINE", "OPTIMIZATION_ONLY", "MULTI_AGENT_OPTIMIZATION"]

        for strategy in strategies:
            start_t = time.time()
            
            # Execute OR-Tools solver
            allow_alt = strategy != "REORDER_BASELINE"
            allow_exp = strategy == "MULTI_AGENT_OPTIMIZATION"
            
            res = optimizer.solve(
                strategy=strategy,
                allow_alternate=allow_alt,
                allow_expediting=allow_exp,
            )
            runtime_ms = int((time.time() - start_t) * 1000)

            run_id = f"RUN-{strategy[:3]}-{int(time.time())}"
            
            # Create or update planning run record
            run = PlanningRun(
                id=run_id,
                scenario_id=scenario.id,
                initiating_user=initiating_user,
                strategy=strategy,
                status="COMPLETED",
                solver_status=res["solver_status"],
                runtime_ms=runtime_ms,
                hard_violations=res["hard_violations"],
                metrics={
                    "fill_rate_percent": res["fill_rate_percent"],
                    "total_backorders": res["total_backorders"],
                    "total_landed_cost": res["total_landed_cost"],
                    "recovery_time_days": res["recovery_time_days"],
                    "day_by_day_metrics": res["day_by_day_metrics"],
                },
            )
            self.db.add(run)
            self.db.commit()

            # If MULTI_AGENT_OPTIMIZATION, also generate and link agent proposals and recovery plan
            if strategy == "MULTI_AGENT_OPTIMIZATION":
                proposals = self.coordinator.generate_and_validate_proposals(run_id=run.id, scenario=scenario)
                plan = RecoveryPlan(
                    id=f"PLAN-{run_id[-6:]}",
                    run_id=run.id,
                    status="PENDING_APPROVAL",
                    objective_value=res["total_landed_cost"],
                    fill_rate_percent=res["fill_rate_percent"],
                    total_cost=res["total_landed_cost"],
                    summary="Multi-agent coordinated recovery activating SUP-02 with priority air freight and Tier-1 SLA shielding.",
                )
                self.db.add(plan)
                self.db.commit()

            results.append({
                "run_id": run.id,
                "strategy": strategy,
                "solver_status": res["solver_status"],
                "fill_rate_percent": res["fill_rate_percent"],
                "total_backorders": res["total_backorders"],
                "total_landed_cost": res["total_landed_cost"],
                "recovery_time_days": res["recovery_time_days"],
                "runtime_ms": runtime_ms,
                "day_by_day_metrics": res["day_by_day_metrics"],
            })

        return results
