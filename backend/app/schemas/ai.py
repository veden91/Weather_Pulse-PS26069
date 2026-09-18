from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ClassifyRequest(BaseModel):
    text: str
    location_hint: Optional[str] = None

class ClassifyResponse(BaseModel):
    event_type: str
    location: str
    state: str
    city: Optional[str] = None
    district: Optional[str] = None
    severity: str
    confidence: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class TrustScoreRequest(BaseModel):
    text: str
    source_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_media: bool = False
    reported_at: Optional[datetime] = None

class TrustScoreResponse(BaseModel):
    trust_score: int # 0 to 100
    confidence_label: str # Verified / High Confidence / Needs Review / Suspicious
    reasoning_summary: str
    factors: Dict[str, Any]

class DeduplicateRequest(BaseModel):
    text: str
    category: str
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None
    max_radius_km: float = 15.0

class DeduplicateMatch(BaseModel):
    event_id: str
    title: str
    city: str
    state: str
    distance_km: float
    similarity_score: float
    report_count: int

class DeduplicateResponse(BaseModel):
    is_duplicate: bool
    matched_event: Optional[DeduplicateMatch] = None
    candidate_matches: List[DeduplicateMatch] = []
