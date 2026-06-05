from datetime import datetime
from pydantic import BaseModel


class BotModeUpdate(BaseModel):
    mode: str


class BotModeResponse(BaseModel):
    mode: str
    updated_at: datetime


class BotCaseCreate(BaseModel):
    case_id: str

class RecruitmentCuratorCreate(BaseModel):
    curator_id: str


class InterviewCreate(BaseModel):
    tg_user_id: int
    case_id: str
    team_name: str
    date_time: datetime