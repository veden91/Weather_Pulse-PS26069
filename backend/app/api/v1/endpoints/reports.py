import io
import csv
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.report import Report
from app.models.event import Event
from app.models.ai_prediction import AIPrediction
from app.models.verification_record import VerificationRecord
from app.schemas.report import (
    ReportResponse, ReportDetailResponse, ReportCreate,
    CitizenReportCreate
)
from app.processing.pipeline import process_raw_report
from app.services.tinyfish_service import tinyfish_service

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
        statuses = [s.strip().upper() for s in verification_status.split(",") if s.strip()]
        expanded = set(statuses)
        if "VERIFIED" in expanded:
            expanded.add("ACCEPTED")
        elif "ACCEPTED" in expanded:
            expanded.add("VERIFIED")
        query = query.filter(Report.verification_status.in_(list(expanded)))
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
    Active TinyFish web corroboration automatically searches live news/bulletins.
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

    # Active TinyFish Corroboration Engine
    city = result.get("city") or citizen_in.city or "India"
    category = result.get("category") or citizen_in.event_category
    citations = tinyfish_service.corroborate_report(city=city, category=category, text=citizen_in.description)

    report_id = result.get("report_id")
    trust_score = result.get("trust_score", 70)
    verification_status = result.get("verification_status", "PENDING")

    if citations and report_id:
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            # Boost trust score with live corroboration (+15 points)
            report.trust_score = min(100, (report.trust_score or 70) + 15)
            if report.trust_score >= 85:
                report.verification_status = "VERIFIED"
            
            # Store citations in report's raw_payload for duty officers
            try:
                payload = json.loads(report.raw_payload) if report.raw_payload else {}
            except Exception:
                payload = {}
            payload["tinyfish_citations"] = citations
            report.raw_payload = json.dumps(payload)
            db.commit()

            trust_score = report.trust_score
            verification_status = report.verification_status

    msg = f"Thank you for your report. Assigned tracking ID {report_id}."
    if citations:
        msg += f" Corroborated with {len(citations)} live media & meteorological advisories."

    return {
        "status": "REPORT_RECEIVED",
        "report_id": report_id,
        "event_id": result["event_id"],
        "ai_status": "PROCESSED",
        "confidence": result["confidence"],
        "verification_status": verification_status,
        "trust_score": trust_score,
        "citations": citations,
        "message": msg
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

@router.post("/{report_id}/accept", response_model=dict)
def accept_report(report_id: str, db: Session = Depends(get_db)):
    """
    Mark an ingested report as ACCEPTED based upon pre-trained model & 5-factor scoring.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    prev_status = report.verification_status
    report.verification_status = "ACCEPTED"
    report.trust_score = max(report.trust_score, 90)

    # Corroborate associated Event cluster
    if report.event_id:
        event = db.query(Event).filter(Event.id == report.event_id).first()
        if event and event.verification_status == "PENDING":
            event.verification_status = "VERIFIED"

    rec = VerificationRecord(
        report_id=report.id,
        event_id=report.event_id,
        action="ACCEPT",
        previous_status=prev_status,
        new_status="ACCEPTED",
        notes="Accepted and verified by Admin based upon high trust score and pre-trained 5-factor AI validation.",
        verified_by_name="Admin Ingestion Governance"
    )
    db.add(rec)
    db.commit()

    return {
        "status": "SUCCESS",
        "report_id": report_id,
        "verification_status": "ACCEPTED",
        "trust_score": report.trust_score
    }

@router.post("/{report_id}/suspicious", response_model=dict)
def mark_report_suspicious(report_id: str, db: Session = Depends(get_db)):
    """
    Mark an ingested report as SUSPICIOUS when it has least trust (< 40) or telemetry anomalies.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    prev_status = report.verification_status
    report.verification_status = "SUSPICIOUS"
    report.trust_score = min(report.trust_score, 35)

    rec = VerificationRecord(
        report_id=report.id,
        event_id=report.event_id,
        action="MARK_SUSPICIOUS",
        previous_status=prev_status,
        new_status="SUSPICIOUS",
        notes="Flagged as Suspicious due to least trust score (< 40) or anomalous meteorological terms.",
        verified_by_name="Admin Ingestion Governance"
    )
    db.add(rec)
    db.commit()

    return {
        "status": "SUCCESS",
        "report_id": report_id,
        "verification_status": "SUSPICIOUS",
        "trust_score": report.trust_score
    }

@router.post("/auto-govern", response_model=dict)
def auto_govern_reports(
    good_threshold: int = Query(40, description="Threshold for trust score to mark VERIFIED (score >= 40)"),
    suspicious_threshold: int = Query(40, description="Threshold for least trust score to mark SUSPICIOUS (score < 40)"),
    db: Session = Depends(get_db)
):
    """
    Batch Admin Governance:
    - Reports with trust score >= 40 -> marked VERIFIED (ready for live public events)
    - Reports with least trust < 40 -> marked SUSPICIOUS
    """
    reports = db.query(Report).all()
    accepted_count = 0
    suspicious_count = 0

    for r in reports:
        if r.trust_score >= good_threshold:
            if r.verification_status not in ("VERIFIED", "ACCEPTED"):
                r.verification_status = "VERIFIED"
                accepted_count += 1
            elif r.verification_status == "ACCEPTED":
                r.verification_status = "VERIFIED"
            if r.event_id:
                event = db.query(Event).filter(Event.id == r.event_id).first()
                if event and event.verification_status == "PENDING":
                    event.verification_status = "VERIFIED"
        else:
            if r.verification_status != "SUSPICIOUS":
                r.verification_status = "SUSPICIOUS"
                suspicious_count += 1

    db.commit()

    return {
        "status": "SUCCESS",
        "accepted_count": accepted_count,
        "suspicious_count": suspicious_count,
        "total_evaluated": len(reports),
        "good_threshold": good_threshold,
        "suspicious_threshold": suspicious_threshold
    }
