from fastapi import APIRouter, Depends
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from infrastructure.container import ws_manager
from dependies.auth_depends import get_current_websocket_user
from models.auth import Users


router = APIRouter(
prefix='',
    tags = ['WebSocket']
)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user: Users = Depends(get_current_websocket_user)
):
    await ws_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

    finally:
         ws_manager.disconnect(websocket)
