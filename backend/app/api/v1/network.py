from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.repositories.network_repo import NetworkRepository
from backend.app.schemas.network import (
    SupplierSchema,
    ProductSchema,
    ProductionResourceSchema,
    DistributionCenterSchema,
    TransportLaneSchema,
    NetworkSummarySchema,
)

router = APIRouter(prefix="/network", tags=["Network"])

@router.get("/summary", response_model=NetworkSummarySchema)
def get_network_summary(db: Session = Depends(get_db)):
    repo = NetworkRepository(db)
    suppliers = repo.get_all_suppliers()
    products = repo.get_all_products()
    plants = repo.get_all_plants()
    dcs = repo.get_all_distribution_centers()
    lanes = repo.get_all_transport_lanes()

    crit = next((s.code for s in suppliers if s.criticality == "CRITICAL"), "SUP-01")
    disrupted_cnt = sum(1 for s in suppliers if s.disrupted)

    return {
        "total_suppliers": len(suppliers),
        "total_products": len(products),
        "total_plants": len(plants),
        "total_dcs": len(dcs),
        "total_lanes": len(lanes),
        "critical_supplier": crit,
        "disrupted_supplier_count": disrupted_cnt,
    }

@router.get("/suppliers", response_model=List[SupplierSchema])
def list_suppliers(db: Session = Depends(get_db)):
    return NetworkRepository(db).get_all_suppliers()

@router.get("/products", response_model=List[ProductSchema])
def list_products(db: Session = Depends(get_db)):
    return NetworkRepository(db).get_all_products()

@router.get("/plants", response_model=List[ProductionResourceSchema])
def list_plants(db: Session = Depends(get_db)):
    return NetworkRepository(db).get_all_plants()

@router.get("/distribution-centers", response_model=List[DistributionCenterSchema])
def list_distribution_centers(db: Session = Depends(get_db)):
    return NetworkRepository(db).get_all_distribution_centers()

@router.get("/transport-lanes", response_model=List[TransportLaneSchema])
def list_transport_lanes(db: Session = Depends(get_db)):
    return NetworkRepository(db).get_all_transport_lanes()
