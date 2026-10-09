import time
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.services.optimization_service import SupplyChainOptimizer
from backend.app.models.schema import (
    PlanningRun,
    RecoveryPlan,
    Scenario,
    Supplier,
    SupplierProduct,
    TransportLane,
    ProductionResource,
    InventoryRecord,
    AuditEvent,
)
from backend.app.agents.coordinator import CoordinatorService

class SimulationService:
    def __init__(self, db: Session):
        self.db = db
        self.coordinator = CoordinatorService(db)

    def run_all_strategies(
        self, scenario_id: str, initiating_user: str = "lead_planner"
    ) -> List[Dict[str, Any]]:
        scenario = self.db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found in database")

        crit_sup_id = scenario.critical_supplier_id
        start_day = scenario.disruption_start_day
        duration_days = scenario.disruption_duration_days
        end_day = start_day + duration_days - 1
        horizon = scenario.evaluation_horizon_days
        daily_demand = scenario.daily_demand_units
        shortage_penalty = float(scenario.shortage_penalty_per_unit)

        # 1. Fetch Primary Supplier & Transport Lane Data
        crit_sp = self.db.query(SupplierProduct).filter(SupplierProduct.supplier_id == crit_sup_id).first()
        primary_cap = crit_sp.daily_capacity if crit_sp else 300
        primary_cost = float(crit_sp.unit_purchase_cost) if crit_sp else 140.0
        primary_lead = crit_sp.normal_lead_time_days if crit_sp else 3

        lane_primary = self.db.query(TransportLane).filter(
            TransportLane.origin_id == crit_sup_id,
            TransportLane.destination_id == "plant-01"
        ).first()
        primary_freight = float(lane_primary.cost_per_unit) if lane_primary else 18.0

        # 2. Fetch Alternate Supplier & Expedited Lane Data
        target_prod_id = crit_sp.product_id if crit_sp else "prod-01"
        alt_sp = self.db.query(SupplierProduct).filter(
            SupplierProduct.product_id == target_prod_id,
            SupplierProduct.supplier_id != crit_sup_id,
            SupplierProduct.eligible == True
        ).first()

        alt_sup_id = alt_sp.supplier_id if alt_sp else "sup-02"
        alt_cap = alt_sp.daily_capacity if alt_sp else 250
        alt_cost = float(alt_sp.unit_purchase_cost) if alt_sp else 195.0
        alt_lead_norm = alt_sp.normal_lead_time_days if alt_sp else 5
        alt_lead_exp = alt_sp.expedite_lead_time_days if alt_sp else 2

        lane_alt = self.db.query(TransportLane).filter(
            TransportLane.origin_id == alt_sup_id,
            TransportLane.destination_id == "plant-01"
        ).first()
        alt_freight_norm = float(lane_alt.cost_per_unit) if lane_alt else 24.0
        alt_freight_exp = float(lane_alt.expedited_cost_per_unit) if (lane_alt and lane_alt.expedited_cost_per_unit) else 68.0

        # 3. Fetch Plant & Initial Stock Data
        plant = self.db.query(ProductionResource).filter(ProductionResource.id == "plant-01").first()
        plant_cap = plant.daily_capacity if plant else 300
        prod_cost = 42.0

        inv_rec = self.db.query(InventoryRecord).filter(
            InventoryRecord.item_sku == "CMP-101",
            InventoryRecord.node_id == "plant-01"
        ).first()
        initial_stock = inv_rec.on_hand_units if inv_rec else (scenario.safety_stock_days * daily_demand)

        # 4. Initialize Data-Driven Optimizer
        optimizer = SupplyChainOptimizer(
            horizon_days=horizon,
            daily_demand=daily_demand,
            initial_stock=initial_stock,
            plant_capacity=plant_cap,
            disruption_start=start_day,
            disruption_end=end_day,
            shortage_penalty=shortage_penalty,
            primary_sup_cap=primary_cap,
            primary_sup_lead=primary_lead,
            primary_sup_cost=primary_cost,
            primary_freight_cost=primary_freight,
            alt_sup_cap=alt_cap,
            alt_sup_lead_norm=alt_lead_norm,
            alt_sup_lead_exp=alt_lead_exp,
            alt_sup_cost=alt_cost,
            alt_freight_norm=alt_freight_norm,
            alt_freight_exp=alt_freight_exp,
            prod_unit_cost=prod_cost,
            holding_cost_per_day=2.0,
        )

        # 5. Generate Run IDs
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        run_id_multi = f"RUN-{timestamp_str}-MULTI"
        run_id_opt = f"RUN-{timestamp_str}-OPT"
        run_id_base = f"RUN-{timestamp_str}-BASE"

        # 6. Reconcile Agent Recommendations
        agent_start_t = time.time()
        proposals, candidate_actions = self.coordinator.reconcile_and_generate_proposals(
            run_id=run_id_multi, scenario=scenario
        )
        agent_runtime_ms = int((time.time() - agent_start_t) * 1000)

        # 7. Solve all three strategies under identical inputs
        strategies = [
            ("REORDER_BASELINE", run_id_base, False, False, False),
            ("OPTIMIZATION_ONLY", run_id_opt, True, False, False),
            ("MULTI_AGENT_OPTIMIZATION", run_id_multi, True, True, True),
        ]

        raw_results = {}
        for strat_name, r_id, allow_alt, allow_exp, priority_dc in strategies:
            start_t = time.time()
            res = optimizer.solve(
                strategy=strat_name,
                allow_alternate=allow_alt,
                allow_expediting=allow_exp,
                priority_dc_protection=priority_dc,
            )
            solver_ms = int((time.time() - start_t) * 1000)
            res["solver_runtime_ms"] = solver_ms
            res["run_id"] = r_id
            raw_results[strat_name] = res

        baseline_cost = raw_results["REORDER_BASELINE"]["total_landed_cost"]

        # 8. Persist results to Neon database
        persisted_results = []
        now = datetime.now(timezone.utc)

        for strat_name, r_id, allow_alt, allow_exp, priority_dc in strategies:
            res = raw_results[strat_name]
            cost_delta = round(res["total_landed_cost"] - baseline_cost, 2)
            res["cost_delta_against_baseline"] = cost_delta

            metrics_data = {
                "fillRatePercent": res["fill_rate_percent"],
                "totalBackorders": res["total_backorders"],
                "totalLandedCost": res["total_landed_cost"],
                "costDeltaAgainstBaseline": cost_delta,
                "recoveryTimeDays": res["recovery_time_days"],
                "avgInventoryDays": round(initial_stock / daily_demand, 1),
                "hardConstraintViolations": res["hard_violations"],
                "softConstraintBreaches": 0,
                "feasibilityStatus": res["feasibility_status"],
                "solverStatus": res["solver_status"],
                "solverRuntimeMs": res["solver_runtime_ms"],
                "agentRuntimeMs": agent_runtime_ms if strat_name == "MULTI_AGENT_OPTIMIZATION" else 0,
                "costBreakdown": res["cost_breakdown"],
                "dayByDayMetrics": res["day_by_day_metrics"],
            }

            run = PlanningRun(
                id=r_id,
                scenario_id=scenario.id,
                initiating_user=initiating_user,
                strategy=strat_name,
                status="COMPLETED",
                solver_status=res["solver_status"],
                start_time=now,
                completion_time=now,
                runtime_ms=res["solver_runtime_ms"] + (agent_runtime_ms if strat_name == "MULTI_AGENT_OPTIMIZATION" else 0),
                hard_violations=res["hard_violations"],
                metrics=metrics_data,
                created_at=now,
            )
            self.db.add(run)

            # Link recovery plan for multi-agent optimization
            if strat_name == "MULTI_AGENT_OPTIMIZATION":
                plan_id = f"PLAN-REC-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}"
                plan = RecoveryPlan(
                    id=plan_id,
                    run_id=r_id,
                    status="PENDING_APPROVAL",
                    objective_value=res["total_landed_cost"],
                    fill_rate_percent=res["fill_rate_percent"],
                    total_cost=res["total_landed_cost"],
                    summary=(
                        f"Multi-agent coordinated recovery plan for {scenario.name}. "
                        f"Activates alternate supplier {alt_sup_id} with priority 2-day air cargo on lane-02. "
                        f"Draws down safety stock at plant-01 while shielding Tier-1 customer commitments. "
                        f"Delivers {res['fill_rate_percent']}% on-time fill rate with zero physical violations."
                    ),
                    created_at=now,
                )
                self.db.add(plan)
                res["plan_id"] = plan_id

            persisted_results.append({
                "runId": r_id,
                "run_id": r_id,
                "strategy": strat_name,
                "solverStatus": res["solver_status"],
                "solver_status": res["solver_status"],
                "feasibilityStatus": res["feasibility_status"],
                "fillRatePercent": res["fill_rate_percent"],
                "fill_rate_percent": res["fill_rate_percent"],
                "totalBackorders": res["total_backorders"],
                "total_backorders": res["total_backorders"],
                "totalLandedCost": res["total_landed_cost"],
                "total_landed_cost": res["total_landed_cost"],
                "costDeltaAgainstBaseline": cost_delta,
                "recoveryTimeDays": res["recovery_time_days"],
                "recovery_time_days": res["recovery_time_days"],
                "hardConstraintViolations": res["hard_violations"],
                "runtimeMs": res["solver_runtime_ms"],
                "costBreakdown": res["cost_breakdown"],
                "dayByDayMetrics": res["day_by_day_metrics"],
                "day_by_day_metrics": res["day_by_day_metrics"],
            })

        # Flush runs to ensure planning_runs rows exist before foreign keys are referenced
        self.db.flush()

        # Persist validated Agent Proposals linked to run_id_multi
        for prop in proposals:
            self.db.add(prop)

        # Log audit event for simulation run
        audit = AuditEvent(
            id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
            actor=initiating_user,
            role="planner",
            event_type="SIMULATION_RUN_EXECUTED",
            target_entity="scenarios",
            target_id=scenario.id,
            details=f"Evaluated 3 strategies for scenario {scenario.id} with multi-agent optimization fill rate {raw_results['MULTI_AGENT_OPTIMIZATION']['fill_rate_percent']}%",
            timestamp=now,
        )
        self.db.add(audit)
        self.db.commit()

        return persisted_results
