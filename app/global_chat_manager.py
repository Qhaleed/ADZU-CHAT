from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import threading
import time
import uuid
from better_profanity import profanity
from datetime import datetime, timedelta
class GlobalChatManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
        self.message_history: List[Dict] = []  # Store recent messages
        self.max_messages = 100  # Keep last 100 messages
        self.lock = threading.Lock()
        self.start_user_count_broadcast()

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept websocket connection and add user to global chat."""
        await websocket.accept()
        
        with self.lock:
            self.active_connections[user_id] = websocket
        
        # Send recent message history to the new user
        recent_messages = self.message_history[-20:]  # Last 20 messages
        for message in recent_messages:
            try:
                await websocket.send_json(message)
            except:
                pass  # If sending fails, continue
        
        # Send welcome message
        # welcome_message = {
        #     "type": "system",
        #     "message": "Welcome to Global Chat! Be respectful and follow community guidelines.",
        #     "timestamp": datetime.now().isoformat(),
        #     "message_id": str(uuid.uuid4())
        # }
        
        # try:
        #     await websocket.send_json(welcome_message)
        # except:
        #     pass
        
        # Broadcast user count update
        await self.broadcast_user_count()

    def disconnect(self, user_id: str):
        """Remove user from global chat."""
        with self.lock:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
        
        # Don't await here since this might be called from a disconnect handler
        # Instead, we'll rely on the periodic user count broadcast

    async def broadcast_message(self, message_data: Dict, sender_id: str = None):
        """Broadcast a message to all connected users except the sender."""
        # Add message to history
        with self.lock:
            self.message_history.append(message_data)
            if len(self.message_history) > self.max_messages:
                self.message_history.pop(0)
        
        # Broadcast to all users except the sender
        disconnected_users = []
        
        for user_id, websocket in list(self.active_connections.items()):
            # Skip sending to the sender to avoid duplicate messages
            if sender_id and user_id == sender_id:
                continue
                
            try:
                await websocket.send_json(message_data)
            except:
                # Connection is broken, mark for removal
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        with self.lock:
            for user_id in disconnected_users:
                if user_id in self.active_connections:
                    del self.active_connections[user_id]

    async def process_message(self, user_id: str, raw_message: str):
        """Process and broadcast a user message."""
        try:
            message_data = json.loads(raw_message)
            user_message = message_data.get("message", "").strip()
            
            if not user_message:
                return
            
            # Filter profanity
            filtered_message = profanity.censor(user_message)
            
            # Create anonymous user identifier (consistent per session)
            anon_id = f"Anon{user_id[:6]}"

            ph_time = datetime.now() + timedelta(hours=8)
            
            # Create message object
            broadcast_message = {
                "type": "global_message",
                "message": filtered_message,
                "user_id": anon_id,
                "timestamp": ph_time.isoformat(),
                "message_id": str(uuid.uuid4())
            }
            
            # Check if original message contained profanity
            if profanity.contains_profanity(user_message):
                # Send warning to sender
                warning_message = {
                    "type": "system",
                    "message": "⚠️ Your message contained inappropriate content and was filtered.",
                    "timestamp": ph_time.isoformat(),
                    "message_id": str(uuid.uuid4())
                }
                
                if user_id in self.active_connections:
                    try:
                        await self.active_connections[user_id].send_json(warning_message)
                    except:
                        pass
            
            # Broadcast the filtered message
            await self.broadcast_message(broadcast_message, sender_id=user_id)
            
        except json.JSONDecodeError:
            print(f"Invalid JSON from user {user_id}: {raw_message}")
        except Exception as e:
            print(f"Error processing message from {user_id}: {e}")

    async def broadcast_user_count(self):
        """Broadcast current user count to all connected users."""
        ph_time = datetime.now() + timedelta(hours=8)  # Use Philippine time for consistency
        user_count_message = {
            "type": "user_count",
            "count": len(self.active_connections),
            "timestamp": ph_time.isoformat()  # Changed to use ph_time
        }
        
        disconnected_users = []
        for user_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_json(user_count_message)
            except:
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        with self.lock:
            for user_id in disconnected_users:
                if user_id in self.active_connections:
                    del self.active_connections[user_id]

    def get_stats(self):
        """Get global chat statistics."""
        return {
            "active_users": len(self.active_connections),
            "total_messages": len(self.message_history)
        }

    def start_user_count_broadcast(self):
        """Start background thread to periodically broadcast user count."""
        import asyncio
        
        def broadcast_task():
            while True:
                time.sleep(30)  # Broadcast every 30 seconds
                # Note: We can't await here in a sync thread
                # The user count will be updated when users join/leave instead
        
        broadcast_thread = threading.Thread(target=broadcast_task, daemon=True)
        broadcast_thread.start()

# Create global instance
global_chat_manager = GlobalChatManager()
