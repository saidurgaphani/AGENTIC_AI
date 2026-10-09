from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.schema import (
    Product,
    Supplier,
    SupplierProduct,
    ProductionResource,
    DistributionCenter,
    TransportLane,
    InventoryRecord,
    DemandRecord,
)

class NetworkRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all_products(self) -> List[Product]:
        return self.db.query(Product).filter(Product.active == True).all()

    def get_all_suppliers(self) -> List[Supplier]:
        return self.db.query(Supplier).all()

    def get_supplier_by_id(self, supplier_id: str) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

    def get_supplier_products(self, supplier_id: Optional[str] = None) -> List[SupplierProduct]:
        query = self.db.query(SupplierProduct)
        if supplier_id:
            query = query.filter(SupplierProduct.supplier_id == supplier_id)
        return query.all()

    def get_all_plants(self) -> List[ProductionResource]:
        return self.db.query(ProductionResource).filter(ProductionResource.active == True).all()

    def get_all_distribution_centers(self) -> List[DistributionCenter]:
        return self.db.query(DistributionCenter).filter(DistributionCenter.active == True).all()

    def get_all_transport_lanes(self) -> List[TransportLane]:
        return self.db.query(TransportLane).filter(TransportLane.active == True).all()

    def get_inventory_records(self) -> List[InventoryRecord]:
        return self.db.query(InventoryRecord).all()

    def get_demand_records(self) -> List[DemandRecord]:
        return self.db.query(DemandRecord).order_by(DemandRecord.period_day.asc()).all()
