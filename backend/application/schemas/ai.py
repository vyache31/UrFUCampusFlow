from typing import Literal, TypedDict

from pydantic import BaseModel, ConfigDict, Field


class AIMessage(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


class AIAssistantMessage(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: Literal["assistant"]
    content: str = Field(min_length=1)
