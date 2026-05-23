from services.ai_service import AIService
from integrations.ai.case_ai_client import AIClient
from fastapi import Depends
from dependies.http_client_dependency import get_graph_client
import httpx


def get_ai_client(
        session: httpx.AsyncClient = Depends(get_graph_client)
):
    return AIClient(session)

def get_ai_service(
        ai_client: AIClient = Depends(get_ai_client)
):
    return AIService(ai_client)
