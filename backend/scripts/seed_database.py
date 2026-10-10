import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.database import engine, Base
from backend.app.models.schema import *
import uuid
from sqlalchemy.orm import Session

print("Dropping and recreating tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_db():
    db = Session(engine)
    try:
        # Create dataset version
        dv = DatasetVersion(
            id="SEED_2026_SCM_V1",
            version="1.0.0-canonical",
            name="Canonical SCM Seed 2026",
            seed="SEED_2026_SCM_V1",
            status="CANONICAL"
        )
        db.add(dv)
        
        # Scenario
        scen = Scenario(
            id="SCN-2026-SHUTDOWN-07D",
            name="Supplier 01 Disruption",
            description="A 7-day shutdown affecting Supplier 01.",
            dataset_version="1.0.0-canonical",
            random_seed="SEED_2026_SCM_V1",
            critical_supplier_id="SUP-01",
            disruption_start_day=4,
            disruption_duration_days=7
        )
        db.add(scen)
        
        # Suppliers
        sup_01 = Supplier(id="SUP-01", code="SUP-01", name="Supplier Alpha", location="Hyderabad, TS", criticality="CRITICAL")
        sup_02 = Supplier(id="SUP-02", code="SUP-02", name="Supplier Beta", location="Chennai, TN", criticality="ALTERNATE")
        sup_03 = Supplier(id="SUP-03", code="SUP-03", name="Supplier Gamma", location="Pune, MH", criticality="SECONDARY")
        db.add_all([sup_01, sup_02, sup_03])

        # Products
        prod_comp1 = Product(id="COMP-1", sku="COMP-1", name="Engine Block", type="COMPONENT", standard_cost=8400.0)
        prod_fg1 = Product(id="FG-1", sku="FG-1", name="Vehicle Model X", type="FINISHED_GOOD", standard_cost=420000.0)
        db.add_all([prod_comp1, prod_fg1])

        # Supplier Products
        sp_01 = SupplierProduct(id="SP-01-COMP1", supplier_id="SUP-01", product_id="COMP-1", normal_lead_time_days=2, expedite_lead_time_days=1, daily_capacity=150, unit_purchase_cost=8400.0, expedite_unit_cost=12600.0)
        sp_02 = SupplierProduct(id="SP-02-COMP1", supplier_id="SUP-02", product_id="COMP-1", normal_lead_time_days=5, expedite_lead_time_days=3, daily_capacity=100, unit_purchase_cost=10080.0, expedite_unit_cost=15120.0)
        sp_03 = SupplierProduct(id="SP-03-COMP1", supplier_id="SUP-03", product_id="COMP-1", normal_lead_time_days=7, expedite_lead_time_days=5, daily_capacity=50, unit_purchase_cost=7560.0, expedite_unit_cost=11760.0)
        db.add_all([sp_01, sp_02, sp_03])

        # Bill of Materials
        bom = BillOfMaterial(id="BOM-1", parent_sku="FG-1", component_sku="COMP-1", quantity_required=1)
        db.add(bom)

        # Plants (Production Resources)
        plant1 = ProductionResource(id="PLANT-1", name="Assembly Plant 1", location="Maharashtra", produced_sku="FG-1", daily_capacity=200, daily_operating_cost=420000.0)
        db.add(plant1)

        # DCs
        dc1 = DistributionCenter(id="DC-1", code="DC-1", name="East Coast Hub", location="MH", service_tier="TIER_1_CRITICAL", target_sla_percent=98.0)
        dc2 = DistributionCenter(id="DC-2", code="DC-2", name="West Coast Hub", location="KA", service_tier="TIER_1_CRITICAL", target_sla_percent=98.0)
        dc3 = DistributionCenter(id="DC-3", code="DC-3", name="South Hub", location="TS", service_tier="TIER_2_STANDARD", target_sla_percent=95.0)
        db.add_all([dc1, dc2, dc3])

        # Transport Lanes
        tl1 = TransportLane(id="TL-SUP01-PLANT1", origin_id="SUP-01", destination_id="PLANT-1", mode="TRUCK", transit_days=1, cost_per_unit=420.0, expedited_transit_days=0, expedited_cost_per_unit=1260.0)
        tl2 = TransportLane(id="TL-SUP02-PLANT1", origin_id="SUP-02", destination_id="PLANT-1", mode="RAIL", transit_days=4, cost_per_unit=252.0, expedited_transit_days=2, expedited_cost_per_unit=1008.0)
        tl3 = TransportLane(id="TL-PLANT1-DC1", origin_id="PLANT-1", destination_id="DC-1", mode="TRUCK", transit_days=2, cost_per_unit=840.0, expedited_transit_days=1, expedited_cost_per_unit=2100.0)
        tl4 = TransportLane(id="TL-PLANT1-DC2", origin_id="PLANT-1", destination_id="DC-2", mode="RAIL", transit_days=5, cost_per_unit=672.0, expedited_transit_days=3, expedited_cost_per_unit=1680.0)
        tl5 = TransportLane(id="TL-PLANT1-DC3", origin_id="PLANT-1", destination_id="DC-3", mode="TRUCK", transit_days=3, cost_per_unit=756.0, expedited_transit_days=2, expedited_cost_per_unit=1512.0)
        db.add_all([tl1, tl2, tl3, tl4, tl5])
        
        # Initial Inventory
        inv1 = InventoryRecord(id="INV-1", item_sku="COMP-1", node_id="SUP-01", on_hand_units=500, safety_stock_target=100)
        inv2 = InventoryRecord(id="INV-2", item_sku="COMP-1", node_id="PLANT-1", on_hand_units=200, safety_stock_target=150)
        inv3 = InventoryRecord(id="INV-3", item_sku="FG-1", node_id="PLANT-1", on_hand_units=50, safety_stock_target=20)
        inv4 = InventoryRecord(id="INV-4", item_sku="FG-1", node_id="DC-1", on_hand_units=100, safety_stock_target=50)
        inv5 = InventoryRecord(id="INV-5", item_sku="FG-1", node_id="DC-2", on_hand_units=150, safety_stock_target=50)
        inv6 = InventoryRecord(id="INV-6", item_sku="FG-1", node_id="DC-3", on_hand_units=80, safety_stock_target=30)
        db.add_all([inv1, inv2, inv3, inv4, inv5, inv6])

        # Demand
        demands = []
        for i in range(1, 15):
            demands.append(DemandRecord(id=f"DEM-DC1-{i}", product_sku="FG-1", destination_id="DC-1", period_day=i, quantity=50))
            demands.append(DemandRecord(id=f"DEM-DC2-{i}", product_sku="FG-1", destination_id="DC-2", period_day=i, quantity=70))
            demands.append(DemandRecord(id=f"DEM-DC3-{i}", product_sku="FG-1", destination_id="DC-3", period_day=i, quantity=40))
        db.add_all(demands)

        db.commit()
        print("Database seeded successfully with explicit test identifiers!")
    except Exception as e:
        print("Error during seed:", e)
        db.rollback()
    finally:
        db.close()

seed_db()
