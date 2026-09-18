import io
import csv
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.event import Event
from app.models.report import Report
from app.models.verification_record import VerificationRecord
from app.schemas.event import (
    EventResponse, EventDetailResponse, EventCreate, EventUpdate,
    EventTimelineItem, VerificationHistoryItem
)
from app.schemas.report import ReportResponse

router = APIRouter()

@router.get("", response_model=List[EventResponse])
def list_events(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    city: Optional[str] = None,
    verification_status: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    format: Optional[str] = Query(None, description="Set to 'csv' or 'json' for data export"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Event)

    if category:
        query = query.filter(Event.event_category.ilike(f"%{category}%"))
    if severity:
        query = query.filter(Event.severity == severity.upper())
    if state:
        query = query.filter(Event.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Event.district.ilike(f"%{district}%"))
    if city:
        query = query.filter(Event.city.ilike(f"%{city}%"))
    if verification_status:
        query = query.filter(Event.verification_status == verification_status.upper())
    if is_active is not None:
        query = query.filter(Event.is_active == is_active)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Event.id.ilike(search_pattern)) |
            (Event.title.ilike(search_pattern)) |
            (Event.city.ilike(search_pattern)) |
            (Event.state.ilike(search_pattern)) |
            (Event.event_category.ilike(search_pattern))
        )

    query = query.order_by(desc(Event.last_reported_at))

    # Support Export (Section 20 & Section 59)
    if format == "csv":
        events = query.limit(500).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Event ID", "Title", "Category", "Severity", "City", "State",
            "Latitude", "Longitude", "Reports Count", "Verification Status",
            "Confidence", "First Reported", "Last Reported"
        ])
        for e in events:
            writer.writerow([
                e.id, e.title, e.event_category, e.severity, e.city, e.state,
                e.latitude, e.longitude, e.report_count, e.verification_status,
                e.confidence, e.first_reported_at, e.last_reported_at
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weatherpulse_events.csv"}
        )

    events = query.offset(offset).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Weather event cluster not found")

    # Fetch associated reports
    reports = db.query(Report).filter(Report.event_id == event_id).order_by(desc(Report.reported_at)).all()
    
    # Generate event chronological timeline
    timeline = [
        EventTimelineItem(
            timestamp=event.first_reported_at,
            title="Initial Telemetry Ingested",
            description=f"First report recorded for {event.event_category} in {event.city}.",
            type="FIRST_REPORT"
        )
    ]
    if event.report_count > 1:
        timeline.append(
            EventTimelineItem(
                timestamp=event.last_reported_at,
                title=f"{event.report_count} Corroborating Reports Detected",
                description=f"Geospatial clustering linked {event.report_count} multi-source feeds within 15 km radius.",
                type="NEW_REPORTS"
            )
        )
    if event.verification_status == "VERIFIED":
        timeline.append(
            EventTimelineItem(
                timestamp=event.last_reported_at,
                title="Event Verified by Intelligence Duty Officer",
                description="Status promoted to VERIFIED after cross-validating IMD ground sensors and citizen media.",
                type="ADMIN_VERIFICATION"
            )
        )

    # Fetch verification history
    v_records = db.query(VerificationRecord).filter(VerificationRecord.event_id == event_id).order_by(desc(VerificationRecord.created_at)).all()
    verification_history = [
        VerificationHistoryItem(
            id=vr.id,
            action=vr.action,
            previous_status=vr.previous_status,
            new_status=vr.new_status,
            notes=vr.notes,
            verified_by=vr.verified_by_name,
            created_at=vr.created_at
        ) for vr in v_records
    ]

    # Fetch similar events in the same state or nearby
    similar_events = db.query(Event).filter(
        Event.state == event.state,
        Event.id != event.id
    ).limit(3).all()

    return EventDetailResponse(
        id=event.id,
        title=event.title,
        event_category=event.event_category,
        severity=event.severity,
        confidence=event.confidence,
        verification_status=event.verification_status,
        city=event.city,
        district=event.district,
        state=event.state,
        latitude=event.latitude,
        longitude=event.longitude,
        radius_km=event.radius_km,
        report_count=event.report_count,
        source_count=event.source_count,
        first_reported_at=event.first_reported_at,
        last_reported_at=event.last_reported_at,
        is_active=event.is_active,
        summary=event.summary,
        reports=[ReportResponse.model_validate(r) for r in reports],
        timeline=timeline,
        verification_history=verification_history,
        similar_events=[EventResponse.model_validate(se) for se in similar_events]
    )

@router.post("", response_model=EventResponse)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    city_code = event_in.city[:3].upper() if event_in.city else "IND"
    import uuid
    event_id = f"EVT-{city_code}-2026-{str(uuid.uuid4())[:4].upper()}"
    
    event = Event(
        id=event_id,
        title=event_in.title,
        event_category=event_in.event_category,
        severity=event_in.severity,
        confidence=event_in.confidence,
        verification_status=event_in.verification_status,
        city=event_in.city,
        district=event_in.district,
        state=event_in.state,
        latitude=event_in.latitude,
        longitude=event_in.longitude,
        radius_km=event_in.radius_km,
        report_count=1,
        source_count=1,
        first_reported_at=now,
        last_reported_at=now,
        is_active=True,
        summary=event_in.summary
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: str, event_update: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_update.model_dump(exclude_unset=True).items():
        setattr(event, key, value)
    
    event.last_reported_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"status": "deleted", "id": event_id}
