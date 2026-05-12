from integrations.microsoft_oauth_client import OAuthClient
from integrations.microsoft_graph_client import GraphClient
from repositories.microsoft_oauth_repository import MicrosoftOAuthRepository
from schemas.microsoft_oauth import ConnectResponse, OAuthCallbackResponse, OAuthStatusResponse
from models import MicrosoftOAuth
from datetime import datetime, timedelta, UTC
from utils import encryption
import uuid
import redis.asyncio as aioredis
import json


class MicrosoftOAuthService:

    def __init__(
            self, rep: MicrosoftOAuthRepository,
            oauth_client: OAuthClient,
            graph_client: GraphClient,
            redis_session: aioredis.Redis
        ):

        self.rep = rep
        self.oauth_client = oauth_client
        self.graph_client = graph_client
        self.redis = redis_session


    async def start_connection(self, user_id: str) -> ConnectResponse:
        state = await self.create_state(user_id)

        uri = self.oauth_client.generate_microsoft_oauth_redirect_uri(state)

        return ConnectResponse(authorize_url=uri)


    async def create_state(self, user_id: str) -> str:
        state_key = str(uuid.uuid4())
        state = await self.redis.setex(
            f'{state_key}',
            600,
            json.dumps({
                'user_id': user_id,
                'provider': 'microsoft'
            })
        )

        return state_key


    async def consume_state(self, state_input: str) -> dict | RuntimeError:
        data = await self.redis.getdel(state_input)

        if data is None:
            return None

        return data


    async def update_oauth(
            self,
            oauth: MicrosoftOAuth,
            token_payload: dict,
            user_info: dict,
            time: datetime | None = None
    ) -> None:
        if time is None:
            time = datetime.now(UTC)

        oauth.encrypted_access_token = encryption.encrypt_token(token_payload['access_token'])
        oauth.encrypted_refresh_token = encryption.encrypt_token(token_payload['refresh_token'])
        oauth.scope = token_payload['scope']
        oauth.microsoft_email = user_info['mail'] if user_info['mail'] else None
        oauth.connected_at = time
        oauth.updated_at = time
        oauth.is_active = True
        oauth.access_token_expires_at = time + timedelta(seconds=token_payload['expires_in'])
        oauth.provider_user_id = user_info['id']


        await self.rep.update_oauth(oauth)


    async def handle_callback(self, user_id: str, code: str) -> OAuthCallbackResponse:
        token_payload = await self.oauth_client.exchange_code_for_token(code)

        headers = {
            "Authorization": f"Bearer {token_payload['access_token']}"
        }

        user_info = await self.graph_client.get_provider_user_info(headers=headers)
        provider_oauth = await self.rep.get_oauth_by_provider_user_id(user_info['id'])

        if oauth := await self.rep.get_oauth_by_user_id(user_id):
            if oauth.is_active:
                raise ValueError('This user already has an active connection')
            if provider_oauth and provider_oauth.user_id != user_id:
                raise ValueError('This connection already exists')
            await self.update_oauth(
                oauth=oauth,
                token_payload=token_payload,
                user_info=user_info
            )

            return OAuthCallbackResponse(
                id=oauth.id,
                user_id=oauth.user_id,
                microsoft_email=oauth.microsoft_email,
                scope=oauth.scope,
                connected_at=oauth.connected_at,
                last_refreshed_at=oauth.last_refreshed_at,
                is_active=oauth.is_active
            )

        if provider_oauth:
            raise ValueError('This connection already exists')

        creating_time = datetime.now(UTC)

        oauth_object = MicrosoftOAuth(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider_user_id=user_info['id'],
            microsoft_email=user_info['mail'] if user_info['mail'] else None,
            encrypted_refresh_token=encryption.encrypt_token(token_payload['refresh_token']),
            encrypted_access_token=encryption.encrypt_token(token_payload['access_token']),
            access_token_expires_at=creating_time + timedelta(seconds=token_payload['expires_in']),
            scope=token_payload['scope'],
            connected_at=creating_time,
            is_active=True,
        )

        created_object = await self.rep.create_oauth(oauth_object)

        return OAuthCallbackResponse(
            id=created_object.id,
            user_id=created_object.user_id,
            microsoft_email=created_object.microsoft_email,
            scope=created_object.scope,
            connected_at=created_object.connected_at,
            last_refreshed_at=created_object.last_refreshed_at,
            is_active=created_object.is_active
        )


    async def get_status(self, user_id: str) -> OAuthStatusResponse:
        oauth = await self.rep.get_oauth_by_user_id(user_id)

        if not oauth:
            raise ValueError('This user has not existing connections')

        return OAuthStatusResponse(
            is_active=oauth.is_active
        )


    async def disconnect_oauth(self, user_id: str) -> OAuthStatusResponse:
        oauth = await self.rep.get_oauth_by_user_id(user_id)

        if not oauth:
            raise ValueError('This user has not existing connections')

        oauth.is_active = False
        oauth.updated_at = datetime.now(UTC)

        await self.rep.update_oauth(oauth)

        return OAuthStatusResponse(
            is_active=oauth.is_active
        )


    async def refresh_tokens(self, oauth: MicrosoftOAuth, time: datetime | None = None) -> MicrosoftOAuth:

        if time is None:
            time = datetime.now(UTC)

        token_payload = await self.oauth_client.refresh_tokens(
            refresh_token= encryption.decrypt_token(oauth.encrypted_refresh_token)
        )

        oauth.encrypted_refresh_token = encryption.encrypt_token(token_payload['refresh_token'])
        oauth.encrypted_access_token = encryption.encrypt_token(token_payload['access_token'])
        oauth.last_refreshed_at = time
        oauth.access_token_expires_at = time + timedelta(seconds=token_payload['expires_in'])
        oauth.updated_at = time

        await self.rep.update_oauth(oauth)

        return oauth


    async def ensure_actual_tokens(self, oauth: MicrosoftOAuth) -> MicrosoftOAuth:

        if oauth.access_token_expires_at <= datetime.now(UTC) + timedelta(minutes=3):
            await self.refresh_tokens(oauth)

        return oauth
