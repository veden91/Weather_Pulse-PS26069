import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.report import Report
from app.models.event import Event
from app.models.event_report import EventReport
from app.models.ai_prediction import AIPrediction
from app.models.media import Media
from app.models.source import Source
from app.models.alert import Alert
from app.ai.classifier import classifier
from app.ai.trust_scorer import calculate_trust_score
from app.ai.deduplicator import find_matching_event
from app.geospatial.gazetteer import extract_location_from_text, find_nearest_location

def process_raw_report(
    db: Session,
    raw_data: Dict[str, Any],
    broadcast_callback: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Executes the 9-stage Data Quality & AI Ingestion Pipeline.
    Stage 1: RAW INGESTION
    Stage 2: VALIDATION
    Stage 3: CLEANING
    Stage 4: NORMALIZATION
    Stage 5: GEOLOCATION
    Stage 6: CLASSIFICATION
    Stage 7: DEDUPLICATION & CLUSTERING
    Stage 8: TRUST SCORING
    Stage 9: STORAGE & REAL-TIME BROADCAST
    """
    # Stage 2: Validation
    raw_text = raw_data.get("text", "").strip()
    if not raw_text:
        raise ValueError("Report text cannot be empty.")
    
    source_id = raw_data.get("source_id", "CITIZEN_PORTAL")
    source_type = raw_data.get("source_type", "CITIZEN")
    
    # Stage 3: Cleaning
    cleaned_text = " ".join(raw_text.split())

    # Stage 4 & 5: Normalization & Geolocation
    provided_lat = raw_data.get("latitude")
    provided_lon = raw_data.get("longitude")
    
    if provided_lat is not None and provided_lon is not None:
        lat = float(provided_lat)
        lon = float(provided_lon)
        # Find nearest known city/state
        nearest = find_nearest_location(lat, lon)
        city = raw_data.get("city") or nearest["city"]
        state = raw_data.get("state") or nearest["state"]
        district = raw_data.get("district") or nearest.get("district", city)
    else:
        # Run NER location extraction from text
        extracted_loc = extract_location_from_text(cleaned_text)
        if extracted_loc:
            lat = extracted_loc["lat"]
            lon = extracted_loc["lon"]
            city = extracted_loc["city"]
            state = extracted_loc["state"]
            district = extracted_loc.get("district", city)
        else:
            # Default to New Delhi
            lat = 28.6139
            lon = 77.2090
            city = "Delhi"
            state = "Delhi"
            district = "New Delhi"

    # Stage 6: AI Classification
    classification = classifier.classify(cleaned_text, location_hint=f"{city}, {state}")
    event_category = raw_data.get("event_category") or classification["event_type"]
    severity = raw_data.get("severity") or classification["severity"]
    confidence = classification["confidence"]

    # Stage 7: Deduplication & Spatial Clustering
    now = datetime.now(timezone.utc)
    matched_event = find_matching_event(
        db=db,
        category=event_category,
        lat=lat,
        lon=lon,
        reported_at=now,
        max_radius_km=20.0,
        max_hours_delta=4.0
    )

    # Determine report trust score
    corrob_count = matched_event.report_count + 1 if matched_event else 1
    has_media = bool(raw_data.get("photo_url") or raw_data.get("video_url") or raw_data.get("has_media"))
    trust_result = calculate_trust_score(
        text=cleaned_text,
        source_type=source_type,
        ai_confidence=confidence,
        has_media=has_media,
        corroborating_count=corrob_count,
        has_gps=(provided_lat is not None)
    )
    trust_score = trust_result["trust_score"]
    verification_status = "PENDING"
    if trust_score >= 90:
        verification_status = "VERIFIED"
    elif trust_score < 40:
        verification_status = "SUSPICIOUS"

    # Stage 8: Event Aggregation
    is_new_event = False
    if matched_event:
        event = matched_event
        event.report_count += 1
        event.last_reported_at = now
        # Escalate severity if incoming report is higher
        severities_order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        if severities_order.index(severity) > severities_order.index(event.severity):
            event.severity = severity
        if verification_status == "VERIFIED" and event.verification_status == "PENDING":
            event.verification_status = "VERIFIED"
    else:
        # Create a new Event cluster
        city_code = city[:3].upper() if city else "IND"
        random_suffix = str(uuid.uuid4())[:4].upper()
        event_id = f"EVT-{city_code}-2026-{random_suffix}"
        event = Event(
            id=event_id,
            title=f"{event_category} incident reported in {city}, {state}",
            event_category=event_category,
            severity=severity,
            confidence=confidence,
            verification_status=verification_status,
            city=city,
            district=district,
            state=state,
            latitude=lat,
            longitude=lon,
            report_count=1,
            source_count=1,
            first_reported_at=now,
            last_reported_at=now,
            is_active=True,
            summary=f"Automated cluster initiated for {event_category} in {city}, {state}."
        )
        db.add(event)
        db.flush()
        is_new_event = True

    # Check if severity is CRITICAL -> Trigger Alert
    if severity == "CRITICAL" and (is_new_event or event.report_count >= 3):
        # Create or update emergency Alert
        alert_id = f"ALT-{event.id}"
        existing_alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not existing_alert:
            new_alert = Alert(
                id=alert_id,
                title=f"CRITICAL: {event_category} in {city}, {state}",
                description=f"Rapid reports spike for {event_category} affecting {city}. Immediate disaster readiness advised.",
                alert_level="CRITICAL",
                category=event_category,
                city=city,
                district=district,
                state=state,
                latitude=lat,
                longitude=lon,
                report_count=event.report_count,
                trend_description="+38% in last 30 minutes",
                is_active=True
            )
            db.add(new_alert)

    # Stage 9: Storage
    report_num = str(uuid.uuid4())[:6].upper()
    report_id = f"REP-2026-{report_num}"
    
    report = Report(
        id=report_id,
        source_id=source_id,
        event_id=event.id,
        user_id=raw_data.get("user_id"),
        text=cleaned_text,
        raw_payload=json.dumps(raw_data.get("raw_payload", {})),
        event_category=event_category,
        severity=severity,
        confidence=confidence,
        trust_score=trust_score,
        verification_status=verification_status,
        city=city,
        district=district,
        state=state,
        latitude=lat,
        longitude=lon,
        reported_at=now,
        ingested_at=now,
        processing_status="PROCESSED"
    )
    db.add(report)
    db.flush()

    # Link EventReport
    event_report = EventReport(
        event_id=event.id,
        report_id=report.id,
        similarity_score=0.92
    )
    db.add(event_report)

    # Save Media if present
    photo_url = raw_data.get("photo_url")
    video_url = raw_data.get("video_url")
    if photo_url:
        media = Media(
            report_id=report.id,
            media_type="IMAGE",
            media_url=photo_url,
            thumbnail_url=photo_url,
            caption="Geotagged citizen weather observation"
        )
        db.add(media)
    elif video_url:
        media = Media(
            report_id=report.id,
            media_type="VIDEO",
            media_url=video_url,
            thumbnail_url=video_url,
            caption="Citizen weather video capture"
        )
        db.add(media)

    # Save AI Prediction Record
    ai_pred = AIPrediction(
        report_id=report.id,
        predicted_category=event_category,
        confidence=confidence,
        predicted_severity=severity,
        extracted_location=f"{city}, {state}",
        extracted_state=state,
        trust_score=trust_score,
        reasoning_summary=trust_result["reasoning_summary"]
    )
    db.add(ai_pred)

    # Update Source metrics
    source_obj = db.query(Source).filter(Source.id == source_id).first()
    if source_obj:
        source_obj.records_ingested += 1
        source_obj.last_sync_at = now

    db.commit()
    db.refresh(report)
    db.refresh(event)

    result_payload = {
        "report_id": report.id,
        "event_id": event.id,
        "event_title": event.title,
        "event_category": event.event_category,
        "city": report.city,
        "state": report.state,
        "severity": report.severity,
        "confidence": report.confidence,
        "trust_score": report.trust_score,
        "verification_status": report.verification_status,
        "is_new_event": is_new_event,
        "report_count": event.report_count,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "text": report.text,
        "reported_at": report.reported_at.isoformat(),
        "ai_reasoning": trust_result["reasoning_summary"]
    }

    # Real-time WebSocket Broadcast
    if broadcast_callback:
        broadcast_callback(result_payload)

    return result_payload
