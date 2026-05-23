from pydantic import BaseModel
from typing import Optional


class RoleCreate(BaseModel):
    code: str
    role_name: str


class RoleUpdate(BaseModel):
    code: Optional[str] = None
    role_name: Optional[str] = None


class RoleResponse(BaseModel):
    id: int
    code: str
    role_name: str

    class Config:
        from_attributes = True
