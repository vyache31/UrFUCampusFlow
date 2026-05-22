from pydantic import BaseModel
from typing import Optional


class UniversityCreate(BaseModel):
    uni_name: str
    contact_email: str


class UniversityResponse(BaseModel):
    id: int
    uni_name: str
    contact_email: str

    class Config:
        from_attributes = True


class UniversityUpdate(BaseModel):
    uni_name: Optional[str] = None
    contact_email: Optional[str] = None
