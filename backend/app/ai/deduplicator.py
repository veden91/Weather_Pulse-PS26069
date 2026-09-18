from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, List, Dict, Any
from app.geospatial.haversine import haversine_distance_km
from app.models.event import Event
from sqlalchemy.orm import Session

# Related weather categories that should cluster together
SIMILAR_CATEGORY_GROUPS = [
    {"Heavy Rainfall", "Rainfall", "Flood", "Flash Flood"},
    {"Thunderstorm", "Lightning", "Hailstorm", "Strong Wind"},
    {"Fog", "Dense Fog", "Cold Wave"},
    {"Heatwave", "Dust Storm"},
    {"Cyclone", "Heavy Rainfall", "Strong Wind"}
]

def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Computes Jaccard word-level similarity between two texts.
    """
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

import re

def find_matching_event(
    db: Session,
    category: str,
    lat: float,
    lon: float,
    reported_at: Optional[datetime] = None,
    max_radius_km: float = 20.0,
    max_hours_delta: float = 4.0
) -> Optional[Event]:
    """
    Searches for an active Event cluster within max_radius_km and max_hours_delta.
    """
    if not reported_at:
        reported_at = datetime.now(timezone.utc)

    cutoff_time = reported_at - timedelta(hours=max_hours_delta)

    # Query candidate active events
    candidates = db.query(Event).filter(
        Event.is_active == True,
        Event.last_reported_at >= cutoff_time
    ).all()

    best_match = None
    min_dist = float("inf")

    for evt in candidates:
        # Check category match or compatibility
        is_compat = (evt.event_category == category)
        if not is_compat:
            for group in SIMILAR_CATEGORY_GROUPS:
                if evt.event_category in group and category in group:
                    is_compat = True
                    break
        
        if not is_compat:
            continue

        # Check geospatial distance
        dist = haversine_distance_km(lat, lon, evt.latitude, evt.longitude)
        if dist <= max_radius_km and dist < min_dist:
            min_dist = dist
            best_match = evt

    return best_match
