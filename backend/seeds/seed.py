import asyncio
import uuid

import logging

from models import Roles
from models import CaseStatuses, DifficultyLevels
from models import Iterations
from database import SessionLocal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from seeds.data import CASE_DIFFICULTY_LEVELS, CASE_STATUSES, ROLES, ITERATIONS
from datetime import datetime, timezone
from auth.utils_jwt import hash_password

print("LOADED FILE:", __file__)
logging.basicConfig(level=logging.INFO)
async def seed_dictionary(
        session: AsyncSession,
        model,
        items: list[dict]
) -> None:

    for item in items:
        existing_object = await session.scalar(
            select(model).where(model.code == item['code'])
        )

        if not existing_object:
            session.add(
                model(**item)
            )
            continue

        for key, value in item.items():
            setattr(existing_object, key, value)


async def seed_all_references() -> None:
    print("FUNCTION ENTERED")
    try:
        async with SessionLocal() as session:
            print("SEED START")

            await seed_dictionary(session, CaseStatuses, CASE_STATUSES)
            print("statuses ok")

            await seed_dictionary(session, DifficultyLevels, CASE_DIFFICULTY_LEVELS)
            print("difficulty ok")

            await seed_dictionary(session, Iterations, ITERATIONS)
            print("iterations ok")

            await seed_dictionary(session, Roles, ROLES)
            print("roles ok")

            await seed_user(session)
            print("user ok")

            await seed_bot_mode(session)
            print("bot_mode ok")

            await seed_uni(session)
            print("uni ok")

            await session.commit()
            print("COMMIT DONE")

    except Exception as e:
        print("SEED FAILED:", e)
        raise

async def seed_user(session: AsyncSession):
    from models import Users

    existing_user = await session.scalar(
        select(Users).where(Users.email == "test@alfa.ru")
    )

    if existing_user:
        print("USER ALREADY EXISTS → SKIP")
        return

    test_user = Users(
        id=str(uuid.uuid4()),
        email="test@alfa.ru",
        role_id=1,
        password_hash=hash_password("password").decode('utf-8'),
        created_at=datetime.now(timezone.utc),
    )
    curator_user = Users(
        id=str(uuid.uuid4()),
        email="curator@alfa.ru",
        role_id=3,
        password_hash=hash_password("password").decode('utf-8'),
        created_at=datetime.now(timezone.utc),
    )
    print("ADDING USERS")
    session.add(test_user)
    session.add(curator_user)
    await session.flush()
    print("FLUSH DONE")

async def seed_bot_mode(session: AsyncSession):
    print("BOTMODE SEED START")
    from tg_bot.models.bot import BotMode
    existing_user = await session.scalar(
        select(BotMode)
    )

    if existing_user:
        print("BOTMODE ALREADY EXISTS → SKIP")
        return

    bot_mode = BotMode(
        id = 1,
        mode = 'stop',
        updated_at = datetime.now(timezone.utc),
    )

    print("ADDING BOTMODE")
    session.add(bot_mode)
    await session.flush()
    print("BOTMODE FLUSH DONE")

async def seed_uni(session: AsyncSession):
    print("UNI SEED START")
    from models import Universities
    existing_uni = await session.scalar(
        select(Universities).where(Universities.id == 1)
    )

    if existing_uni:
        print("UNI ALREADY EXISTS → SKIP")
        return

    uni = Universities(
        uni_name = 'УрФУ',
        contact_email = 'mock_urfu@urfu.me'
    )

    print("UNI BOTMODE")
    session.add(uni)
    await session.flush()
    print("UNI FLUSH DONE")

if __name__ == "__main__":
    asyncio.run(seed_all_references())
