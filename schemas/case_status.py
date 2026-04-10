from pydantic import BaseModel
from typing import Optional


class CaseStatusCreate(BaseModel):
    status_code: str
    status_name: str


class CaseStatusUpdate(BaseModel):
    status_code: Optional[str] = None
    status_name: Optional[str] = None


class CaseStatusResponse(BaseModel):
    id: int
    status_code: str
    status_name: str

    class Config:
        from_attributes = True
