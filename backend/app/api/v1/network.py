import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schema import (
    Supplier,
    Product,
    ProductionResource,
    DistributionCenter,
    TransportLane,
    InventoryRecord,
    DemandRecord,
    Scenario,
    AuditEvent,
)
from backend.app.auth import get_current_user, require_role, AuthenticatedUser

router = APIRouter(prefix="/network", tags=["Network"])

@router.get("/summary")
def get_network_summary(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    products = db.query(Product).all()
    plants = db.query(ProductionResource).all()
    dcs = db.query(DistributionCenter).all()
    lanes = db.query(TransportLane).all()
    inventory = db.query(InventoryRecord).all()
    demand = db.query(DemandRecord).all()

    crit = next((s.code for s in suppliers if s.criticality == "CRITICAL"), "SUP-01")
    disrupted_cnt = sum(1 for s in suppliers if s.disrupted)

    summary = {
        "productsCount": len(products),
        "suppliersCount": len(suppliers),
        "facilitiesCount": len(plants),
        "distributionCentersCount": len(dcs),
        "transportLanesCount": len(lanes),
        "inventoryRecordsCount": len(inventory),
        "demandRecordsCount": len(demand),
        "criticalSupplier": crit,
        "disruptedSupplierCount": disrupted_cnt,
    }

    network_counts = {
        "totalProducts": len(products),
        "totalSuppliers": len(suppliers),
        "disruptedSuppliers": disrupted_cnt,
        "totalPlants": len(plants),
        "totalDCs": len(dcs),
        "totalLanes": len(lanes),
    }

    return {
        "total_suppliers": len(suppliers),
        "total_products": len(products),
        "total_plants": len(plants),
        "total_dcs": len(dcs),
        "total_lanes": len(lanes),
        "critical_supplier": crit,
        "disrupted_supplier_count": disrupted_cnt,
        "summary": summary,
        "networkCounts": network_counts,
        "environment": {
            "database": "Neon PostgreSQL (Production Cloud)",
            "status": "ONLINE",
        },
        "suppliers": [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "location": s.location,
                "criticality": s.criticality,
                "active": s.active,
                "disrupted": s.disrupted,
            }
            for s in suppliers
        ],
        "products": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "type": p.type,
                "standardCost": float(p.standard_cost),
                "active": p.active,
            }
            for p in products
        ],
        "facilities": [
            {
                "id": pl.id,
                "name": pl.name,
                "location": pl.location,
                "dailyCapacity": pl.daily_capacity,
                "producedSku": pl.produced_sku,
                "active": pl.active,
            }
            for pl in plants
        ],
        "plants": [
            {
                "id": pl.id,
                "name": pl.name,
                "location": pl.location,
                "daily_capacity": pl.daily_capacity,
                "produced_sku": pl.produced_sku,
                "daily_operating_cost": float(pl.daily_operating_cost),
                "active": pl.active,
            }
            for pl in plants
        ],
        "distributionCenters": [
            {
                "id": d.id,
                "code": d.code,
                "name": d.name,
                "location": d.location,
                "serviceTier": d.service_tier,
                "targetSlaPercent": float(d.target_sla_percent),
                "active": d.active,
            }
            for d in dcs
        ],
        "transportLanes": [
            {
                "id": l.id,
                "originId": l.origin_id,
                "destinationId": l.destination_id,
                "mode": l.mode,
                "transitDays": l.transit_days,
                "costPerUnit": float(l.cost_per_unit),
                "expeditedTransitDays": l.expedited_transit_days,
                "expeditedCostPerUnit": float(l.expedited_cost_per_unit) if l.expedited_cost_per_unit else None,
                "active": l.active,
            }
            for l in lanes
        ],
    }

@router.get("/suppliers")
def list_suppliers(db: Session = Depends(get_db)):
    suppliers = db.query(Supplier).all()
    return [
        {
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "location": s.location,
            "criticality": s.criticality,
            "active": s.active,
            "disrupted": s.disrupted,
        }
        for s in suppliers
    ]

@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
async def create_supplier(
    request: Request,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["admin", "planner"]))
):
    body = await request.json()
    now = datetime.now(timezone.utc)
    sup_id = body.get("id") or f"sup-{uuid.uuid4().hex[:8]}"

    supplier = Supplier(
        id=sup_id,
        code=body.get("code") or f"SUP-{uuid.uuid4().hex[:4].upper()}",
        name=body.get("name", "New Supplier"),
        location=body.get("location", "Osaka, Japan"),
        criticality=body.get("criticality", "SECONDARY"),
        active=True,
        disrupted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(supplier)

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        actor=user.email,
        role=user.role,
        event_type="ENTITY_CREATE",
        target_entity="suppliers",
        target_id=supplier.id,
        details=f"Created supplier {supplier.code} ({supplier.name})",
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(supplier)

    return {
        "status": "success",
        "supplier": {
            "id": supplier.id,
            "code": supplier.code,
            "name": supplier.name,
            "location": supplier.location,
            "criticality": supplier.criticality,
            "active": supplier.active,
            "disrupted": supplier.disrupted,
        }
    }

@router.delete("/suppliers/{id}")
def delete_supplier(
    id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["admin"]))
):
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    now = datetime.now(timezone.utc)
    supplier.active = False
    supplier.updated_at = now

    audit = AuditEvent(
        id=f"AUD-{int(now.timestamp())}-{uuid.uuid4().hex[:4]}",
        actor=user.email,
        role=user.role,
        event_type="ENTITY_DEACTIVATE",
        target_entity="suppliers",
        target_id=supplier.id,
        details=f"Safely deactivated supplier {supplier.code} ({supplier.name})",
        timestamp=now,
    )
    db.add(audit)
    db.commit()

    return {
        "status": "success",
        "message": f"Supplier {supplier.code} safely deactivated.",
        "supplier": {
            "id": supplier.id,
            "code": supplier.code,
            "active": supplier.active,
        }
    }

@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "type": p.type,
            "standardCost": float(p.standard_cost),
            "standard_cost": float(p.standard_cost),
            "active": p.active,
        }
        for p in products
    ]

@router.get("/facilities")
def list_facilities(db: Session = Depends(get_db)):
    plants = db.query(ProductionResource).all()
    return [
        {
            "id": pl.id,
            "name": pl.name,
            "location": pl.location,
            "dailyCapacity": pl.daily_capacity,
            "daily_capacity": pl.daily_capacity,
            "producedSku": pl.produced_sku,
            "produced_sku": pl.produced_sku,
            "dailyOperatingCost": float(pl.daily_operating_cost),
            "daily_operating_cost": float(pl.daily_operating_cost),
            "active": pl.active,
        }
        for pl in plants
    ]

@router.get("/plants")
def list_plants(db: Session = Depends(get_db)):
    return list_facilities(db)

@router.get("/distribution-centers")
def list_dcs(db: Session = Depends(get_db)):
    dcs = db.query(DistributionCenter).all()
    return [
        {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "location": d.location,
            "serviceTier": d.service_tier,
            "service_tier": d.service_tier,
            "targetSlaPercent": float(d.target_sla_percent),
            "target_sla_percent": float(d.target_sla_percent),
            "active": d.active,
        }
        for d in dcs
    ]

@router.get("/transport-lanes")
def list_lanes(db: Session = Depends(get_db)):
    lanes = db.query(TransportLane).all()
    return [
        {
            "id": l.id,
            "originId": l.origin_id,
            "origin_id": l.origin_id,
            "destinationId": l.destination_id,
            "destination_id": l.destination_id,
            "mode": l.mode,
            "transitDays": l.transit_days,
            "transit_days": l.transit_days,
            "costPerUnit": float(l.cost_per_unit),
            "cost_per_unit": float(l.cost_per_unit),
            "expeditedTransitDays": l.expedited_transit_days,
            "expedited_transit_days": l.expedited_transit_days,
            "expeditedCostPerUnit": float(l.expedited_cost_per_unit) if l.expedited_cost_per_unit else None,
            "expedited_cost_per_unit": float(l.expedited_cost_per_unit) if l.expedited_cost_per_unit else None,
            "active": l.active,
        }
        for l in lanes
    ]

@router.get("/inventory")
def list_inventory(db: Session = Depends(get_db)):
    inv = db.query(InventoryRecord).all()
    return [
        {
            "id": i.id,
            "itemSku": i.item_sku,
            "nodeId": i.node_id,
            "onHandUnits": i.on_hand_units,
            "reservedUnits": i.reserved_units,
            "safetyStockTarget": i.safety_stock_target,
            "snapshotDate": i.snapshot_date.isoformat() if i.snapshot_date else None,
        }
        for i in inv
    ]

@router.get("/demand")
def list_demand(db: Session = Depends(get_db)):
    demand = db.query(DemandRecord).all()
    return [
        {
            "id": d.id,
            "productSku": d.product_sku,
            "destinationId": d.destination_id,
            "periodDay": d.period_day,
            "quantity": d.quantity,
            "servicePriority": d.service_priority,
        }
        for d in demand
    ]

@router.get("/dependencies/{entity_type}/{entity_id}")
def get_entity_dependencies(entity_type: str, entity_id: str, db: Session = Depends(get_db)):
    warnings = []
    can_delete = True

    # Check scenarios referencing this supplier
    if entity_type.lower() == "supplier":
        scenarios = db.query(Scenario).filter(Scenario.critical_supplier_id == entity_id).all()
        if scenarios:
            can_delete = False
            warnings.append(
                f"Supplier {entity_id} is referenced as critical disrupted supplier in {len(scenarios)} scenario(s): {', '.join(s.name for s in scenarios)}"
            )

        lanes = db.query(TransportLane).filter(
            (TransportLane.origin_id == entity_id) | (TransportLane.destination_id == entity_id)
        ).all()
        if lanes:
            warnings.append(f"Supplier has {len(lanes)} active transport lane(s) in routing network.")

    return {
        "entityType": entity_type,
        "entityId": entity_id,
        "canDeleteSafely": can_delete,
        "warnings": warnings,
        "references": {
            "scenariosCount": len(scenarios) if entity_type.lower() == "supplier" else 0,
            "lanesCount": len(lanes) if entity_type.lower() == "supplier" else 0,
        }
    }
