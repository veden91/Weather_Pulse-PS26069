from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.report import Report
from app.models.event import Event
from app.models.verification_record import VerificationRecord
from app.schemas.report import ReportDetailResponse
from app.schemas.verification import VerificationActionRequest, VerificationRecordResponse

router = APIRouter()

@router.get("/queue", response_model=List[ReportDetailResponse])
def get_verification_queue(
    tab: str = "PENDING_REVIEW", # PENDING_REVIEW, AI_FLAGGED, SUSPICIOUS, HIGH_IMPACT, RECENT
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Report)

    if tab == "PENDING_REVIEW":
        query = query.filter(Report.verification_status == "PENDING")
    elif tab == "AI_FLAGGED":
        query = query.filter(Report.trust_score.between(40, 69))
    elif tab == "SUSPICIOUS":
        query = query.filter(Report.verification_status == "SUSPICIOUS")
    elif tab == "HIGH_IMPACT":
        query = query.filter(Report.severity.in_(["HIGH", "CRITICAL"]))
    elif tab == "RECENT":
        query = query.order_by(desc(Report.ingested_at))
    else:
        query = query.filter(Report.verification_status == "PENDING")

    query = query.order_by(desc(Report.reported_at))
    reports = query.limit(limit).all()

    results = []
    for r in reports:
        ai_pred = r.ai_prediction
        results.append(ReportDetailResponse(
            id=r.id,
            source_id=r.source_id,
            event_id=r.event_id,
            text=r.text,
            event_category=r.event_category,
            severity=r.severity,
            confidence=r.confidence,
            trust_score=r.trust_score,
            verification_status=r.verification_status,
            city=r.city,
            district=r.district,
            state=r.state,
            latitude=r.latitude,
            longitude=r.longitude,
            reported_at=r.reported_at,
            ingested_at=r.ingested_at,
            processing_status=r.processing_status,
            media=r.media,
            raw_payload=r.raw_payload,
            ai_reasoning=ai_pred.reasoning_summary if ai_pred else None,
            ai_model_name=ai_pred.model_name if ai_pred else None
        ))
    return results

@router.post("/reports/{report_id}/action", response_model=VerificationRecordResponse)
def execute_verification_action(
    report_id: str,
    action_in: VerificationActionRequest,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    action = action_in.action.upper()
    prev_status = report.verification_status
    new_status = prev_status

    if action == "VERIFY":
        new_status = "VERIFIED"
        report.trust_score = max(report.trust_score, 95)
    elif action == "REJECT":
        new_status = "REJECTED"
        report.trust_score = min(report.trust_score, 20)
    elif action == "MARK_SUSPICIOUS":
        new_status = "SUSPICIOUS"
        report.trust_score = min(report.trust_score, 35)
    elif action == "REQUEST_REVIEW":
        new_status = "NEEDS_REVIEW"
    elif action == "ESCALATE":
        new_status = "VERIFIED"
        report.severity = "CRITICAL"

    report.verification_status = new_status

    # Also update associated event if verifying
    if report.event_id and new_status == "VERIFIED":
        event = db.query(Event).filter(Event.id == report.event_id).first()
        if event and event.verification_status == "PENDING":
            event.verification_status = "VERIFIED"

    # Create verification audit record
    record = VerificationRecord(
        report_id=report.id,
        event_id=report.event_id,
        action=action,
        previous_status=prev_status,
        new_status=new_status,
        notes=action_in.notes or action_in.reason or f"Action {action} performed in AI Verification Center.",
        verified_by_name="Duty Officer (Verification Cell)"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record
