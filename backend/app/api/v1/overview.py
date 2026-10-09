from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.overview_service import OverviewService

router = APIRouter(prefix="/overview", tags=["Overview"])

@router.get("/metrics")
def get_overview_metrics(db: Session = Depends(get_db)):
    service = OverviewService(db)
    return service.get_overview_metrics()
