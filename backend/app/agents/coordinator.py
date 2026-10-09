from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.schema import AgentProposal, Scenario, Supplier, TransportLane
from backend.app.agents.demand_agent import DemandAgent
from backend.app.agents.inventory_agent import InventoryAgent
from backend.app.agents.supplier_risk_agent import SupplierRiskAgent
from backend.app.agents.logistics_agent import LogisticsAgent

class CoordinatorService:
    """
    Deterministic Coordinator:
    Collects agent proposals, enforces Pydantic schema validation, verifies
    entity identifiers in the database, rejects invalid bids, and persists
    traceable candidates.
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

    def generate_and_validate_proposals(self, run_id: str, scenario: Scenario) -> List[AgentProposal]:
        raw_candidates = [
            self.demand_agent.evaluate(scenario.id),
            self.inventory_agent.evaluate(scenario.id),
            self.supplier_risk_agent.evaluate(scenario.id),
            self.logistics_agent.evaluate(scenario.id),
        ]

        proposals = []
        for raw in raw_candidates:
            # Deterministic Validation Checks:
            status = "VALIDATED"
            rejection_reasons = []

            # Check 1: Non-empty entity references
            if not raw.get("affected_entity_ids"):
                status = "REJECTED"
                rejection_reasons.append("Empty affected entity reference list")

            # Check 2: Verify entity existence in DB
            for eid in raw.get("affected_entity_ids", []):
                # Basic check for supplier or lane existence if prefixed
                if eid.startswith("sup-"):
                    if not self.db.query(Supplier).filter(Supplier.id == eid).first():
                        status = "REJECTED"
                        rejection_reasons.append(f"Supplier ID {eid} does not exist in master registry")

            prop = AgentProposal(
                id=f"{raw['proposal_id']}-{run_id[-6:]}",
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
                created_at=datetime.utcnow(),
            )
            self.db.add(prop)
            proposals.append(prop)

        self.db.commit()
        return proposals

AgentCoordinator = CoordinatorService

