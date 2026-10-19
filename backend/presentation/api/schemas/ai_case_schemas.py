from pydantic import BaseModel, ConfigDict, Field

from presentation.api.schemas.difficulty_level import DifficultyLevelCode


class AIGenerateCaseRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    topic: str = Field(min_length=1, max_length=2000)


class AIGeneratedCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    project_description: str
    project_idea: str
    technical_details: str
    difficulty: DifficultyLevelCode
