from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Tuple
import json
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
        # Now store waiting users as a dictionary mapping user_id to (campus, preference)
        self.waiting_users: Dict[str, Tuple[str, str]] = {}
        self.chat_pairs: Dict[str, str] = {}  # Paired chat users

    async def connect(self, websocket: WebSocket, user_id: str, campus: str, preference: str):
        await websocket.accept()  # WebSocket handshake
        self.active_connections[user_id] = websocket
        self.waiting_users[user_id] = (campus, preference)  # Store user's choices

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.waiting_users:
            del self.waiting_users[user_id]

        # Remove from chat pairs if paired
        if user_id in self.chat_pairs:
            paired_user = self.chat_pairs[user_id]
            del self.chat_pairs[user_id]
            del self.chat_pairs[paired_user]
            return paired_user
        return None

    def pair_users(self, user1: str):
        """Pair user1 with any waiting user with matching campus and preference."""
        if user1 not in self.waiting_users:
            return None
        
        campus1, preference1 = self.waiting_users[user1]

        # Iterate over waiting users to find a match
        for user2, (campus2, preference2) in self.waiting_users.items():
            if user1 != user2 and campus1 == campus2 and preference1 == preference2:
                # Pair them
                self.chat_pairs[user1] = user2
                self.chat_pairs[user2] = user1
                # Remove both from waiting users
                del self.waiting_users[user1]
                del self.waiting_users[user2]
                return user2
        return None

manager = ConnectionManager()

# WebSocket endpoint that now accepts campus and preference as path parameters
@app.websocket("/ws/{user_id}/{campus}/{preference}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, campus: str, preference: str):
    await manager.connect(websocket, user_id, campus, preference)
    
    try:
        paired_user = manager.pair_users(user_id)
        if paired_user:
            # Notify both users that they are paired
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
            try:
                message_data = json.loads(data)
                if user_id in manager.chat_pairs:
                    partner_id = manager.chat_pairs[user_id]
                    if partner_id in manager.active_connections:
                        # Send only the actual message content to the partner
                        await manager.active_connections[partner_id].send_json({
                            "type": "message",
                            "message": message_data["message"]
                        })
            except json.JSONDecodeError:
                print("Received malformed message:", data)

    except WebSocketDisconnect:
        paired_user = manager.disconnect(user_id)
        if paired_user and paired_user in manager.active_connections:
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Your chat partner has disconnected."
            })
