import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router
from app.websocket.manager import manager
from app.services.simulator import simulator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and auto-seed if first run
    print("Starting WeatherPulse India Backend Server...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if database is empty
    from scripts.seed_data import seed_database
    seed_database()

    # Optional simulator auto-start
    if settings.SIMULATOR_AUTO_START:
        simulator.start(interval=settings.SIMULATOR_INTERVAL_SECONDS)

    yield

    # Shutdown
    print("Shutting down WeatherPulse India Backend Server...")
    simulator.stop()

app = FastAPI(
    title=settings.APP_NAME,
    description=f"**{settings.SUBTITLE}**\n\nScalable Meteorological Big Data Analytics Platform developed for the Ministry of Earth Sciences (MoES) / Smart India Hackathon (SIH 2026). Ingests, analyzes, cleans, deduplicates, and classifies weather telemetry and citizen crowdsourced reports across India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix="/api/v1")

# WebSocket Live Telemetry Endpoint (Section 37)
@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "mode": "DEVELOPMENT_DEMO"
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} - {settings.SUBTITLE}",
        "docs": "/docs",
        "api_v1": "/api/v1",
        "websocket": "/ws/events"
    }
