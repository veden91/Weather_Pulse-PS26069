from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from app.schemas.report import ReportResponse

class EventBase(BaseModel):
    title: str
    event_category: str
    severity: str = "MEDIUM"
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float
    radius_km: float = 15.0

class EventCreate(EventBase):
    confidence: float = 0.85
    verification_status: str = "PENDING"
    summary: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    verification_status: Optional[str] = None
    summary: Optional[str] = None
    is_active: Optional[bool] = None

class EventTimelineItem(BaseModel):
    timestamp: datetime
    title: str
    description: str
    type: str # FIRST_REPORT, NEW_REPORTS, AI_CONFIDENCE_UPDATE, ADMIN_VERIFICATION, CRITICAL_ESCALATION

class VerificationHistoryItem(BaseModel):
    id: str
    action: str
    previous_status: str
    new_status: str
    notes: Optional[str] = None
    verified_by: str
    created_at: datetime

class EventResponse(BaseModel):
    id: str
    title: str
    event_category: str
    severity: str
    confidence: float
    verification_status: str
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float
    radius_km: float
    report_count: int
    source_count: int
    first_reported_at: datetime
    last_reported_at: datetime
    is_active: bool
    summary: Optional[str] = None

    class Config:
        from_attributes = True

class EventDetailResponse(EventResponse):
    reports: List[ReportResponse] = []
    timeline: List[EventTimelineItem] = []
    verification_history: List[VerificationHistoryItem] = []
    similar_events: List[EventResponse] = []

class EventFilterParams(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    verification_status: Optional[str] = None
    search: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 50
    offset: int = 0
