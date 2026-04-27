import httpx
from fastapi import Request, Depends


def get_http_session(request: Request) -> httpx.AsyncClient:
    session = getattr(request.app.state, 'http_client', None)
    if session is None:
        raise RuntimeError('HTTP client is not initialized')
    return session


def get_graph_client(
        client: httpx.AsyncClient = Depends(get_http_session)
) -> httpx.AsyncClient:
    return client
