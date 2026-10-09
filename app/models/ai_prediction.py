import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(50), ForeignKey("reports.id"), nullable=False, unique=True, index=True)
    
    predicted_category = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    predicted_severity = Column(String(50), default="MEDIUM")
    
    extracted_location = Column(String(150), nullable=True)
    extracted_state = Column(String(100), nullable=True)
    
    trust_score = Column(Integer, default=80)
    reasoning_summary = Column(Text, nullable=True)
    model_name = Column(String(100), default="WeatherPulse-Ensemble-v1")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    report = relationship("Report", back_populates="ai_prediction")
