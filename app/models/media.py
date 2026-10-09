import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False, index=True)
    media_type = Column(String(20), nullable=False) # IMAGE, VIDEO
    media_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    checksum = Column(String(64), nullable=True)
    caption = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    report = relationship("Report", back_populates="media")
