import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=True, index=True)
    event_id = Column(String(50), ForeignKey("events.id"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True) # Admin or Verifier
    
    action = Column(String(50), nullable=False) # VERIFY, REJECT, MARK_SUSPICIOUS, REQUEST_REVIEW, ESCALATE
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    verified_by_name = Column(String(100), default="Duty Officer / AI System")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    report = relationship("Report", back_populates="verification_records")
    event = relationship("Event", back_populates="verification_records")
