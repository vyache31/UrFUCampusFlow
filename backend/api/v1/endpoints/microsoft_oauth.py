from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from services.microsoft_oauth_service import MicrosoftOAuthService
from schemas.microsoft_oauth import ConnectResponse, OAuthStatusResponse
from dependies.oauth_depends import get_oauth_service
from dependies.auth_depends import get_current_auth_user
from models.auth import Users
from config import settings
from urllib.parse import urlencode


router = APIRouter(
    prefix='/auth/microsoft',
    tags=['Microsoft OAuth']
)


def get_frontend_redirect_url(**params: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}?{urlencode(params)}"


def redirect_to_frontend(**params: str) -> RedirectResponse:
    return RedirectResponse(
        url=get_frontend_redirect_url(**params),
        status_code=302
    )


@router.get('/outlook', response_model=ConnectResponse)
async def get_microsoft_oauth_redirect_uri(
        service: MicrosoftOAuthService = Depends(get_oauth_service),
        user: Users = Depends(get_current_auth_user)
):

    return await service.start_connection(user.id)


@router.get('/outlook/callback')
async def outlook_callback(
        service: MicrosoftOAuthService = Depends(get_oauth_service),
        code: str | None = Query(default=None),
        error: str | None = Query(default=None),
        state: str | None = Query(default=None)
):
    if error:
        return redirect_to_frontend(outlook_error=error)

    if code is None:
        return redirect_to_frontend(outlook_error='missing_code')

    if state is None:
        return redirect_to_frontend(outlook_error='missing_state')

    data = await service.consume_state(state)

    if data is None:
        return redirect_to_frontend(outlook_error='invalid_or_expired_state')

    if 'user_id' not in data:
        return redirect_to_frontend(outlook_error='invalid_state_payload')

    try:
        await service.handle_callback(
            user_id=data['user_id'],
            code=code
        )

        return redirect_to_frontend(outlook='connected')

    except ValueError as err:
        return redirect_to_frontend(outlook_error=str(err))


@router.delete('/outlook/disconnect', response_model=OAuthStatusResponse)
async def disconnect_outlook(
        user: Users = Depends(get_current_auth_user),
        service: MicrosoftOAuthService = Depends(get_oauth_service),
):
    try:
        return await service.disconnect_oauth(user.id)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.get('/outlook/integration-status', response_model=OAuthStatusResponse)
async def get_integration_status(
        user: Users = Depends(get_current_auth_user),
        service: MicrosoftOAuthService = Depends(get_oauth_service),
):
    try:
        return await service.get_status(user.id)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
