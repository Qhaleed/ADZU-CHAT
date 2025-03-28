from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import uuid
import json  # ✅ Import JSON for message parsing
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

# Connection Manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # Connected users
        self.waiting_users: Set[str] = set()  # Users waiting for a partner
        self.chat_pairs: Dict[str, str] = {}  # Paired chat users

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()  # WebSocket handshake
        self.active_connections[user_id] = websocket
        self.waiting_users.add(user_id)

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.waiting_users.discard(user_id)

        # Remove from chat pairs
        if user_id in self.chat_pairs:
            paired_user = self.chat_pairs[user_id]
            del self.chat_pairs[user_id]
            del self.chat_pairs[paired_user]
            return paired_user  # Return the disconnected user's chat partner
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

# WebSocket endpoint for handling chat connections
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    try:
        # Attempt to pair the user with someone
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
            data_dict = json.loads(data)  # ✅ Parse JSON string to dictionary

            if user_id in manager.chat_pairs:
                partner_id = manager.chat_pairs[user_id]
                if partner_id in manager.active_connections:
                    await manager.active_connections[partner_id].send_json({
                        "type": "message",
                        "message": data_dict["message"]  # ✅ Extract "message" only
                    })

    except WebSocketDisconnect:
        paired_user = manager.disconnect(user_id)
        if paired_user and paired_user in manager.active_connections:
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Your chat partner has disconnected."
            })
