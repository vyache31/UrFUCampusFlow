from pydantic import BaseModel
from typing import Optional


class IterationCreate(BaseModel):
    code: str
    iteration_name: str


class IterationUpdate(BaseModel):
    code: Optional[str] = None
    iteration_name: Optional[str] = None


class IterationResponse(BaseModel):
    id: int
    code: str
    iteration_name: str

    class Config:
        from_attributes = True
