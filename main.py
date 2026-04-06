from fastapi import FastAPI
from api.v1.endpoints import user, case, student

app = FastAPI()

app.include_router(user.router)
app.include_router(case.router)
app.include_router(student.router)