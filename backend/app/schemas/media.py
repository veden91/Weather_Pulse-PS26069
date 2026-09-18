from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class MediaResponse(BaseModel):
    id: str
    report_id: str
    media_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    file_size_bytes: int = 0
    caption: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
