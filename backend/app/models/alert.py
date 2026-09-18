import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, Text
from app.core.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, default=lambda: f"ALT-{str(uuid.uuid4())[:8].upper()}")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    alert_level = Column(String(50), index=True, default="HIGH") # INFO, LOW, MEDIUM, HIGH, CRITICAL
    category = Column(String(100), index=True, nullable=False)
    
    city = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    report_count = Column(Integer, default=1)
    trend_description = Column(String(100), default="+25% in last 30 minutes")
    is_active = Column(Boolean, default=True)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
