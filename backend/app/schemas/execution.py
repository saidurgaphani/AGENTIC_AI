from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class AgentProposalSchema(BaseModel):
    id: str
    run_id: str
    agent_type: str
    action_type: str
    action_summary: str
    affected_entity_ids: List[str]
    action_parameters: Dict[str, Any]
    evidence_refs: List[str]
    expected_benefits: str
    expected_cost_delta: float
    risks: List[str]
    assumptions: List[str]
    confidence_score: float
    validation_status: str
    rejection_reasons: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RecoveryPlanSchema(BaseModel):
    id: str
    run_id: str
    status: str
    objective_value: float
    fill_rate_percent: float
    total_cost: float
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True

class PlanningRunSchema(BaseModel):
    id: str
    scenario_id: str
    initiating_user: str
    strategy: str
    status: str
    solver_status: str
    runtime_ms: int
    hard_violations: int
    metrics: Dict[str, Any]
    created_at: datetime
    proposals: Optional[List[AgentProposalSchema]] = []
    plans: Optional[List[RecoveryPlanSchema]] = []

    class Config:
        from_attributes = True

class RunCreateRequest(BaseModel):
    strategies: Optional[List[str]] = [
        "REORDER_BASELINE",
        "OPTIMIZATION_ONLY",
        "MULTI_AGENT_OPTIMIZATION",
    ]
    user_id: Optional[str] = "lead_planner"

class PlanDecisionRequest(BaseModel):
    rationale: str
    authorized_budget_delta: Optional[float] = 0.0
    user_id: Optional[str] = "lead_planner"

class AuditEventSchema(BaseModel):
    id: str
    actor: str
    role: str
    event_type: str
    target_entity: str
    target_id: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
