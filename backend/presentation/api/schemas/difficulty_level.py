from pydantic import BaseModel
from typing import Optional


class DifficultyLevelCreate(BaseModel):
    code: str
    level_name: str


class DifficultyLevelUpdate(BaseModel):
    code: Optional[str] = None
    level_name: Optional[str] = None


class DifficultyLevelResponse(BaseModel):
    id: int
    code: str
    level_name: str

    class Config:
        from_attributes = True
