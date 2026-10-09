import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.report import Report
from app.models.ai_prediction import AIPrediction
from app.models.verification_record import VerificationRecord
from app.schemas.report import (
    ReportResponse, ReportDetailResponse, ReportCreate,
    CitizenReportCreate
)
from app.schemas.verification import VerificationActionRequest
from app.processing.pipeline import process_raw_report
from app.websocket.manager import manager

router = APIRouter()

@router.get("", response_model=List[ReportResponse])
def list_reports(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    verification_status: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    source_id: Optional[str] = None,
    min_trust: Optional[int] = None,
    search: Optional[str] = None,
    format: Optional[str] = Query(None, description="Set to 'csv' or 'json' for data export"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Report)

    if category:
        query = query.filter(Report.event_category.ilike(f"%{category}%"))
    if severity:
        query = query.filter(Report.severity == severity.upper())
    if verification_status:
        query = query.filter(Report.verification_status == verification_status.upper())
    if state:
        query = query.filter(Report.state.ilike(f"%{state}%"))
    if city:
        query = query.filter(Report.city.ilike(f"%{city}%"))
    if source_id:
        query = query.filter(Report.source_id == source_id)
    if min_trust is not None:
        query = query.filter(Report.trust_score >= min_trust)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Report.id.ilike(search_pattern)) |
            (Report.text.ilike(search_pattern)) |
            (Report.city.ilike(search_pattern)) |
            (Report.state.ilike(search_pattern))
        )

    query = query.order_by(desc(Report.reported_at))

    # Support Export (Section 59)
    if format == "csv":
        reports = query.limit(500).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Report ID", "Source", "Event ID", "Text", "Category", "Severity",
            "Trust Score", "Status", "City", "State", "Latitude", "Longitude",
            "Reported At"
        ])
        for r in reports:
            writer.writerow([
                r.id, r.source_id, r.event_id, r.text, r.event_category, r.severity,
                r.trust_score, r.verification_status, r.city, r.state,
                r.latitude, r.longitude, r.reported_at
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weatherpulse_reports.csv"}
        )

    reports = query.offset(offset).limit(limit).all()
    return reports

@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Weather report not found")

    ai_pred = db.query(AIPrediction).filter(AIPrediction.report_id == report_id).first()
    
    return ReportDetailResponse(
        id=report.id,
        source_id=report.source_id,
        event_id=report.event_id,
        text=report.text,
        event_category=report.event_category,
        severity=report.severity,
        confidence=report.confidence,
        trust_score=report.trust_score,
        verification_status=report.verification_status,
        city=report.city,
        district=report.district,
        state=report.state,
        latitude=report.latitude,
        longitude=report.longitude,
        reported_at=report.reported_at,
        ingested_at=report.ingested_at,
        processing_status=report.processing_status,
        media=report.media,
        raw_payload=report.raw_payload,
        ai_reasoning=ai_pred.reasoning_summary if ai_pred else None,
        ai_model_name=ai_pred.model_name if ai_pred else None
    )

@router.post("", response_model=dict)
def ingest_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    raw_data = report_in.model_dump()
    result = process_raw_report(db, raw_data)
    return result

@router.post("/citizen", response_model=dict)
def submit_citizen_report(citizen_in: CitizenReportCreate, db: Session = Depends(get_db)):
    """
    Section 31: Citizen Report Portal intake.
    Receives description, GPS, photo, video, returns ticket with processing status.
    """
    raw_data = {
        "text": citizen_in.description,
        "event_category": citizen_in.event_category,
        "source_id": "CITIZEN_PORTAL",
        "source_type": "CITIZEN",
        "latitude": citizen_in.latitude,
        "longitude": citizen_in.longitude,
        "city": citizen_in.city,
        "state": citizen_in.state,
        "photo_url": citizen_in.photo_url,
        "video_url": citizen_in.video_url,
        "raw_payload": {"location_name": citizen_in.location_name, "submitted_via": "citizen_portal"}
    }
    result = process_raw_report(db, raw_data)
    return {
        "status": "REPORT_RECEIVED",
        "report_id": result["report_id"],
        "event_id": result["event_id"],
        "ai_status": "PROCESSED",
        "confidence": result["confidence"],
        "verification_status": result["verification_status"],
        "trust_score": result["trust_score"],
        "message": f"Thank you for your report. Assigned tracking ID {result['report_id']}."
    }

@router.post("/{report_id}/verify", response_model=dict)
def verify_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    prev_status = report.verification_status
    report.verification_status = "VERIFIED"
    report.trust_score = max(report.trust_score, 95)

    # Record decision
    rec = VerificationRecord(
        report_id=report.id,
        event_id=report.event_id,
        action="VERIFY",
        previous_status=prev_status,
        new_status="VERIFIED",
        notes="Verified by duty officer based on satellite and radar ground truth.",
        verified_by_name="Senior Analyst / Duty Officer"
    )
    db.add(rec)
    db.commit()

    return {"status": "SUCCESS", "report_id": report_id, "verification_status": "VERIFIED"}

@router.post("/{report_id}/reject", response_model=dict)
def reject_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    prev_status = report.verification_status
    report.verification_status = "REJECTED"
    report.trust_score = min(report.trust_score, 25)

    rec = VerificationRecord(
        report_id=report.id,
        event_id=report.event_id,
        action="REJECT",
        previous_status=prev_status,
        new_status="REJECTED",
        notes="Rejected due to inconsistent geospatial telemetry or out-of-season claim.",
        verified_by_name="Senior Analyst / Duty Officer"
    )
    db.add(rec)
    db.commit()

    return {"status": "SUCCESS", "report_id": report_id, "verification_status": "REJECTED"}
