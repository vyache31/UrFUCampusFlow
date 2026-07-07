from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ReactionType(str, Enum):
    like = "LIKE"
    dislike = "DISLIKE"


class EvaluationFormResponse(BaseModel):
    id: str
    case_id: str
    creator_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class EvaluationReactionCreate(BaseModel):
    evaluation_form_id: str
    reaction: ReactionType


class EvaluationReactionUpdate(BaseModel):
    reaction: Optional[ReactionType] = None


class EvaluationReactionResponse(BaseModel):
    id: str
    evaluation_form_id: str
    user_id: str
    reaction: ReactionType
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvaluationCommentCreate(BaseModel):
    evaluation_form_id: str
    comment_text: str


class EvaluationCommentUpdate(BaseModel):
    comment_text: Optional[str] = None


class EvaluationCommentResponse(BaseModel):
    id: str
    evaluation_form_id: str
    user_id: str
    comment_text: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EvaluationCommentWs(BaseModel):
    id: str
    evaluation_form_id: str
    user_id: str
    user_email: str
    comment_text: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class LikesUpdatedWs(BaseModel):
    evaluation_form_id: str
    reactions_count: int
    user_id: str
    reaction: ReactionType

