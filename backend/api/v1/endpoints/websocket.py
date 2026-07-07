from fastapi import APIRouter, Depends
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from infrastructure.container import ws_manager


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)