from pydantic import BaseModel
from typing import Optional
from enum import Enum

class DifficultyLevelCode(str, Enum):
    easy = 'EASY'
    medium = 'MEDIUM'
    hard = 'HARD'

class DifficultyLevelCreate(BaseModel):
    code: DifficultyLevelCode
    level_name: str


class DifficultyLevelUpdate(BaseModel):
    code: Optional[DifficultyLevelCode] = None
    level_name: Optional[str] = None


class DifficultyLevelResponse(BaseModel):
    id: int
    code: DifficultyLevelCode
    level_name: str

    class Config:
        from_attributes = True
