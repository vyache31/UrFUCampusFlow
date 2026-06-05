from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CuratorAssignmentCreate(BaseModel):
    user_id: str
    team_case_history_id: str


class CuratorAssignmentUpdate(BaseModel):
    unassigned_at: Optional[datetime] = None
    is_current: Optional[bool] = None


class CuratorAssignmentResponse(BaseModel):
    id: str
    user_id: str
    team_case_history_id: str
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None
    is_current: bool

    class Config:
        from_attributes = True


class CuratorMeetingAttendanceCreate(BaseModel):
    meeting_id: str
    curator_assignment_id: str
    is_present: bool = False


class CuratorMeetingAttendanceUpdate(BaseModel):
    is_present: Optional[bool] = None


class CuratorMeetingAttendanceResponse(BaseModel):
    id: str
    meeting_id: str
    curator_assignment_id: str
    is_present: bool

    class Config:
        from_attributes = True
