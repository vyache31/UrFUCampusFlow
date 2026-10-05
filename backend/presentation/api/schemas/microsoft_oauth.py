from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class ConnectResponse(BaseModel):
    authorize_url: str


class OAuthCallbackResponse(BaseModel):
    id: str
    user_id: str
    microsoft_email: Optional[str] = None
    scope: str
    connected_at: datetime
    last_refreshed_at: Optional[datetime] = None
    is_active: bool


class OAuthStatusResponse(BaseModel):
    is_active: bool


