from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(50), primary_key=True) # e.g. "REP-2026-001283"
    source_id = Column(String(50), ForeignKey("sources.id"), nullable=False)
    event_id = Column(String(50), ForeignKey("events.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    text = Column(Text, nullable=False)
    raw_payload = Column(Text, nullable=True) # JSON raw payload
    event_category = Column(String(100), index=True, nullable=False)
    severity = Column(String(50), index=True, default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.85)
    trust_score = Column(Integer, default=75) # 0 to 100
    verification_status = Column(String(50), index=True, default="PENDING", nullable=False) # PENDING, VERIFIED, REJECTED, SUSPICIOUS, NEEDS_REVIEW
    
    city = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ingested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processing_status = Column(String(50), default="PROCESSED", nullable=False) # RECEIVED, PROCESSING, PROCESSED, FAILED, REVIEW_REQUIRED

    # Relationships
    event = relationship("Event", back_populates="reports")
    media = relationship("Media", back_populates="report", cascade="all, delete-orphan")
    ai_prediction = relationship("AIPrediction", back_populates="report", uselist=False, cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="report", cascade="all, delete-orphan")
