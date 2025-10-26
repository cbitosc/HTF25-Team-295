# app/test_simple.py
import asyncio
import websockets
import json

async def simple_test():
    username = "TestUser"
    room_name = "test-room"
    
    uri = f"ws://localhost:8000/chat/ws/{room_name}"
    
    async with websockets.connect(uri) as websocket:
        print(f"Connected as {username} to {room_name}")
        
        # Send a test message
        await websocket.send(json.dumps({
            "username": username,
            "message": "Hello everyone!"
        }))
        
        # Listen for responses
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(simple_test())