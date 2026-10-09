from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductSchema(BaseModel):
    id: str
    sku: str
    name: str
    type: str
    uom: str
    standard_cost: float
    active: bool = True

    class Config:
        from_attributes = True

class SupplierSchema(BaseModel):
    id: str
    code: str
    name: str
    location: str
    criticality: str
    active: bool = True
    disrupted: bool = False

    class Config:
        from_attributes = True

class SupplierProductSchema(BaseModel):
    id: str
    supplier_id: str
    product_id: str
    eligible: bool
    normal_lead_time_days: int
    expedite_lead_time_days: int
    daily_capacity: int
    unit_purchase_cost: float
    expedite_unit_cost: float

    class Config:
        from_attributes = True

class ProductionResourceSchema(BaseModel):
    id: str
    name: str
    location: str
    produced_sku: str
    daily_capacity: int
    daily_operating_cost: float
    active: bool = True

    class Config:
        from_attributes = True

class DistributionCenterSchema(BaseModel):
    id: str
    code: str
    name: str
    location: str
    service_tier: str
    target_sla_percent: float
    active: bool = True

    class Config:
        from_attributes = True

class TransportLaneSchema(BaseModel):
    id: str
    origin_id: str
    destination_id: str
    mode: str
    transit_days: int
    cost_per_unit: float
    expedited_transit_days: Optional[int] = None
    expedited_cost_per_unit: Optional[float] = None
    active: bool = True

    class Config:
        from_attributes = True

class NetworkSummarySchema(BaseModel):
    total_suppliers: int
    total_products: int
    total_plants: int
    total_dcs: int
    total_lanes: int
    critical_supplier: str
    disrupted_supplier_count: int
