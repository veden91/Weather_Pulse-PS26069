import uuid
from sqlalchemy import Column, String, Float, Boolean
from app.core.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    city = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=True)
    state = Column(String(100), index=True, nullable=False)
    country = Column(String(50), default="India")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
