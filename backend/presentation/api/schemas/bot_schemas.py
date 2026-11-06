from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BotModeUpdate(BaseModel):
    mode: str


class BotModeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mode: str
    updated_at: datetime | None


class BotCaseCreate(BaseModel):
    case_id: str


class BotCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    created_at: datetime


class RecruitmentCuratorCreate(BaseModel):
    curator_id: str


class RecruitmentCuratorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime


class InterviewCreate(BaseModel):
    tg_user_id: int
    case_id: str
    team_name: str
    date_time: datetime
    curator_user_id: str | None = None


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tg_user_id: int
    case_id: str
    team_name: str
    date_time: datetime | None
    created_at: datetime
    curator_user_id: str | None
    outlook_event_id: str | None
    end_at: datetime | None


class InterviewSlotResponse(BaseModel):
    start_at: datetime
    end_at: datetime
    curator_user_id: str
