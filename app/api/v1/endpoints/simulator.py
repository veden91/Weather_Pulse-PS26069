import random
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.simulator import simulator
from app.ingestion.sources import IMDCollector, SocialMediaAdapter, CitizenPortalAdapter
from app.processing.pipeline import process_raw_report
from app.websocket.manager import manager

router = APIRouter()

@router.get("/status")
def get_status():
    return {
        "is_running": simulator.is_running,
        "interval_seconds": simulator.interval_seconds,
        "mode": "DEMO_SIMULATION"
    }

@router.post("/start")
def start_simulation(interval: float = 4.0):
    simulator.start(interval=interval)
    return {
        "status": "STARTED",
        "is_running": simulator.is_running,
        "interval_seconds": simulator.interval_seconds
    }

@router.post("/stop")
def stop_simulation():
    simulator.stop()
    return {
        "status": "STOPPED",
        "is_running": simulator.is_running
    }

@router.post("/pulse")
async def trigger_single_pulse(db: Session = Depends(get_db)):
    """
    Triggers an immediate single simulated report, passes it through the full
    9-stage pipeline, and broadcasts it over WebSockets.
    """
    collector = random.choice([IMDCollector(), SocialMediaAdapter(), CitizenPortalAdapter()])
    reports = collector.collect()
    if not reports:
        return {"status": "NO_REPORT"}
    
    raw = reports[0]
    result = process_raw_report(db, raw)
    
    await manager.broadcast("NEW_REPORT", result)
    if result.get("severity") == "CRITICAL":
        await manager.broadcast("CRITICAL_ALERT", {
            "title": f"CRITICAL {result.get('event_category')} alert in {result.get('city')}",
            "event_id": result.get("event_id"),
            "city": result.get("city"),
            "state": result.get("state")
        })

    return {
        "status": "PULSE_GENERATED",
        "report": result
    }
