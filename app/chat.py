# app/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    
    # Send welcome message
    await manager.broadcast_to_room({
        "type": "system",
        "message": f"📢 A new user joined room {room_id}",
        "timestamp": datetime.datetime.now().isoformat()
    }, room_id)

    try:
        while True:
            data = await websocket.receive_text()
            
            # Parse JSON message with username
            try:
                message_data = json.loads(data)
                username = message_data.get("username", "Anonymous")
                message_content = message_data.get("message", "")
                
                # Broadcast chat message
                await manager.broadcast_to_room({
                    "type": "chat",
                    "username": username,
                    "message": message_content,
                    "timestamp": datetime.datetime.now().isoformat()
                }, room_id)
                
            except json.JSONDecodeError:
                # If plain text, use as anonymous message
                await manager.broadcast_to_room({
                    "type": "chat",
                    "username": "Anonymous",
                    "message": data,
                    "timestamp": datetime.datetime.now().isoformat()
                }, room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast_to_room({
            "type": "system",
            "message": f"❌ A user left room {room_id}",
            "timestamp": datetime.datetime.now().isoformat()
        }, room_id)