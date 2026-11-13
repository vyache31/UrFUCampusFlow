from typing import Literal

from pydantic import BaseModel, Field

from application.schemas.ai import AIAssistantMessage


class AICompletionChoice(BaseModel):
    message: AIAssistantMessage
    finish_reason: Literal["stop"]


class AICompletionResponse(BaseModel):
    choices: list[AICompletionChoice] = Field(min_length=1)
