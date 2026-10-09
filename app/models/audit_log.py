import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=True)
    username = Column(String(100), default="system")
    action = Column(String(100), nullable=False) # e.g. VERIFY_REPORT, CREATE_ALERT, UPDATE_EVENT, INGEST_DATA
    resource_type = Column(String(50), nullable=False) # REPORT, EVENT, ALERT, USER, SOURCE
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
