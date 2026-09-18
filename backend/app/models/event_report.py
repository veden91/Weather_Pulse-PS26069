import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.core.database import Base

class EventReport(Base):
    __tablename__ = "event_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(50), ForeignKey("events.id"), nullable=False, index=True)
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False, index=True)
    similarity_score = Column(Float, default=0.90)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
