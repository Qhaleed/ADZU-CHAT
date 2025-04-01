from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Tuple, Optional
import json
import threading
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
            del self.chat_pairs[paired_user]
            return paired_user
        return None

    def pair_users(self, user1: str) -> Optional[str]:
        """Pair user1 with any waiting user with matching campus and preference."""
        if user1 not in self.waiting_users:
            return None

        campus1, preference1 = self.waiting_users[user1]

        # Lock the pairing to avoid race conditions
        with self.lock:
            # Look for a match for user1 among waiting users
            for user2, (campus2, preference2) in self.waiting_users.items():
                if user1 != user2 and campus1 == campus2 and preference1 == preference2:
                    # Check if both users have active connections
                    if user1 in self.active_connections and user2 in self.active_connections:
                        # Pair user1 and user2
                        self.chat_pairs[user1] = user2
                        self.chat_pairs[user2] = user1
                        # Remove both from waiting users
                        del self.waiting_users[user1]
                        del self.waiting_users[user2]
                        return user2
        return None

    async def send_message(self, sender: str, receiver: str, message: str):
        """Send a message to the paired user, handle errors."""
        try:
            if sender in self.chat_pairs and receiver in self.active_connections:
                # Send message to the receiver
                await self.active_connections[receiver].send_json({
                    "type": "message",
                    "message": message
                })
        except Exception as e:
            print(f"Error sending message: {e}")
            # Handle error sending message (e.g., user disconnected)
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
