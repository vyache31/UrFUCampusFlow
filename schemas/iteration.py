from pydantic import BaseModel
from typing import Optional


class IterationCreate(BaseModel):
    iteration_name: str


class IterationUpdate(BaseModel):
    iteration_name: Optional[str] = None


class IterationResponse(BaseModel):
    id: int
    iteration_name: str

    class Config:
        from_attributes = True
