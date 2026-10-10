import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from backend.app.database import Base

JSONType = JSONB().with_variant(JSON, "sqlite")

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    version = Column(String(32), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    seed = Column(String(64), nullable=False)
    currency = Column(String(16), default="INR", nullable=False)
    manifest = Column(JSONType, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)

class ProductionResource(Base):
    __tablename__ = "production_resources"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    produced_sku = Column(String(64), nullable=False)
    daily_capacity = Column(Integer, nullable=False)
    daily_operating_cost = Column(Numeric(12, 2), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class DistributionCenter(Base):
    __tablename__ = "distribution_centers"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    service_tier = Column(String(32), nullable=False)
    target_sla_percent = Column(Numeric(5, 2), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    criticality = Column(String(32), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    disrupted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    products = relationship("SupplierProduct", back_populates="supplier")

class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String(64), ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False)
    eligible = Column(Boolean, default=True, nullable=False)
    normal_lead_time_days = Column(Integer, nullable=False)
    expedite_lead_time_days = Column(Integer, nullable=False)
    daily_capacity = Column(Integer, nullable=False)
    unit_purchase_cost = Column(Numeric(12, 2), nullable=False)
    expedite_unit_cost = Column(Numeric(12, 2), nullable=False)

    supplier = relationship("Supplier", back_populates="products")
    product = relationship("Product")

class Product(Base):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True)
    sku = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False)
    uom = Column(String(32), default="units", nullable=False)
    standard_cost = Column(Numeric(12, 2), nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class BillOfMaterial(Base):
    __tablename__ = "bill_of_materials"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_sku = Column(String(64), nullable=False)
    component_sku = Column(String(64), nullable=False)
    quantity_required = Column(Integer, default=1, nullable=False)

class TransportLane(Base):
    __tablename__ = "transport_lanes"

    id = Column(String(64), primary_key=True)
    origin_id = Column(String(64), nullable=False)
    destination_id = Column(String(64), nullable=False)
    mode = Column(String(64), nullable=False)
    transit_days = Column(Integer, nullable=False)
    cost_per_unit = Column(Numeric(12, 2), nullable=False)
    expedited_transit_days = Column(Integer, nullable=True)
    expedited_cost_per_unit = Column(Numeric(12, 2), nullable=True)
    active = Column(Boolean, default=True, nullable=False)

class InventoryRecord(Base):
    __tablename__ = "inventory_records"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_sku = Column(String(64), nullable=False)
    node_id = Column(String(64), nullable=False)
    on_hand_units = Column(Integer, nullable=False)
    reserved_units = Column(Integer, default=0, nullable=False)
    safety_stock_target = Column(Integer, nullable=False)
    snapshot_date = Column(Date, default=date.today, nullable=False)

class DemandRecord(Base):
    __tablename__ = "demand_records"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_sku = Column(String(64), nullable=False)
    destination_id = Column(String(64), nullable=False)
    period_day = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    service_priority = Column(String(32), default="STANDARD", nullable=False)

class AgentConfiguration(Base):
    __tablename__ = "agent_configurations"

    agent_type = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    purpose = Column(Text, nullable=False)
    model = Column(String(64), default="gemini-2.5-flash", nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    temperature = Column(Numeric(3, 2), default=0.2, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    timeout_seconds = Column(Integer, default=30, nullable=False)
    parameters = Column(JSONType, nullable=True)
    health_status = Column(String(32), default="HEALTHY", nullable=False)
    last_execution_at = Column(DateTime, nullable=True)
    last_latency_ms = Column(Integer, nullable=True)
    failure_count = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    dataset_version = Column(String(32), nullable=False)
    random_seed = Column(String(64), nullable=False)
    critical_supplier_id = Column(String(64), nullable=False)
    disruption_start_day = Column(Integer, default=4, nullable=False)
    disruption_duration_days = Column(Integer, default=7, nullable=False)
    evaluation_horizon_days = Column(Integer, default=14, nullable=False)
    safety_stock_days = Column(Integer, default=3, nullable=False)
    daily_demand_units = Column(Integer, default=200, nullable=False)
    shortage_penalty_per_unit = Column(Numeric(12, 2), default=150.0, nullable=False)
    status = Column(String(32), default="READY", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ConstraintConfiguration(Base):
    __tablename__ = "constraint_configurations"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False)
    hard_constraint = Column(Boolean, default=True, nullable=False)
    value = Column(Numeric(12, 2), nullable=True)
    unit = Column(String(32), nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class PlanningRun(Base):
    __tablename__ = "planning_runs"

    id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=False)
    initiating_user = Column(String(255), default="lead_planner", nullable=False)
    strategy = Column(String(64), nullable=False)
    status = Column(String(32), default="COMPLETED", nullable=False)
    solver_status = Column(String(64), default="OPTIMAL", nullable=False)
    start_time = Column(DateTime, nullable=True)
    completion_time = Column(DateTime, nullable=True)
    runtime_ms = Column(Integer, default=0, nullable=False)
    hard_violations = Column(Integer, default=0, nullable=False)
    metrics = Column(JSONType, nullable=False) # Dictionary of calculated metrics & dayByDay
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    proposals = relationship("AgentProposal", back_populates="run", cascade="all, delete-orphan")
    plans = relationship("RecoveryPlan", back_populates="run", cascade="all, delete-orphan")

class AgentProposal(Base):
    __tablename__ = "agent_proposals"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("planning_runs.id"), nullable=False)
    agent_type = Column(String(64), nullable=False)
    action_summary = Column(Text, nullable=False)
    action_type = Column(String(64), nullable=False)
    affected_entity_ids = Column(JSONType, nullable=False)
    action_parameters = Column(JSONType, nullable=False)
    evidence_refs = Column(JSONType, nullable=False)
    expected_benefits = Column(Text, nullable=False)
    expected_cost_delta = Column(Numeric(12, 2), nullable=False)
    risks = Column(JSONType, nullable=False)
    assumptions = Column(JSONType, nullable=False)
    confidence_score = Column(Numeric(4, 2), nullable=False)
    validation_status = Column(String(32), default="VALIDATED", nullable=False)
    rejection_reasons = Column(JSONType, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("PlanningRun", back_populates="proposals")

class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    id = Column(String(64), primary_key=True)
    run_id = Column(String(64), ForeignKey("planning_runs.id"), nullable=False)
    status = Column(String(32), default="PENDING_APPROVAL", nullable=False)
    objective_value = Column(Numeric(14, 2), nullable=False)
    fill_rate_percent = Column(Numeric(5, 2), nullable=False)
    total_cost = Column(Numeric(14, 2), nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run = relationship("PlanningRun", back_populates="plans")
    decisions = relationship("PlannerDecision", back_populates="plan")

class PlannerDecision(Base):
    __tablename__ = "planner_decisions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String(64), ForeignKey("recovery_plans.id"), nullable=False)
    run_id = Column(String(64), nullable=False)
    user_id = Column(String(255), default="lead_planner", nullable=False)
    decision = Column(String(64), nullable=False)
    rationale = Column(Text, nullable=False)
    authorized_budget_delta = Column(Numeric(12, 2), default=0.0, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    plan = relationship("RecoveryPlan", back_populates="decisions")

class AppUser(Base):
    __tablename__ = "app_users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(String(32), default="planner", nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active_at = Column(DateTime, nullable=True)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(255), nullable=False)
    role = Column(String(32), default="planner", nullable=False)
    event_type = Column(String(64), nullable=False)
    target_entity = Column(String(64), nullable=False)
    target_id = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    before_state = Column(JSONType, nullable=True)
    after_state = Column(JSONType, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
