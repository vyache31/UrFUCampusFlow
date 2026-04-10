from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

Base = declarative_base()
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = async_sessionmaker(autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session
