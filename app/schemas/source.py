from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SourceResponse(BaseModel):
    id: str
    name: str
    source_type: str
    endpoint_url: Optional[str] = None
    is_active: bool
    reliability_score: float
    latency_ms: int
    last_sync_at: datetime
    records_ingested: int
    error_count: int
    status_label: str

    class Config:
        from_attributes = True

class SourceHealthSummary(BaseModel):
    total_sources: int
    connected_sources: int
    total_records_ingested: int
    average_latency_ms: float
    overall_health: str # HEALTHY, DEGRADED, CRITICAL
    sources: List[SourceResponse]
