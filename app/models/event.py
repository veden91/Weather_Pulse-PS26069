from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(String(50), primary_key=True) # e.g. "EVT-LKO-2026-001"
    title = Column(String(200), nullable=False)
    event_category = Column(String(100), index=True, nullable=False) # e.g. "Heavy Rainfall"
    severity = Column(String(50), index=True, default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85) # 0.0 to 1.0
    verification_status = Column(String(50), index=True, default="PENDING", nullable=False) # PENDING, VERIFIED, REJECTED, SUSPICIOUS
    
    city = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=15.0)

    report_count = Column(Integer, default=1)
    source_count = Column(Integer, default=1)
    first_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    summary = Column(Text, nullable=True)

    # Relationships
    reports = relationship("Report", back_populates="event", cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="event", cascade="all, delete-orphan")
