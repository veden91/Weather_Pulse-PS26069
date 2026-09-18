from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertCreate

router = APIRouter()

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    alert_level: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(Alert.is_active == is_active)
    if alert_level:
        query = query.filter(Alert.alert_level == alert_level.upper())
    
    alerts = query.order_by(desc(Alert.issued_at)).all()
    return alerts

@router.post("", response_model=AlertResponse)
def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    import uuid
    alert_id = f"ALT-{alert_in.city[:3].upper()}-{str(uuid.uuid4())[:4].upper()}"
    alert = Alert(
        id=alert_id,
        title=alert_in.title,
        description=alert_in.description,
        alert_level=alert_in.alert_level.upper(),
        category=alert_in.category,
        city=alert_in.city,
        district=alert_in.district or alert_in.city,
        state=alert_in.state,
        latitude=alert_in.latitude,
        longitude=alert_in.longitude,
        report_count=alert_in.report_count,
        trend_description=alert_in.trend_description or "+20% in last 30 minutes",
        is_active=True,
        issued_at=datetime.now(timezone.utc),
        expires_at=alert_in.expires_at
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.put("/{alert_id}/dismiss", response_model=dict)
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    db.commit()
    return {"status": "DISMISSED", "id": alert_id}
