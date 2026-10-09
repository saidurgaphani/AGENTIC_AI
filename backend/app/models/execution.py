import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class PlanningRun(Base):
    __tablename__ = "planning_runs"

    id = Column(String(50), primary_key=True, default=lambda: f"RUN-{uuid.uuid4().hex[:8].upper()}")
    scenario_id = Column(String(50), ForeignKey("scenarios.id"), nullable=False)
    strategy = Column(String(50), nullable=False) # 'REORDER_BASELINE', 'OPTIMIZATION_ONLY', 'MULTI_AGENT_OPTIMIZATION'
    status = Column(String(50), default="COMPLETED", nullable=False) # 'RUNNING', 'COMPLETED', 'FAILED', 'INFEASIBLE'
    fill_rate_percent = Column(Float, nullable=False)
    total_backorders = Column(Integer, nullable=False)
    total_landed_cost = Column(Float, nullable=False)
    cost_delta = Column(Float, default=0.0, nullable=False)
    recovery_time_days = Column(String(50), nullable=False)
    avg_inventory_days = Column(Float, nullable=False)
    hard_violations = Column(Integer, default=0, nullable=False)
    soft_breaches = Column(Integer, default=0, nullable=False)
    solver_runtime_ms = Column(Integer, default=0, nullable=False)
    agent_runtime_ms = Column(Integer, default=0, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    period_results = relationship("PeriodResult", back_populates="run", cascade="all, delete-orphan")
    proposals = relationship("AgentProposal", back_populates="run", cascade="all, delete-orphan")
    plans = relationship("RecoveryPlan", back_populates="run", cascade="all, delete-orphan")

class PeriodResult(Base):
    __tablename__ = "period_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(50), ForeignKey("planning_runs.id"), nullable=False)
    period = Column(Integer, nullable=False)
    demand = Column(Integer, nullable=False)
    fulfilled = Column(Integer, nullable=False)
    backlog = Column(Integer, nullable=False)
    plant_raw_stock = Column(Integer, nullable=False)
    finished_stock = Column(Integer, default=0, nullable=False)
    inbound_units = Column(Integer, default=0, nullable=False)
    daily_cost = Column(Float, nullable=False)

    run = relationship("PlanningRun", back_populates="period_results")

class AgentProposal(Base):
    __tablename__ = "agent_proposals"

    id = Column(String(50), primary_key=True)
    run_id = Column(String(50), ForeignKey("planning_runs.id"), nullable=False)
    agent_type = Column(String(50), nullable=False) # 'DEMAND', 'INVENTORY', 'SUPPLIER_RISK', 'LOGISTICS'
    action_type = Column(String(50), nullable=False)
    action_summary = Column(Text, nullable=False)
    affected_entity_ids = Column(JSON, nullable=False) # List of IDs
    action_parameters = Column(JSON, nullable=False)
    evidence_refs = Column(JSON, nullable=False)
    expected_benefits = Column(Text, nullable=False)
    expected_cost_delta = Column(Float, nullable=False)
    risks = Column(JSON, nullable=False)
    assumptions = Column(JSON, nullable=False)
    confidence_score = Column(Float, nullable=False)
    confidence_def = Column(Text, nullable=False)
    validation_status = Column(String(50), default="VALIDATED", nullable=False)
    rejection_reasons = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("PlanningRun", back_populates="proposals")

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(String(50), primary_key=True, default=lambda: f"PLAN-{uuid.uuid4().hex[:8].upper()}")
    run_id = Column(String(50), ForeignKey("planning_runs.id"), nullable=False)
    status = Column(String(50), default="PENDING_APPROVAL", nullable=False) # 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
    total_landed_cost = Column(Float, nullable=False)
    objective_value = Column(Float, nullable=False)
    feasibility_status = Column(String(50), default="FEASIBLE", nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("PlanningRun", back_populates="plans")
    decisions = relationship("PlannerDecision", back_populates="plan")

class PlannerDecision(Base):
    __tablename__ = "planner_decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(50), ForeignKey("recovery_plans.id"), nullable=False)
    run_id = Column(String(50), nullable=False)
    planner_id = Column(String(100), default="lead_planner", nullable=False)
    decision = Column(String(50), nullable=False) # 'APPROVED', 'REJECTED', 'MODIFIED_AND_APPROVED'
    rationale = Column(Text, nullable=False)
    authorized_budget_delta = Column(Float, default=0.0, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    plan = relationship("RecoveryPlan", back_populates="decisions")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(100), nullable=False)
    event_type = Column(String(100), nullable=False)
    target_entity_id = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version = Column(String(50), unique=True, nullable=False)
    seed = Column(String(50), nullable=False)
    manifest_json = Column(JSON, nullable=False)
    is_canonical = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
