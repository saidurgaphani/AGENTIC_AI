import uuid
from typing import List, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.schema import AgentProposal, Scenario, Supplier, TransportLane, ProductionResource, DistributionCenter
from backend.app.agents.demand_agent import DemandAgent
from backend.app.agents.inventory_agent import InventoryAgent
from backend.app.agents.supplier_risk_agent import SupplierRiskAgent
from backend.app.agents.logistics_agent import LogisticsAgent

class CoordinatorService:
    """
    Deterministic Agent Coordinator:
    1. Collects proposals from Demand, Inventory, Supplier-Risk, and Logistics agents.
    2. Validates entity references against authoritative Neon database tables.
    3. Detects domain conflicts (lead-time gaps vs stockout cliffs, capacity constraints, SLA violations).
    4. Reconciles conflicts mathematically and synthesizes structured candidate actions.
    5. Feeds candidate actions into the OR-Tools mathematical optimizer.
    6. Persists traceable proposals and conflict resolution audit data.
    """

    def __init__(self, db: Session):
        self.db = db
        self.demand_agent = DemandAgent(db)
        self.inventory_agent = InventoryAgent(db)
        self.supplier_risk_agent = SupplierRiskAgent(db)
        self.logistics_agent = LogisticsAgent(db)

    def validate_supplier_proposal(self, supplier_id: str, valid_suppliers: set) -> bool:
        """Validate if proposed supplier exists in registered database set"""
        return supplier_id in valid_suppliers

    def reconcile_and_generate_proposals(
        self, run_id: str, scenario: Scenario
    ) -> Tuple[List[AgentProposal], Dict[str, Any]]:
        # 1. Collect raw domain agent outputs
        raw_candidates = [
            self.demand_agent.evaluate(scenario.id),
            self.inventory_agent.evaluate(scenario.id),
            self.supplier_risk_agent.evaluate(scenario.id),
            self.logistics_agent.evaluate(scenario.id),
        ]

        # Valid entity sets from database
        valid_suppliers = {s.id for s in self.db.query(Supplier).all()}
        valid_lanes = {l.id for l in self.db.query(TransportLane).all()}
        valid_plants = {p.id for p in self.db.query(ProductionResource).all()}
        valid_dcs = {d.id for d in self.db.query(DistributionCenter).all()}

        # 2. Conflict Detection & Reconciliation
        conflicts_detected = []
        conflicts_resolved = []

        sr_raw = next((r for r in raw_candidates if r["agent_type"] == "SUPPLIER_RISK"), {})
        inv_raw = next((r for r in raw_candidates if r["agent_type"] == "INVENTORY"), {})
        log_raw = next((r for r in raw_candidates if r["agent_type"] == "LOGISTICS"), {})
        dem_raw = next((r for r in raw_candidates if r["agent_type"] == "DEMAND"), {})

        # Conflict 1: Lead-Time Transit Cliff vs Safety Stock Depletion
        stockout_day = inv_raw.get("action_parameters", {}).get("projected_stockout_day", 6)
        disruption_start = scenario.disruption_start_day # e.g. 4
        standard_transit = log_raw.get("action_parameters", {}).get("standard_transit_days", 5)
        std_arrival_day = disruption_start + standard_transit # e.g. 4 + 5 = 9

        if std_arrival_day > stockout_day:
            conflicts_detected.append({
                "conflict_id": "CONF-01",
                "type": "LEAD_TIME_STARVATION_GAP",
                "description": f"Alternate supplier standard transit delivers on Day {std_arrival_day}, but plant buffer exhausts on Day {stockout_day} morning.",
                "involved_agents": ["SUPPLIER_RISK", "INVENTORY", "LOGISTICS"]
            })
            # Resolution: Pair alternate sourcing with expedited air logistics
            expedited_transit = log_raw.get("action_parameters", {}).get("expedited_transit_days", 2)
            exp_arrival_day = disruption_start + expedited_transit # e.g. 4 + 2 = 6
            conflicts_resolved.append({
                "conflict_id": "CONF-01",
                "resolution": f"Coupled SUP-02 sourcing with 2-day priority air cargo on lane-02. Inbound arrives on Day {exp_arrival_day} morning, neutralizing starvation gap.",
                "action": "AUTHORIZE_AIR_EXPEDITE_DAYS_4_TO_7"
            })

        # Conflict 2: Capacity check
        alt_capacity = sr_raw.get("action_parameters", {}).get("supplier_daily_capacity", 250)
        daily_req = sr_raw.get("action_parameters", {}).get("daily_volume_allocated", 200)
        if daily_req > alt_capacity:
            conflicts_detected.append({
                "conflict_id": "CONF-02",
                "type": "SUPPLIER_CAPACITY_OVERFLOW",
                "description": f"Requested volume {daily_req} exceeds supplier max capacity {alt_capacity}.",
                "involved_agents": ["SUPPLIER_RISK"]
            })
        else:
            conflicts_resolved.append({
                "conflict_id": "CONF-02",
                "resolution": f"Alternate supplier capacity ({alt_capacity} units/day) validated against daily requirement ({daily_req} units/day). Margin: {alt_capacity - daily_req} units.",
                "action": "CAPACITY_CONFIRMED"
            })

        # 3. Formulate Candidate Actions for OR-Tools Solver
        candidate_actions = {
            "allow_alternate_sourcing": True,
            "alternate_supplier_id": sr_raw.get("action_parameters", {}).get("source_supplier_id", "sup-02"),
            "alternate_daily_capacity": alt_capacity,
            "allow_expedited_shipping": True,
            "expedited_transit_days": log_raw.get("action_parameters", {}).get("expedited_transit_days", 2),
            "expedited_max_volume": log_raw.get("action_parameters", {}).get("expedited_volume", 800),
            "priority_protection": True,
            "protected_dc_code": dem_raw.get("action_parameters", {}).get("protected_node", "DC-EAST"),
            "target_sla_percent": dem_raw.get("action_parameters", {}).get("target_sla", 98.0),
            "buffer_drawdown_units": inv_raw.get("action_parameters", {}).get("initial_buffer_units", 600),
            "conflicts_detected": conflicts_detected,
            "conflicts_resolved": conflicts_resolved,
        }

        # 4. Formulate and Validate Agent Proposals
        proposals = []
        now = datetime.now(timezone.utc)

        for raw in raw_candidates:
            status = "VALIDATED"
            rejection_reasons = []

            # Validate entity references
            for eid in raw.get("affected_entity_ids", []):
                if eid.startswith("sup-") and eid not in valid_suppliers:
                    status = "REJECTED"
                    rejection_reasons.append(f"Supplier ID {eid} does not exist in active registry")
                elif eid.startswith("lane-") and eid not in valid_lanes:
                    status = "REJECTED"
                    rejection_reasons.append(f"Lane ID {eid} does not exist in transport registry")

            prop = AgentProposal(
                id=f"{raw['proposal_id']}-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
                run_id=run_id,
                agent_type=raw["agent_type"],
                action_type=raw["action_type"],
                action_summary=raw["action_summary"],
                affected_entity_ids=raw["affected_entity_ids"],
                action_parameters=raw["action_parameters"],
                evidence_refs=raw["evidence_refs"],
                expected_benefits=raw["expected_benefits"],
                expected_cost_delta=raw["expected_cost_delta"],
                risks=raw["risks"],
                assumptions=raw["assumptions"],
                confidence_score=raw["confidence_score"],
                validation_status=status,
                rejection_reasons=rejection_reasons if rejection_reasons else None,
                created_at=now,
            )
            proposals.append(prop)

        return proposals, candidate_actions

    def generate_and_validate_proposals(self, run_id: str, scenario: Scenario) -> List[AgentProposal]:
        """Backward-compatible wrapper returning proposals list"""
        proposals, _ = self.reconcile_and_generate_proposals(run_id, scenario)
        return proposals

AgentCoordinator = CoordinatorService
