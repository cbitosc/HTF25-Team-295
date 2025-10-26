# app/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import datetime
import asyncio

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.room_users: Dict[str, List[str]] = {}  # Track users in each room

    async def connect(self, websocket: WebSocket, room_id: str, username: str = None):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            self.room_users[room_id] = []
        
        self.active_connections[room_id].append(websocket)
        
        # Add user to room if username provided and not Anonymous
        if username and username != "Anonymous" and username not in self.room_users[room_id]:
            self.room_users[room_id].append(username)
            print(f"👤 Added user {username} to room {room_id}. Online users: {self.room_users[room_id]}")
            # Broadcast user joined
            await self.broadcast_to_room({
                "type": "user_joined",
                "username": username,
                "online_users": self.room_users[room_id],
                "timestamp": datetime.datetime.now().isoformat()
            }, room_id)
        elif username and username != "Anonymous":
            print(f"👤 User {username} already in room {room_id}. Online users: {self.room_users[room_id]}")
            # Still send current online users to the new connection
            await websocket.send_text(json.dumps({
                "type": "online_users",
                "online_users": self.room_users[room_id],
                "timestamp": datetime.datetime.now().isoformat()
            }))

    def disconnect(self, websocket: WebSocket, room_id: str, username: str = None):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            
            # Remove user from room if username provided and not Anonymous
            if username and username != "Anonymous" and username in self.room_users[room_id]:
                self.room_users[room_id].remove(username)
                print(f"👤 Removed user {username} from room {room_id}. Online users: {self.room_users[room_id]}")
                # Broadcast user left
                asyncio.create_task(self.broadcast_to_room({
                    "type": "user_left",
                    "username": username,
                    "online_users": self.room_users[room_id],
                    "timestamp": datetime.datetime.now().isoformat()
                }, room_id))
            
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                if room_id in self.room_users:
                    del self.room_users[room_id]

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Remove broken connections
                    self.active_connections[room_id].remove(connection)

manager = ConnectionManager()

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    # Get username from query parameters
    username = websocket.query_params.get("username", "Anonymous")
    print(f"🔌 WebSocket connection: room={room_id}, username={username}")
    
    await manager.connect(websocket, room_id, username)
    
    # Only send welcome message if username is not Anonymous
    if username and username != "Anonymous":
        await manager.broadcast_to_room({
            "type": "system",
            "message": f"📢 {username} joined room {room_id}",
            "timestamp": datetime.datetime.now().isoformat()
        }, room_id)

    try:
        while True:
            data = await websocket.receive_text()
            
            # Parse JSON message with username
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type", "chat")
                message_username = message_data.get("username", username)
                
                if message_type == "typing":
                    # Broadcast typing indicator
                    await manager.broadcast_to_room({
                        "type": "typing",
                        "username": message_username
                    }, room_id)
                elif message_type == "stop_typing":
                    # Broadcast stop typing indicator
                    await manager.broadcast_to_room({
                        "type": "stop_typing",
                        "username": message_username
                    }, room_id)
                else:
                    # Regular chat message
                    message_content = message_data.get("message", "")
                    await manager.broadcast_to_room({
                        "type": "chat",
                        "username": message_username,
                        "message": message_content,
                        "timestamp": datetime.datetime.now().isoformat()
                    }, room_id)
                
            except json.JSONDecodeError:
                # If plain text, use as anonymous message
                await manager.broadcast_to_room({
                    "type": "chat",
                    "username": username,
                    "message": data,
                    "timestamp": datetime.datetime.now().isoformat()
                }, room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, username)
        # Only send leave message if username is not Anonymous
        if username and username != "Anonymous":
            await manager.broadcast_to_room({
                "type": "system",
                "message": f"❌ {username} left room {room_id}",
                "timestamp": datetime.datetime.now().isoformat()
            }, room_id)