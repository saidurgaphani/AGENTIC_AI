from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.schema import (
    Scenario,
    PlanningRun,
    AgentProposal,
    RecoveryPlan,
    PlannerDecision,
    AuditEvent,
)

class ScenarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_scenarios(self) -> List[Scenario]:
        return self.db.query(Scenario).order_by(Scenario.created_at.desc()).all()

    def get_scenario_by_id(self, scenario_id: str) -> Optional[Scenario]:
        return self.db.query(Scenario).filter(Scenario.id == scenario_id).first()

    def create_scenario(self, scenario: Scenario) -> Scenario:
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        return scenario

class ExecutionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_runs_by_scenario(self, scenario_id: str) -> List[PlanningRun]:
        return (
            self.db.query(PlanningRun)
            .filter(PlanningRun.scenario_id == scenario_id)
            .order_by(PlanningRun.created_at.desc())
            .all()
        )

    def get_run_by_id(self, run_id: str) -> Optional[PlanningRun]:
        return self.db.query(PlanningRun).filter(PlanningRun.id == run_id).first()

    def save_run(self, run: PlanningRun) -> PlanningRun:
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def save_proposals(self, proposals: List[AgentProposal]):
        self.db.add_all(proposals)
        self.db.commit()

    def save_recovery_plan(self, plan: RecoveryPlan) -> RecoveryPlan:
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def get_plan_by_id(self, plan_id: str) -> Optional[RecoveryPlan]:
        return self.db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()

    def save_planner_decision(self, decision: PlannerDecision) -> PlannerDecision:
        self.db.add(decision)
        self.db.commit()
        self.db.refresh(decision)
        return decision

    def log_audit_event(self, event: AuditEvent) -> AuditEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_audit_events(self, limit: int = 50) -> List[AuditEvent]:
        return self.db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
