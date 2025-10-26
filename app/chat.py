# app/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import datetime
import asyncio
import re
from app.database import get_db
from app import models

router = APIRouter(prefix="/chat", tags=["Chat"])

def extract_mentions(message: str) -> List[str]:
    """Extract @mentions from message text."""
    pattern = r'@(\w+)'
    mentions = re.findall(pattern, message)
    return list(set(mentions))  # Return unique mentions

def save_message_to_db(db: Session, message_data: dict, room_id: str):
    """Save message to database."""
    try:
        # Get or create user
        user = db.query(models.User).filter(models.User.username == message_data.get("username")).first()
        if not user:
            # Create user if doesn't exist
            user = models.User(username=message_data.get("username"), password_hash="", is_admin=0)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Get or create room
        room = db.query(models.Room).filter(models.Room.name == room_id).first()
        if not room:
            room = models.Room(name=room_id, admin_username=None)
            db.add(room)
            db.commit()
            db.refresh(room)
        
        # Create message
        msg = models.Message(
            room_id=room.id,
            user_id=user.id,
            content=message_data.get("message", ""),
            file_url=message_data.get("file_url"),
            filename=message_data.get("filename"),
            file_type=message_data.get("file_type"),
            file_size=message_data.get("file_size"),
            mentioned_users=",".join(message_data.get("mentions", [])) if message_data.get("mentions") else None
        )
        db.add(msg)
        db.commit()
        return msg
    except Exception as e:
        print(f"Error saving message: {e}")
        db.rollback()
        return None

def get_or_create_room(db: Session, room_name: str, first_username: str = None):
    """Get or create room, set first user as admin."""
    room = db.query(models.Room).filter(models.Room.name == room_name).first()
    if not room:
        # Create room and set first user as admin
        room = models.Room(name=room_name, admin_username=first_username if first_username else None)
        db.add(room)
        db.commit()
        db.refresh(room)
    return room

def is_user_muted(db: Session, room_id: int, username: str):
    """Check if user is muted in the room."""
    muted = db.query(models.MutedUser).filter(
        models.MutedUser.room_id == room_id,
        models.MutedUser.username == username
    ).first()
    return muted is not None

def is_room_admin(db: Session, room_name: str, username: str):
    """Check if user is admin of the room."""
    room = db.query(models.Room).filter(models.Room.name == room_name).first()
    if not room:
        return False
    return room.admin_username == username

def get_chat_history_sync(room_name: str, db: Session):
    """Synchronous version of get_chat_history for use in executor."""
    try:
        room = db.query(models.Room).filter(models.Room.name == room_name).first()
        if not room:
            return {"messages": []}
        
        messages = db.query(models.Message).filter(
            models.Message.room_id == room.id,
            models.Message.is_deleted == 0
        ).order_by(models.Message.timestamp.asc()).all()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "username": msg.user.username if msg.user else "Unknown",
                "message": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "file_url": msg.file_url,
                "filename": msg.filename,
                "file_type": msg.file_type,
                "file_size": msg.file_size,
                "mentions": msg.mentioned_users.split(",") if msg.mentioned_users else [],
                "type": "chat"
            })
        
        return {"messages": result}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"messages": []}

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
    
    # Check if this is the first user in the room
    db = next(get_db())
    is_first_user = False
    is_admin = False
    
    if username and username != "Anonymous":
        room = get_or_create_room(db, room_id, username)
        is_first_user = room.admin_username is None
        is_admin = is_room_admin(db, room_id, username)
        
        # If first user, make them admin
        if is_first_user:
            room.admin_username = username
            db.commit()
            print(f"👑 {username} is now the admin of room {room_id}")
    db.close()
    
    await manager.connect(websocket, room_id, username)
    
    # Send chat history to newly connected user
    if username and username != "Anonymous":
        db = next(get_db())
        try:
            history_data = await asyncio.get_event_loop().run_in_executor(
                None, 
                get_chat_history_sync, 
                room_id, 
                db
            )
            if history_data and history_data.get("messages"):
                await websocket.send_text(json.dumps({
                    "type": "history",
                    "messages": history_data["messages"]
                }))
        except Exception as e:
            print(f"Error sending history: {e}")
        db.close()
        
        # Send admin status
        if is_admin:
            await websocket.send_text(json.dumps({
                "type": "admin_status",
                "is_admin": True
            }))
        
        # Only send welcome message if not reloading history
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
                elif message_type == "mute_user":
                    # Mute user (admin only)
                    db = next(get_db())
                    if is_room_admin(db, room_id, message_username):
                        target_user = message_data.get("target_username")
                        room = db.query(models.Room).filter(models.Room.name == room_id).first()
                        if room and target_user:
                            # Check if already muted
                            muted = db.query(models.MutedUser).filter(
                                models.MutedUser.room_id == room.id,
                                models.MutedUser.username == target_user
                            ).first()
                            if not muted:
                                muted_user = models.MutedUser(
                                    room_id=room.id,
                                    username=target_user,
                                    muted_by=message_username
                                )
                                db.add(muted_user)
                                db.commit()
                                await manager.broadcast_to_room({
                                    "type": "user_muted",
                                    "target_username": target_user,
                                    "muted_by": message_username
                                }, room_id)
                    db.close()
                elif message_type == "unmute_user":
                    # Unmute user (admin only)
                    db = next(get_db())
                    if is_room_admin(db, room_id, message_username):
                        target_user = message_data.get("target_username")
                        room = db.query(models.Room).filter(models.Room.name == room_id).first()
                        if room and target_user:
                            muted = db.query(models.MutedUser).filter(
                                models.MutedUser.room_id == room.id,
                                models.MutedUser.username == target_user
                            ).first()
                            if muted:
                                db.delete(muted)
                                db.commit()
                                await manager.broadcast_to_room({
                                    "type": "user_unmuted",
                                    "target_username": target_user,
                                    "unmuted_by": message_username
                                }, room_id)
                    db.close()
                elif message_type == "delete_message":
                    # Delete message (room admin only)
                    db = next(get_db())
                    if is_room_admin(db, room_id, message_username):
                        message_id = message_data.get("message_id")
                        msg = db.query(models.Message).filter(models.Message.id == message_id).first()
                        if msg:
                            msg.is_deleted = 1
                            msg.deleted_by = message_username
                            db.commit()
                            await manager.broadcast_to_room({
                                "type": "message_deleted",
                                "message_id": message_id,
                                "deleted_by": message_username
                            }, room_id)
                    db.close()
                else:
                    # Regular chat message - check if user is muted
                    db = next(get_db())
                    room = db.query(models.Room).filter(models.Room.name == room_id).first()
                    is_muted = False
                    if room:
                        is_muted = is_user_muted(db, room.id, message_username)
                    
                    if is_muted:
                        # User is muted, don't send message
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": "You are muted and cannot send messages"
                        }))
                        db.close()
                    else:
                        message_content = message_data.get("message", "")
                        
                        # Extract mentions
                        mentions = extract_mentions(message_content)
                        
                        message_payload = {
                            "type": "chat",
                            "username": message_username,
                            "message": message_content,
                            "timestamp": datetime.datetime.now().isoformat(),
                            "mentions": mentions
                        }
                        
                        # Include file metadata if present
                        if "file_url" in message_data:
                            message_payload["file_url"] = message_data["file_url"]
                            message_payload["filename"] = message_data.get("filename")
                            message_payload["file_type"] = message_data.get("file_type")
                            message_payload["file_size"] = message_data.get("file_size")
                        
                        # Save to database
                        db_msg = save_message_to_db(db, {**message_payload, "username": message_username}, room_id)
                        if db_msg:
                            message_payload["id"] = db_msg.id
                            message_payload["message_id"] = db_msg.id
                        db.close()
                        
                        await manager.broadcast_to_room(message_payload, room_id)
                
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

@router.get("/history/{room_id}")
def get_chat_history(room_id: str, db: Session = Depends(get_db)):
    """Get chat history for a room."""
    try:
        room = db.query(models.Room).filter(models.Room.name == room_id).first()
        if not room:
            return {"messages": []}
        
        messages = db.query(models.Message).filter(
            models.Message.room_id == room.id,
            models.Message.is_deleted == 0
        ).order_by(models.Message.timestamp.asc()).all()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "username": msg.user.username if msg.user else "Unknown",
                "message": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "file_url": msg.file_url,
                "filename": msg.filename,
                "file_type": msg.file_type,
                "file_size": msg.file_size,
                "mentions": msg.mentioned_users.split(",") if msg.mentioned_users else []
            })
        
        return {"messages": result}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"messages": []}