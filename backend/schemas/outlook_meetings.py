from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MeetingTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class MeetingTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class MeetingTaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    meeting_id: str
    is_completed: bool

    class Config:
        from_attributes = True


class MeetingResponse(BaseModel):
    id: str
    title: str
    location: Optional[str] = 'Контур.Толк'
    team_case_history_id: str
    start_at: datetime
    end_at: datetime
    outlook_event_id: str
    event_link: str
    notes: Optional[str] = None
    timezone: Optional[int] = None
    tasks: list[MeetingTaskResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class MeetingCreate(BaseModel):
    title: str
    start_at: datetime
    location: Optional[str] = 'Контур.Толк'
    end_at: datetime
    event_link: str
    notes: Optional[str] = None
    timezone: Optional[int] = None
    tasks: list[MeetingTaskCreate] = Field(default_factory=list)


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    location: Optional[str] = None
    end_at: Optional[datetime] = None
    event_link: Optional[str] = None
    notes: Optional[str] = None
