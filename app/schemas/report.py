from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from app.schemas.media import MediaResponse

class ReportBase(BaseModel):
    text: str
    event_category: str
    severity: str = "MEDIUM"
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float

class CitizenReportCreate(BaseModel):
    event_category: str
    description: str
    location_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None
    video_url: Optional[str] = None

class ReportCreate(ReportBase):
    source_id: str
    confidence: Optional[float] = 0.85
    trust_score: Optional[int] = 75
    raw_payload: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    source_id: str
    event_id: Optional[str] = None
    text: str
    event_category: str
    severity: str
    confidence: float
    trust_score: int
    verification_status: str
    city: str
    district: Optional[str] = None
    state: str
    latitude: float
    longitude: float
    reported_at: datetime
    ingested_at: datetime
    processing_status: str
    media: List[MediaResponse] = []

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    raw_payload: Optional[str] = None
    ai_reasoning: Optional[str] = None
    ai_model_name: Optional[str] = None

class ReportFilterParams(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    verification_status: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    source_id: Optional[str] = None
    min_trust: Optional[int] = None
    search: Optional[str] = None
    limit: int = 50
    offset: int = 0
