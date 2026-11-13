from fastapi import APIRouter, Depends, Query, Response, status

from application.services.ai_chat_service import AIChatService
from presentation.api.dependencies.ai_chat_depends import get_ai_chat_service
from presentation.api.dependencies.auth_depends import get_current_auth_user
from presentation.api.schemas.ai import (
    AIChatCreate,
    AIChatResponse,
    AIMessageCreate,
    AIMessageResponse,
)


router = APIRouter(
    prefix='/ai/chats',
    tags=['AI chats'],
)


@router.post('/', response_model=AIChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    schema: AIChatCreate,
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.create_chat(schema=schema, user_id=user.id)


@router.get('/', response_model=list[AIChatResponse])
async def get_chats(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.get_chats(user_id=user.id, limit=limit, offset=offset)


@router.get('/{chat_id}', response_model=AIChatResponse)
async def get_chat(
    chat_id: str,
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.get_chat(chat_id=chat_id, user_id=user.id)


@router.get('/{chat_id}/messages', response_model=list[AIMessageResponse])
async def get_messages(
    chat_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.get_messages(
        chat_id=chat_id,
        user_id=user.id,
        limit=limit,
        offset=offset,
    )


@router.post(
    '/{chat_id}/messages',
    response_model=AIMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    chat_id: str,
    schema: AIMessageCreate,
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.send_message(chat_id=chat_id, user_id=user.id, schema=schema)


@router.post('/{chat_id}/retry', response_model=AIMessageResponse)
async def retry_reply(
    chat_id: str,
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
):
    return await service.retry_reply(chat_id=chat_id, user_id=user.id)


@router.delete('/{chat_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    user=Depends(get_current_auth_user),
    service: AIChatService = Depends(get_ai_chat_service),
) -> Response:
    await service.delete_chat(chat_id=chat_id, user_id=user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
