from fastapi import APIRouter, Depends
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from infrastructure.container import ws_manager


router = APIRouter(
prefix='',
    tags = ['WebSocket']
)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass

    finally:
         ws_manager.disconnect(websocket)
