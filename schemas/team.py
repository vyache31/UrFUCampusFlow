from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str
    semester_id: int
    university_id: int
    case_id: int
    status: str


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    semester_id: Optional[int] = None
    university_id: Optional[int] = None
    case_id: Optional[int] = None
    status: Optional[str] = None


class TeamResponse(BaseModel):
    id: str
    name: str
    semester_id: int
    university_id: int
    case_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True