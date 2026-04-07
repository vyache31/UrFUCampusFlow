from fastapi import FastAPI
from api.v1.endpoints import user, team

app = FastAPI()

app.include_router(user.router)
app.include_router(team.router)
