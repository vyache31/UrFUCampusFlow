from fastapi import FastAPI

from api.v1.endpoints import (
    user,
    case,
    student,
    team,
    university,
    role,
    case_status,
    difficulty_level,
    iteration,
)

app = FastAPI()

app.include_router(user.router)
app.include_router(team.router)
app.include_router(case.router)
app.include_router(student.router)
app.include_router(university.router)
app.include_router(role.router)
app.include_router(case_status.router)
app.include_router(difficulty_level.router)
app.include_router(iteration.router)
