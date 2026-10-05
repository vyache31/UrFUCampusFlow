from pydantic import BaseModel


class AIGeneratedCaseResponse(BaseModel):
    project_description: str
    project_idea: str
    technical_details: str
    difficulty: str

    class Config:
        from_attributes = True
