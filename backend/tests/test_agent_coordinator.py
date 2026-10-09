import pytest
from backend.app.agents.coordinator import AgentCoordinator
from backend.app.database import SessionLocal
from backend.app.repositories.network_repo import NetworkRepository
from backend.app.repositories.execution_repo import ScenarioRepository, ExecutionRepository
from backend.app.models.schema import PlanningRun
from datetime import datetime

def test_agent_coordinator_proposal_validation():
    db = SessionLocal()
    try:
        network_repo = NetworkRepository(db)
        scenario_repo = ScenarioRepository(db)
        execution_repo = ExecutionRepository(db)
        
        valid_suppliers = network_repo.get_all_suppliers()
        valid_supplier_ids = {s.id for s in valid_suppliers}
        
        scenarios = scenario_repo.get_all_scenarios()
        assert len(scenarios) > 0, "At least one scenario must exist in the database"
        scenario = scenarios[0]
        
        import uuid
        test_run_id = f"RUN-TEST-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow()
        test_run = PlanningRun(
            id=test_run_id,
            scenario_id=scenario.id,
            strategy="AGENT_OPTIMIZATION",
            status="COMPLETED",
            start_time=now,
            completion_time=now,
            runtime_ms=120,
            metrics={},
            created_at=now
        )
        execution_repo.save_run(test_run)
        run_id = test_run.id
        
        coordinator = AgentCoordinator(db)
        proposals = coordinator.generate_and_validate_proposals(run_id=run_id, scenario=scenario)
        
        assert len(proposals) >= 4, "Should generate proposals from Demand, Inventory, Supplier-Risk, Logistics agents"
        
        # Verify all proposals have validated status, confidence, and trace evidence
        for prop in proposals:
            assert prop.confidence_score is not None and 0.0 <= float(prop.confidence_score) <= 1.0
            assert prop.evidence_refs is not None
            assert prop.validation_status in ["VALIDATED", "REJECTED"]
            assert prop.action_summary is not None
            
        # Verify supplier validation helper prevents hallucinated IDs
        is_invalid = coordinator.validate_supplier_proposal(
            supplier_id="SUP-HALLUCINATED-99",
            valid_suppliers=valid_supplier_ids
        )
        assert is_invalid is False, "Hallucinated supplier ID must be rejected"
        
        is_valid = coordinator.validate_supplier_proposal(
            supplier_id=list(valid_supplier_ids)[0],
            valid_suppliers=valid_supplier_ids
        )
        assert is_valid is True, "Valid database supplier ID must be accepted"
        
    finally:
        db.close()
