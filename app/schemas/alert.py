from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AlertCreate(BaseModel):
    title: str
    description: str
    alert_level: str = "HIGH" # INFO, LOW, MEDIUM, HIGH, CRITICAL
    category: str
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float
    report_count: int = 1
    trend_description: Optional[str] = "+30% in last 30 minutes"
    expires_at: Optional[datetime] = None

class AlertResponse(BaseModel):
    id: str
    title: str
    description: str
    alert_level: str
    category: str
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float
    report_count: int
    trend_description: str
    is_active: bool
    issued_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
