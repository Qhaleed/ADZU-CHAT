from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Tuple, Optional
import json
import threading
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://adzu-chat.onrender.com/"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection Manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # Connected users
        self.waiting_users: Dict[str, Tuple[str, str]] = {}  # Waiting users
        self.chat_pairs: Dict[str, str] = {}  # Paired users
        self.lock = threading.Lock()  # Lock to prevent race conditions

    async def connect(self, websocket: WebSocket, user_id: str, campus: str, preference: str):
        """Accept the websocket connection and add the user to active connections."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.waiting_users[user_id] = (campus, preference)  # Add user to waiting list

    def disconnect(self, user_id: str):
        """Disconnect a user and clean up their data."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.waiting_users:
            del self.waiting_users[user_id]

        # Clean up chat pair
        if user_id in self.chat_pairs:
            paired_user = self.chat_pairs[user_id]
            del self.chat_pairs[user_id]
            if paired_user in self.chat_pairs:  # Avoid KeyError
                del self.chat_pairs[paired_user]
            return paired_user
        return None

    def pair_users(self, user1: str) -> Optional[str]:
        """Pair user1 with any waiting user with matching campus and preference, ensuring only two users per chat."""
        if user1 not in self.waiting_users or user1 in self.chat_pairs:
            return None  # Ensure the user is not already chatting

        campus1, preference1 = self.waiting_users[user1]

        with self.lock:
            for user2, (campus2, preference2) in self.waiting_users.items():
                if user1 != user2 and campus1 == campus2 and preference1 == preference2:
                    if user2 not in self.chat_pairs:  # Ensure user2 is not already chatting
                        self.chat_pairs[user1] = user2
                        self.chat_pairs[user2] = user1
                        del self.waiting_users[user1]
                        del self.waiting_users[user2]
                        return user2
        return None

    async def send_message(self, sender: str, receiver: str, message: str):
        """Send a message to the paired user, handle errors."""
        try:
            if sender in self.chat_pairs and receiver in self.active_connections:
                await self.active_connections[receiver].send_json({
                    "type": "message",
                    "message": message
                })
        except Exception as e:
            print(f"Error sending message: {e}")
            await self.disconnect(sender)

    async def receive_message(self, websocket: WebSocket, user_id: str):
        """Receive message from user and send to the paired user."""
        data = await websocket.receive_text()
        try:
            message_data = json.loads(data)
            if user_id in self.chat_pairs:
                partner_id = self.chat_pairs[user_id]
                if partner_id in self.active_connections:
                    await self.send_message(user_id, partner_id, message_data["message"])
        except json.JSONDecodeError:
            print("Received malformed message:", data)
        except Exception as e:
            print(f"Error processing message: {e}")

    def get_user_stats(self):
        """Return the number of active, waiting, and chatting users."""
        return {
            "active_users": len(self.active_connections),
            "waiting_users": len(self.waiting_users),
            "chatting_users": len(self.chat_pairs) // 2  # Each chat has 2 users
        }


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
            await manager.receive_message(websocket, user_id)

    except WebSocketDisconnect:
        paired_user = manager.disconnect(user_id)
        if paired_user and paired_user in manager.active_connections:
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Your chat partner has disconnected."
            })

# Endpoint to fetch user stats (active, waiting, chatting users)
@app.get("/user-stats")
async def get_user_stats():
    return manager.get_user_stats()
@app.get("/")
async def root():
    return {"message": "Welcome to ADZU-Chat Backend!"}