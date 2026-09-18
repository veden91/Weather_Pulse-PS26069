from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.analytics.insights import (
    get_kpi_cards, get_charts_data, get_state_rankings,
    generate_ai_insights
)
from app.schemas.analytics import (
    KPICardsResponse, StateRankingResponse, AnalyticsInsightResponse,
    FullAnalyticsResponse
)

router = APIRouter()

@router.get("/overview", response_model=KPICardsResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    return get_kpi_cards(db)

@router.get("/charts", response_model=Dict[str, Any])
def get_charts(db: Session = Depends(get_db)):
    return get_charts_data(db)

@router.get("/states", response_model=List[StateRankingResponse])
def get_states(db: Session = Depends(get_db)):
    return get_state_rankings(db)

@router.get("/insights", response_model=List[AnalyticsInsightResponse])
def get_insights(db: Session = Depends(get_db)):
    return generate_ai_insights(db)

@router.get("/full", response_model=FullAnalyticsResponse)
def get_full_analytics(db: Session = Depends(get_db)):
    kpis = get_kpi_cards(db)
    charts = get_charts_data(db)
    states = get_state_rankings(db)
    insights = generate_ai_insights(db)

    return FullAnalyticsResponse(
        kpis=kpis,
        reports_over_time=charts["reports_over_time"],
        events_by_category=charts["events_by_category"],
        events_by_state=charts["events_by_state"],
        verified_vs_suspicious=charts["verified_vs_suspicious"],
        reports_by_source=charts["reports_by_source"],
        severity_distribution=charts["severity_distribution"],
        top_affected_cities=charts["top_affected_cities"],
        hourly_pattern=charts["hourly_pattern"],
        event_growth=charts["event_growth"],
        ai_performance=charts["ai_performance"],
        state_rankings=states,
        ai_insights=insights
    )
