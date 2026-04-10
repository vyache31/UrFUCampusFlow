from pydantic import BaseModel
from typing import Optional


class DifficultyLevelCreate(BaseModel):
    level_code: str
    level_name: str


class DifficultyLevelUpdate(BaseModel):
    level_code: Optional[str] = None
    level_name: Optional[str] = None


class DifficultyLevelResponse(BaseModel):
    id: int
    level_code: str
    level_name: str

    class Config:
        from_attributes = True
