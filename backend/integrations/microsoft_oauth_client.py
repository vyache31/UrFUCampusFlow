import urllib.parse
import httpx
from config import settings


class OAuthClient:

    def __init__(self, session: httpx.AsyncClient):
        self.session = session


    @staticmethod
    def generate_microsoft_oauth_redirect_uri(state: str):
        query_params = {
            'tenant': 'common',
            'client_id': settings.OAUTH_MICROSOFT_CLIENT_ID,
            'response_type': 'code',
            'redirect_uri': settings.OAUTH_MICROSOFT_REDIRECT_URL,
            'scope': " ".join([
                'offline_access',
                'openid',
                'Calendars.ReadWrite',
                'email',
                'User.Read',
            ]),
            'state': state
        }

        params_string = urllib.parse.urlencode(query_params, quote_via=urllib.parse.quote)

        return f'{settings.OAUTH_MICROSOFT_AUTH_BASE_URL}?{params_string}'


    async def exchange_code_for_token(self, code: str):
        query_params = {
            'tenant': 'common',
            'client_id': settings.OAUTH_MICROSOFT_CLIENT_ID,
            'grant_type': 'authorization_code',
            'scope': " ".join([
                'offline_access',
                'openid',
                'Calendars.ReadWrite',
                'email',
                'User.Read',
            ]),
            'code': code,
            'redirect_uri': settings.OAUTH_MICROSOFT_REDIRECT_URL,
            'client_secret': settings.OAUTH_MICROSOFT_CLIENT_SECRET
        }


        payload = await self.session.post(url=settings.OAUTH_MICROSOFT_TOKEN_URL, data=query_params)

        if payload.status_code == 200:
            return payload.json()

        return payload.raise_for_status()


    async def refresh_tokens(self, refresh_token: str):
        params = {
            'tenant': 'common',
            'client_id': settings.OAUTH_MICROSOFT_CLIENT_ID,
            'grant_type': 'refresh_token',
            'scope': " ".join([
                'offline_access',
                'openid',
                'Calendars.ReadWrite',
                'email',
                'User.Read',
            ]),
            'refresh_token': refresh_token,
            'client_secret': settings.OAUTH_MICROSOFT_CLIENT_SECRET
        }

        payload = await self.session.post(url=settings.OAUTH_MICROSOFT_TOKEN_URL, data=params)

        if payload.status_code == 200:
            return payload.json()

        return payload.raise_for_status()
