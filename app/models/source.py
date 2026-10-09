import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime
from app.core.database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(50), primary_key=True) # e.g. "IMD_OPEN_DATA", "TWITTER_FEED", "CITIZEN_PORTAL"
    name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False) # IMD_API, SOCIAL_MEDIA, CITIZEN, WEATHER_API, PUBLIC_DATASET, SIMULATOR
    endpoint_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    reliability_score = Column(Float, default=0.90) # 0.0 to 1.0
    latency_ms = Column(Integer, default=45)
    last_sync_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    records_ingested = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    status_label = Column(String(50), default="Connected") # Connected, Simulation Mode, Degraded, Offline
