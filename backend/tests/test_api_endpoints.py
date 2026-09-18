import os
import sys
import pytest
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["user"]["username"] == "admin"

def test_list_events():
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) > 0
    first = events[0]
    assert "id" in first
    assert "event_category" in first
    assert "latitude" in first
    assert "longitude" in first

def test_list_reports():
    response = client.get("/api/v1/reports")
    assert response.status_code == 200
    reports = response.json()
    assert len(reports) > 0
    first = reports[0]
    assert "trust_score" in first
    assert "verification_status" in first

def test_ai_classify_endpoint():
    response = client.post("/api/v1/ai/classify", json={
        "text": "Heavy rainfall has caused waterlogging in Gomti Nagar, Lucknow."
    })
    assert response.status_code == 200
    data = response.json()
    assert data["event_type"] == "Heavy Rainfall"
    assert "Lucknow" in data["location"]
    assert data["state"] == "Uttar Pradesh"
    assert data["confidence"] >= 0.90

def test_analytics_endpoints():
    overview = client.get("/api/v1/analytics/overview")
    assert overview.status_code == 200
    ov_data = overview.json()
    assert ov_data["total_reports"] > 0
    assert ov_data["active_events"] > 0

    charts = client.get("/api/v1/analytics/charts")
    assert charts.status_code == 200
    ch_data = charts.json()
    assert "events_by_category" in ch_data
    assert "reports_over_time" in ch_data

    states = client.get("/api/v1/analytics/states")
    assert states.status_code == 200
    assert len(states.json()) > 0

    insights = client.get("/api/v1/analytics/insights")
    assert insights.status_code == 200
    assert len(insights.json()) > 0

def test_citizen_report_submission():
    response = client.post("/api/v1/reports/citizen", json={
        "event_category": "Flood",
        "description": "Severe flooding and rising waters observed near Rajendra Nagar, Patna.",
        "location_name": "Rajendra Nagar, Patna",
        "latitude": 25.5941,
        "longitude": 85.1376
    })
    assert response.status_code == 200
    res = response.json()
    assert res["status"] == "REPORT_RECEIVED"
    assert "report_id" in res
    assert "event_id" in res
