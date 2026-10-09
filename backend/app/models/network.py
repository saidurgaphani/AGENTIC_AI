import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "app_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clerk_id = Column(String(100), unique=True, nullable=True)
    email = Column(String(150), unique=True, nullable=False)
    name = Column(String(100), nullable=True)
    role = Column(String(50), default="planner", nullable=False) # 'planner', 'admin', 'viewer'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False) # 'COMPONENT', 'FINISHED_GOOD'
    uom = Column(String(20), default="units", nullable=False)
    standard_cost = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    criticality = Column(String(50), nullable=False) # 'CRITICAL', 'SECONDARY', 'ALTERNATE'
    is_active = Column(Boolean, default=True, nullable=False)

    products = relationship("SupplierProduct", back_populates="supplier")

class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    is_eligible = Column(Boolean, default=True, nullable=False)
    normal_lead_time_days = Column(Integer, nullable=False)
    expedite_lead_time_days = Column(Integer, nullable=False)
    daily_capacity = Column(Integer, nullable=False)
    unit_purchase_cost = Column(Float, nullable=False)
    expedite_unit_cost = Column(Float, nullable=False)

    supplier = relationship("Supplier", back_populates="products")
    product = relationship("Product")

class Plant(Base):
    __tablename__ = "plants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    produced_sku = Column(String(50), nullable=False)
    daily_capacity = Column(Integer, nullable=False)
    daily_operating_cost = Column(Float, nullable=False)

class BillOfMaterial(Base):
    __tablename__ = "bill_of_materials"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_sku = Column(String(50), nullable=False)
    component_sku = Column(String(50), nullable=False)
    quantity_required = Column(Integer, default=1, nullable=False)

class DistributionCenter(Base):
    __tablename__ = "distribution_centers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    location = Column(String(200), nullable=False)
    service_tier = Column(String(50), nullable=False) # 'TIER_1_CRITICAL', 'TIER_2_STANDARD'
    target_sla_percent = Column(Float, nullable=False)

class TransportLane(Base):
    __tablename__ = "transport_lanes"

    id = Column(String(50), primary_key=True)
    origin_id = Column(String(50), nullable=False)
    destination_id = Column(String(50), nullable=False)
    mode = Column(String(50), nullable=False)
    transit_days = Column(Integer, nullable=False)
    cost_per_unit = Column(Float, nullable=False)
    expedited_transit_days = Column(Integer, nullable=True)
    expedited_cost_per_unit = Column(Float, nullable=True)

class InventoryBalance(Base):
    __tablename__ = "inventory_balances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String(50), nullable=False)
    node_id = Column(String(50), nullable=False)
    period = Column(Integer, default=0, nullable=False)
    on_hand_quantity = Column(Integer, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)

class DemandRecord(Base):
    __tablename__ = "demand_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(50), nullable=False)
    fulfillment_node_id = Column(String(50), nullable=False)
    period = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    service_class = Column(String(50), default="STANDARD", nullable=False)
