from fastapi import APIRouter
from integrations.microsoft_oauth_client import OAuthClient


router = APIRouter(prefix='/auth/microsoft')


@router.get('/outlook')
def get_microsoft_oauth_redirect_uri():
    uri = OAuthClient.generate_microsoft_oauth_redirect_uri()

    return uri
