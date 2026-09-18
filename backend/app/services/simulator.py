import asyncio
import logging
import random
from typing import Optional
from app.core.database import SessionLocal
from app.ingestion.sources import (
    IMDCollector, SocialMediaAdapter, CitizenPortalAdapter,
    WeatherApiAdapter, PublicDatasetAdapter
)
from app.processing.pipeline import process_raw_report
from app.websocket.manager import manager

logger = logging.getLogger("weatherpulse.simulator")

class DataSimulator:
    def __init__(self):
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self.interval_seconds = 4.0
        self.collectors = [
            IMDCollector(),
            SocialMediaAdapter(),
            CitizenPortalAdapter(),
            WeatherApiAdapter(),
            PublicDatasetAdapter()
        ]

    def start(self, interval: float = 4.0):
        if self.is_running:
            return
        self.is_running = True
        self.interval_seconds = interval
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Live Weather Data Simulator started with {self.interval_seconds}s interval.")

    def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Live Weather Data Simulator stopped.")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                # Pick a random collector
                collector = random.choice(self.collectors)
                reports = collector.collect()
                if reports:
                    raw_report = reports[0]
                    # Process in a fresh DB session
                    db = SessionLocal()
                    try:
                        result = process_raw_report(db, raw_report)
                        
                        # Broadcast via WebSocket
                        await manager.broadcast("NEW_REPORT", result)
                        
                        # If a new critical alert was generated
                        if result.get("severity") == "CRITICAL":
                            await manager.broadcast("CRITICAL_ALERT", {
                                "title": f"CRITICAL {result.get('event_category')} alert in {result.get('city')}",
                                "event_id": result.get("event_id"),
                                "city": result.get("city"),
                                "state": result.get("state")
                            })
                    finally:
                        db.close()

                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulator error in loop: {e}", exc_info=True)
                await asyncio.sleep(self.interval_seconds)

simulator = DataSimulator()
