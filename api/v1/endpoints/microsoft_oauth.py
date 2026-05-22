from fastapi import APIRouter, Depends, Query, HTTPException
from services.microsoft_oauth_service import MicrosoftOAuthService
from schemas.microsoft_oauth import ConnectResponse, OAuthCallbackResponse, OAuthStatusResponse
from dependies.oauth_depends import get_oauth_service
from dependies.auth_depends import get_current_auth_user
from models.auth import Users


router = APIRouter(
    prefix='/auth/microsoft',
    tags=['Microsoft OAuth']
)


@router.get('/outlook', response_model=ConnectResponse)
async def get_microsoft_oauth_redirect_uri(
        service: MicrosoftOAuthService = Depends(get_oauth_service)
):

    return await service.start_connection()


@router.get('/outlook/callback', response_model=OAuthCallbackResponse)
async def outlook_callback(
        user: Users = Depends(get_current_auth_user),
        service: MicrosoftOAuthService = Depends(get_oauth_service),
        code: str | None = Query(default=None),
        error: str | None = Query(default=None)
):
    if error:
        raise HTTPException(status_code=400, detail=f'Microsoft OAuth error: {error}')

    if code is None:
        raise HTTPException(status_code=400, detail='Authorization code is missing')

    try:
        oauth_object_shema = await service.handle_callback(
            user_id=user.id,
            code=code
        )

        return oauth_object_shema

    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))


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
