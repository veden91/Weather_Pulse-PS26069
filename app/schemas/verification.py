from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class VerificationActionRequest(BaseModel):
    action: str # VERIFY, REJECT, MARK_SUSPICIOUS, REQUEST_REVIEW, ESCALATE
    notes: Optional[str] = None
    reason: Optional[str] = None

class VerificationRecordResponse(BaseModel):
    id: str
    report_id: Optional[str] = None
    event_id: Optional[str] = None
    action: str
    previous_status: str
    new_status: str
    notes: Optional[str] = None
    verified_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True
