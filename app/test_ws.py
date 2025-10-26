# test_ws.py
import asyncio
import websockets
import json

async def chat_client():
    print("🤖 Study Chat Test Client")
    print("-" * 30)
    
    # Get user input
    username = input("Enter your username: ").strip()
    room_name = input("Enter room name (default: study-room-1): ").strip() or "study-room-1"
    
    uri = f"ws://localhost:8000/chat/ws/{room_name}"
    
    print(f"\n🎯 Connecting as '{username}' to room '{room_name}'...")
    print("💡 Type your messages below (press Ctrl+C to exit)")
    print("-" * 30)
    
    async with websockets.connect(uri) as websocket:
        # Listen for incoming messages in background
        async def listen_for_messages():
            while True:
                try:
                    message = await websocket.recv()
                    data = json.loads(message)
                    
                    if data.get("type") == "message":
                        print(f"💬 {data['username']}: {data['message']}")
                    elif data.get("type") == "system":
                        print(f"📢 {data['message']}")
                        
                except websockets.exceptions.ConnectionClosed:
                    print("❌ Connection closed")
                    break
        
        # Start listening in background
        listen_task = asyncio.create_task(listen_for_messages())
        
        # Send messages
        try:
            while True:
                message_text = await asyncio.get_event_loop().run_in_executor(
                    None, input, ""
                )
                if message_text.strip():
                    message_data = {
                        "username": username,
                        "message": message_text
                    }
                    await websocket.send(json.dumps(message_data))
        except KeyboardInterrupt:
            print("\n👋 Disconnecting...")
        finally:
            listen_task.cancel()
            await websocket.close()

if __name__ == "__main__":
    asyncio.run(chat_client())