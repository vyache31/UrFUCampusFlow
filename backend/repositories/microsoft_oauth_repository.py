from models import MicrosoftOAuth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class MicrosoftOAuthRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def create_oauth(self, oauth: MicrosoftOAuth) -> MicrosoftOAuth:
        self.db.add(oauth)

        await self.db.commit()
        await self.db.refresh(oauth)

        return oauth


    async def get_oauth_by_id(self, oauth_id: str) -> MicrosoftOAuth:
        oauth = await self.db.execute(
            select(MicrosoftOAuth)
            .where(MicrosoftOAuth.id == oauth_id)
        )

        return oauth.scalar_one_or_none()


    async def get_oauth_by_user_id(self, user_id: str):
        oauth = await self.db.execute(
            select(MicrosoftOAuth)
            .where(MicrosoftOAuth.user_id == user_id)
        )

        return oauth.scalar_one_or_none()


    async def update_oauth(self, oauth: MicrosoftOAuth) -> None:
        await self.db.commit()
        await self.db.refresh(oauth)


    async def delete_oauth(self, oauth: MicrosoftOAuth) -> None:
        await self.db.delete(oauth)
        await self.db.commit()


    async def get_oauth_by_provider_user_id(self, provider_user_id: str):
        oauth = await self.db.execute(
            select(MicrosoftOAuth)
            .where(MicrosoftOAuth.provider_user_id == provider_user_id)
        )

        return oauth.scalar_one_or_none()
