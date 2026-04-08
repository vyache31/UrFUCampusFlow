from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TeamCreate(BaseModel):
    name: str
    university_id: int
    status: str


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    university_id: Optional[int] = None
    status: Optional[str] = None


class TeamResponse(BaseModel):
    id: str
    name: str
    university_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True