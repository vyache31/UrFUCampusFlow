from datetime import datetime
from typing import Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field

from presentation.api.schemas.difficulty_level import DifficultyLevelCode


class AIMessage(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


class AIAssistantMessage(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: Literal["assistant"]
    content: str = Field(min_length=1)


class AICompletionChoice(BaseModel):
    message: AIAssistantMessage
    finish_reason: Literal["stop"]


class AICompletionResponse(BaseModel):
    choices: list[AICompletionChoice] = Field(min_length=1)


class AIGenerateCaseRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    topic: str = Field(min_length=1, max_length=2000)


class AIGeneratedCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    project_description: str
    project_idea: str
    technical_details: str
    difficulty: DifficultyLevelCode


class AICaseDraft(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

    title: str | None = Field(min_length=1, max_length=100)
    short_title: str | None = Field(min_length=1, max_length=50)
    project_goals: str | None = Field(min_length=1, max_length=2000)
    required_result: str | None = Field(min_length=1, max_length=1000)
    grade_criteria: str | None = Field(min_length=1, max_length=2000)


class AIChatCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=200)


class AIChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: datetime
    updated_at: datetime | None
    draft: AICaseDraft | None = None


class AIMessageCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    content: str = Field(min_length=1, max_length=8000)


class AIMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    chat_id: str
    position: int
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class AIChatReplyResponse(BaseModel):
    message: AIMessageResponse
    draft: AICaseDraft


class AIChatGenerationResult(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)

    reply: str = Field(min_length=1)
    draft: AICaseDraft
