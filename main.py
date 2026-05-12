from fastapi import FastAPI
from contextlib import asynccontextmanager
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
    auth,
    microsoft_oauth
)
import httpx
import redis.asyncio as aioredis
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_client = httpx.AsyncClient(timeout=30)
    app.state.redis = aioredis.from_url(
        url=settings.REDIS_URL,
        decode_responses=True
    )
    try:
        yield
    finally:
        await app.state.http_client.aclose()
        await app.state.redis.aclose()


app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(team.router)
app.include_router(case.router)
app.include_router(student.router)
app.include_router(university.router)
app.include_router(role.router)
app.include_router(case_status.router)
app.include_router(difficulty_level.router)
app.include_router(iteration.router)
app.include_router(microsoft_oauth.router)
