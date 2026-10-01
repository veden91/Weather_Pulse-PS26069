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

import asyncio
from fastapi import HTTPException
from app.api.v1.endpoints.auth import require_roles
from app.ingestion.sources import SOURCES_REGISTRY
from app.processing.pipeline import process_raw_report
from app.websocket.manager import manager

@router.post("/sync")
async def sync_live_sources(
    db: Session = Depends(get_db),
    current_user = Depends(require_roles(["ADMIN"]))
):
    # Collect data from all sources concurrently
    tasks = []
    source_names = []
    
    for key, collector in SOURCES_REGISTRY.items():
        tasks.append(collector.collect_async())
        source_names.append(collector.get_source_id())
        
    results_list = await asyncio.gather(*tasks, return_exceptions=True)
    
    total_records = 0
    critical_alerts = 0
    
    for raw_reports in results_list:
        if isinstance(raw_reports, Exception):
            continue
            
        for raw_report in raw_reports:
            # Process report
            result = process_raw_report(db, raw_report)
            
            # Broadcast to UI
            await manager.broadcast("NEW_REPORT", result)
            
            if result.get("event") and result["event"]["severity"] == "CRITICAL":
                await manager.broadcast("CRITICAL_ALERT", result["event"])
                critical_alerts += 1
                
            total_records += 1
            
    return {
        "status": "SYNC_COMPLETE",
        "sources_polled": source_names,
        "records_ingested": total_records,
        "critical_alerts": critical_alerts
    }
