from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, events, reports, verification, alerts, analytics,
    sources, ai, system, simulator, locations
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(events.router, prefix="/events", tags=["Weather Events"])
api_router.include_router(reports.router, prefix="/reports", tags=["Weather Reports"])
api_router.include_router(verification.router, prefix="/verification", tags=["AI Verification"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Emergency Alerts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Intelligence & Analytics"])
api_router.include_router(sources.router, prefix="/sources", tags=["Data Sources"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Services"])
api_router.include_router(system.router, prefix="/system", tags=["System Health"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["Live Simulator"])
api_router.include_router(locations.router, prefix="/locations", tags=["Geospatial Gazetteer"])
