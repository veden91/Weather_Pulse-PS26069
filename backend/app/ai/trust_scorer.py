from typing import Dict, Any, Optional
from datetime import datetime

SOURCE_WEIGHTS = {
    "IMD_OPEN_DATA": 0.95,
    "IMD_API": 0.95,
    "GOVT_WEATHER_API": 0.90,
    "WEATHER_API": 0.85,
    "CITIZEN_PORTAL": 0.70,
    "TWITTER_FEED": 0.65,
    "SOCIAL_MEDIA": 0.60,
    "SIMULATOR": 0.85
}

SUSPICIOUS_PHRASES = [
    "alien weather", "tsunami in delhi", "snow in chennai", "fake", "prank",
    "earthquake cloud", "nuclear storm", "tornado in ladakh desert 50c"
]

def calculate_trust_score(
    text: str,
    source_type: str,
    ai_confidence: float = 0.85,
    has_media: bool = False,
    corroborating_count: int = 1,
    has_gps: bool = True
) -> Dict[str, Any]:
    """
    Computes a multi-factor trust score (0-100) and human-readable reasoning summary.
    """
    text_lower = text.lower()
    
    # Check for blatantly suspicious / impossible keywords
    for phrase in SUSPICIOUS_PHRASES:
        if phrase in text_lower:
            return {
                "trust_score": 15,
                "confidence_label": "Suspicious",
                "reasoning_summary": f"Report contains anomalous terminology ('{phrase}') inconsistent with Indian meteorological conditions.",
                "factors": {
                    "source_reliability": 20,
                    "content_validity": 10,
                    "geospatial_consistency": 30,
                    "corroboration": 10
                }
            }

    # Factor 1: Source credibility (Base 30 points)
    source_factor = SOURCE_WEIGHTS.get(source_type.upper(), 0.70)
    source_points = source_factor * 35.0

    # Factor 2: AI confidence & classification strength (Max 25 points)
    ai_points = ai_confidence * 25.0

    # Factor 3: Media verification evidence (Max 15 points)
    media_points = 15.0 if has_media else 5.0

    # Factor 4: GPS location precision (Max 10 points)
    gps_points = 10.0 if has_gps else 3.0

    # Factor 5: Cross-source confirmation / corroboration (Max 15 points)
    if corroborating_count >= 5:
        corrob_points = 15.0
    elif corroborating_count >= 2:
        corrob_points = 10.0
    else:
        corrob_points = 5.0

    total_score = int(round(source_points + ai_points + media_points + gps_points + corrob_points))
    total_score = max(0, min(100, total_score))

    # Determine confidence label
    if total_score >= 90:
        label = "Verified"
        reason = "Multiple independent authoritative telemetry feeds and geo-verified media confirm this event."
    elif total_score >= 70:
        label = "High Confidence"
        reason = "Authoritative source report with high NLP confidence and consistent location parameters."
    elif total_score >= 40:
        label = "Needs Review"
        reason = "Crowdsourced report with moderate credibility; pending additional cross-source confirmation."
    else:
        label = "Suspicious"
        reason = "Low-credibility source or contradictory metadata detected; requires manual analyst verification."

    return {
        "trust_score": total_score,
        "confidence_label": label,
        "reasoning_summary": reason,
        "factors": {
            "source_points": round(source_points, 1),
            "ai_confidence_points": round(ai_points, 1),
            "media_points": round(media_points, 1),
            "gps_points": round(gps_points, 1),
            "corroboration_points": round(corrob_points, 1)
        }
    }
