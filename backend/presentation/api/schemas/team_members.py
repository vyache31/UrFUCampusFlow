from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TeamMemberCreate(BaseModel):
    student_id: str
    position: str
    joined_at: Optional[datetime] = None


class TeamMemberResponse(BaseModel):
    id: str
    team_id: str
    student_id: str
    student_name: Optional[str] = None
    position: str
    joined_at: datetime
    left_at: Optional[datetime] = None
    is_current: bool

    class Config:
        from_attributes = True
