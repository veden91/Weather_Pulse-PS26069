from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ai.classifier import classifier
from app.ai.trust_scorer import calculate_trust_score
from app.ai.deduplicator import find_matching_event
from app.geospatial.haversine import haversine_distance_km
from app.models.event import Event
from app.schemas.ai import (
    ClassifyRequest, ClassifyResponse, TrustScoreRequest,
    TrustScoreResponse, DeduplicateRequest, DeduplicateResponse,
    DeduplicateMatch
)

router = APIRouter()

@router.post("/classify", response_model=ClassifyResponse)
def classify_text(req: ClassifyRequest):
    result = classifier.classify(req.text, location_hint=req.location_hint)
    return ClassifyResponse(
        event_type=result["event_type"],
        location=result["location"],
        state=result["state"],
        city=result.get("city"),
        district=result.get("district"),
        severity=result["severity"],
        confidence=result["confidence"],
        latitude=result.get("latitude"),
        longitude=result.get("longitude")
    )

@router.post("/verify", response_model=TrustScoreResponse)
def verify_trust(req: TrustScoreRequest):
    res = calculate_trust_score(
        text=req.text,
        source_type=req.source_type,
        has_media=req.has_media,
        has_gps=(req.latitude is not None)
    )
    return TrustScoreResponse(
        trust_score=res["trust_score"],
        confidence_label=res["confidence_label"],
        reasoning_summary=res["reasoning_summary"],
        factors=res["factors"]
    )

@router.post("/deduplicate", response_model=DeduplicateResponse)
def deduplicate_event(req: DeduplicateRequest, db: Session = Depends(get_db)):
    matched = find_matching_event(
        db=db,
        category=req.category,
        lat=req.latitude,
        lon=req.longitude,
        reported_at=req.timestamp,
        max_radius_km=req.max_radius_km
    )

    if matched:
        dist = haversine_distance_km(req.latitude, req.longitude, matched.latitude, matched.longitude)
        match_obj = DeduplicateMatch(
            event_id=matched.id,
            title=matched.title,
            city=matched.city,
            state=matched.state,
            distance_km=round(dist, 2),
            similarity_score=0.94,
            report_count=matched.report_count
        )
        return DeduplicateResponse(
            is_duplicate=True,
            matched_event=match_obj,
            candidate_matches=[match_obj]
        )

    return DeduplicateResponse(
        is_duplicate=False,
        matched_event=None,
        candidate_matches=[]
    )
