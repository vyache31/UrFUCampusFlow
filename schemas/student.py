from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentResponse(BaseModel):
    id: str
    name: str
    group: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    name: str
    group: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    group: Optional[str] = None
