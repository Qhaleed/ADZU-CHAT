from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections and waiting users
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.waiting_users: Set[str] = set()
        self.chat_pairs: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.waiting_users.add(user_id)

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.waiting_users.discard(user_id)
        
        # Handle disconnection from chat pair
        if user_id in self.chat_pairs:
            paired_user = self.chat_pairs[user_id]
            del self.chat_pairs[user_id]
            del self.chat_pairs[paired_user]
            return paired_user
        return None

    def pair_users(self, user1: str):
        for user2 in self.waiting_users:
            if user1 != user2 and user2 not in self.chat_pairs:
                self.chat_pairs[user1] = user2
                self.chat_pairs[user2] = user1
                self.waiting_users.discard(user1)
                self.waiting_users.discard(user2)
                return user2
        return None

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        # Try to pair with another user
        paired_user = manager.pair_users(user_id)
        if paired_user:
            await manager.active_connections[user_id].send_json({
                "type": "system",
                "message": "Connected to a chat partner!"
            })
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Connected to a chat partner!"
            })

        while True:
            data = await websocket.receive_text()
            
            # If user is paired, send message to partner
            if user_id in manager.chat_pairs:
                partner_id = manager.chat_pairs[user_id]
                if partner_id in manager.active_connections:
                    await manager.active_connections[partner_id].send_json({
                        "type": "message",
                        "message": data
                    })

    except WebSocketDisconnect:
        paired_user = manager.disconnect(user_id)
        if paired_user:
            if paired_user in manager.active_connections:
                await manager.active_connections[paired_user].send_json({
                    "type": "system",
                    "message": "Chat partner disconnected"
                }) 