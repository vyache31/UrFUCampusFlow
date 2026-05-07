from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class CaseResponse(BaseModel):
    id: str
    title: str = None
    difficulty_level_id: int
    difficulty_level_name: Optional[str] = None
    project_goals: Optional[str] = None
    required_result: Optional[str] = None
    grade_criteria: Optional[str] = None
    study_program: Optional[str] = None
    university_id: int
    university_name: str = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status_id: int
    status_name: Optional[str] = None
    creator_id: str
    creator_email: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CaseCreate(BaseModel):
    title: str
    difficulty_level_id: int = None
    project_goals: Optional[str] = None
    required_result: Optional[str] = None
    grade_criteria: Optional[str] = None
    creator_id: str
    study_program: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    university_id: Optional[int] = None
    status_id: Optional[int] = None


class CaseUpdate(BaseModel):
    title: str = None
    project_goals: Optional[str] = None
    required_result: Optional[str] = None
    grade_criteria: Optional[str] = None
    study_program: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    difficulty_level_id: Optional[int] = None
    university_id: Optional[int] = None
