import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    dataset_version = Column(String(50), default="1.0.0-canonical", nullable=False)
    random_seed = Column(String(50), default="SEED_2026_SCM_V1", nullable=False)
    critical_supplier_id = Column(String(50), nullable=False)
    disruption_start_day = Column(Integer, default=4, nullable=False)
    disruption_duration_days = Column(Integer, default=7, nullable=False)
    evaluation_horizon_days = Column(Integer, default=14, nullable=False)
    safety_stock_days = Column(Integer, default=3, nullable=False)
    daily_demand_units = Column(Integer, default=200, nullable=False)
    shortage_penalty_per_unit = Column(Float, default=150.0, nullable=False)
    created_by = Column(String(100), default="lead_planner", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    disruptions = relationship("ScenarioDisruption", back_populates="scenario")

class ScenarioDisruption(Base):
    __tablename__ = "scenario_disruptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String(50), ForeignKey("scenarios.id"), nullable=False)
    supplier_id = Column(String(50), nullable=False)
    start_day = Column(Integer, nullable=False)
    duration_days = Column(Integer, nullable=False)
    disruption_type = Column(String(50), default="FULL_SHUTDOWN", nullable=False)
    inbound_policy = Column(String(50), default="SUSPEND_ALL", nullable=False)

    scenario = relationship("Scenario", back_populates="disruptions")
