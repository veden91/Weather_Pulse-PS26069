from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.source import Source
from app.schemas.source import SourceResponse, SourceHealthSummary

router = APIRouter()

@router.get("", response_model=List[SourceResponse])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    return sources

@router.get("/health", response_model=SourceHealthSummary)
def get_sources_health(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    total = len(sources)
    connected = sum(1 for s in sources if s.is_active)
    total_records = sum(s.records_ingested for s in sources)
    avg_lat = sum(s.latency_ms for s in sources) / total if total > 0 else 42.0

    return SourceHealthSummary(
        total_sources=total,
        connected_sources=connected,
        total_records_ingested=total_records,
        average_latency_ms=round(avg_lat, 1),
        overall_health="HEALTHY" if connected == total else "DEGRADED",
        sources=[SourceResponse.model_validate(s) for s in sources]
    )
