from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ScenarioSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    dataset_version: str
    random_seed: str
    critical_supplier_id: str
    disruption_start_day: int
    disruption_duration_days: int
    evaluation_horizon_days: int
    safety_stock_days: int
    daily_demand_units: int
    shortage_penalty_per_unit: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ScenarioCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    critical_supplier_id: str = "sup-01"
    disruption_start_day: int = 4
    disruption_duration_days: int = 7
    evaluation_horizon_days: int = 14
    safety_stock_days: int = 3
    daily_demand_units: int = 200
    shortage_penalty_per_unit: float = 150.0
