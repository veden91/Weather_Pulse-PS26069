from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class KPICardsResponse(BaseModel):
    total_reports: int
    reports_today: int
    active_events: int
    verified_reports: int
    suspicious_reports: int
    states_affected: int
    ai_processed_percentage: float
    reports_per_min: float

class ChartDataPoint(BaseModel):
    label: str
    value: float
    secondary_value: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class StateRankingResponse(BaseModel):
    state: str
    events_count: int
    reports_count: int
    top_event_category: str
    severity_level: str

class AnalyticsInsightResponse(BaseModel):
    id: str
    category: str
    insight_text: str
    impact_level: str # HIGH, MEDIUM, LOW
    timestamp: str

class FullAnalyticsResponse(BaseModel):
    kpis: KPICardsResponse
    reports_over_time: List[ChartDataPoint]
    events_by_category: List[ChartDataPoint]
    events_by_state: List[ChartDataPoint]
    verified_vs_suspicious: List[ChartDataPoint]
    reports_by_source: List[ChartDataPoint]
    severity_distribution: List[ChartDataPoint]
    top_affected_cities: List[ChartDataPoint]
    hourly_pattern: List[ChartDataPoint]
    event_growth: List[ChartDataPoint]
    ai_performance: List[ChartDataPoint]
    state_rankings: List[StateRankingResponse]
    ai_insights: List[AnalyticsInsightResponse]
