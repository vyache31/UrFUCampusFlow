from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TeamCaseHistoryCreate(BaseModel):
    case_semesters_id: str
    started_at: Optional[datetime] = None
    is_current: bool = True


class TeamCaseHistoryResponse(BaseModel):
    id: str
    team_id: str
    case_semesters_id: str
    case_id: Optional[str] = None
    case_title: Optional[str] = None
    semester_id: Optional[int] = None
    semester_season: Optional[str] = None
    semester_year: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    is_current: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
