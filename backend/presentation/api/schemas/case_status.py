from pydantic import BaseModel
from typing import Optional


class CaseStatusCreate(BaseModel):
    code: str
    status_name: str


class CaseStatusUpdate(BaseModel):
    code: Optional[str] = None
    status_name: Optional[str] = None


class CaseStatusResponse(BaseModel):
    id: int
    code: str
    status_name: str

    class Config:
        from_attributes = True
