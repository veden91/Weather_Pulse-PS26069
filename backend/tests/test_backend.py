import os
import sys
import pytest
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.core.database import Base, engine, SessionLocal
from app.ai.classifier import classifier, CATEGORIES
from app.ai.trust_scorer import calculate_trust_score
from app.ai.deduplicator import find_matching_event, calculate_text_similarity
from app.geospatial.haversine import haversine_distance_km
from app.geospatial.gazetteer import extract_location_from_text, find_nearest_location
from app.processing.pipeline import process_raw_report
from app.models.event import Event
from app.models.report import Report
from app.models.user import User

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_classifier_event_categories():
    test_cases = [
        ("Heavy rainfall has caused waterlogging in Gomti Nagar, Lucknow.", "Heavy Rainfall", "Lucknow"),
        ("Flash flood warning issued as river breaches banks in Patna.", "Flash Flood", "Patna"),
        ("Extreme heatwave across Jaipur with temperatures exceeding 46 degrees.", "Heatwave", "Jaipur"),
        ("Dense fog blanketed Chandigarh airport reducing visibility to zero.", "Dense Fog", "Chandigarh"),
        ("Super cyclone landfall imminent near Visakhapatnam coast with destructive winds.", "Cyclone", "Visakhapatnam"),
        ("Massive hailstorm with large stones destroying crops in Nashik.", "Hailstorm", "Nashik"),
        ("Torrential cloudburst over Dehradun valley causing road collapse.", "Cloudburst", "Dehradun")
    ]
    for text, expected_cat, expected_city in test_cases:
        res = classifier.classify(text)
        assert res["event_type"] == expected_cat, f"Expected {expected_cat}, got {res['event_type']} for '{text}'"
        assert res["confidence"] >= 0.85
        assert expected_city.lower() in res["location"].lower() or expected_city.lower() == res["city"].lower()

def test_trust_scoring():
    # Authoritative report with media and high confidence
    res_high = calculate_trust_score(
        text="Official IMD AWS telemetry reports 95mm precipitation in 2 hours in Lucknow.",
        source_type="IMD_OPEN_DATA",
        ai_confidence=0.96,
        has_media=True,
        corroborating_count=4,
        has_gps=True
    )
    assert res_high["trust_score"] >= 85
    assert res_high["confidence_label"] in ["Verified", "High Confidence"]

    # Suspicious report
    res_susp = calculate_trust_score(
        text="Tsunami in Delhi at Connaught Place alien weather attack!",
        source_type="SOCIAL_MEDIA",
        ai_confidence=0.5,
        has_media=False,
        has_gps=False
    )
    assert res_susp["trust_score"] <= 39
    assert res_susp["confidence_label"] == "Suspicious"

def test_geospatial_haversine():
    # Distance between Lucknow (26.8467, 80.9462) and Kanpur (26.4499, 80.3319) is ~75-80 km
    dist = haversine_distance_km(26.8467, 80.9462, 26.4499, 80.3319)
    assert 70 < dist < 90

    # Same location distance is 0
    assert haversine_distance_km(26.8467, 80.9462, 26.8467, 80.9462) == 0.0

def test_geospatial_ner_gazetteer():
    loc = extract_location_from_text("Severe waterlogging at Gomti Nagar in Lucknow after rains.")
    assert loc is not None
    assert loc["city"] == "Lucknow"
    assert loc["state"] == "Uttar Pradesh"

    loc_patna = extract_location_from_text("Flood warning near Patliputra, Patna.")
    assert loc_patna is not None
    assert loc_patna["city"] == "Patna"
    assert loc_patna["state"] == "Bihar"

def test_deduplicator_similarity():
    sim = calculate_text_similarity(
        "Heavy rainfall in Lucknow causing waterlogging",
        "Waterlogging reported in Lucknow due to heavy rainfall"
    )
    assert sim >= 0.5

def test_9_stage_pipeline_processing(db):
    raw = {
        "text": "Intense thunderstorm and waterlogging reported near Hazratganj, Lucknow.",
        "source_id": "CITIZEN_PORTAL",
        "source_type": "CITIZEN",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "has_media": True
    }
    result = process_raw_report(db, raw)
    assert "report_id" in result
    assert "event_id" in result
    assert result["city"] == "Lucknow"
    assert result["confidence"] >= 0.8
    assert result["trust_score"] > 0
