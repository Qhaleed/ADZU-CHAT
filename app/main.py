from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Tuple, Optional
import json
import threading
from fastapi.middleware.cors import CORSMiddleware
from better_profanity import profanity

# Handle both local development and deployment imports
try:
    # For deployment (when run as a package)
    from .global_chat_manager import global_chat_manager
except ImportError:
    # For local development (when run directly)
    from global_chat_manager import global_chat_manager

# white list 
# whitelist = ['omg', 'damm', 'queer', 'gay'] 

# # 
# profanity_filter = profanity()
# Initialize the profanity filter
profanity.load_censor_words()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://adzu-chat-frontend.vercel.app", "http://localhost:3000"],  # Your React frontend URL
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Message Filter class to handle content moderation
class MessageFilter:
    def __init__(self):
        # Add custom words to the filter if needed
        self.custom_badwords = ["additional_slur1", "additional_slur2"]
        profanity.add_censor_words(self.custom_badwords)
    
    def filter_message(self, message: str) -> str:
        """Filter inapprop riate content from messages."""
        # Replace profanity with asterisks
        return profanity.censor(message)
    
    def contains_profanity(self, message: str) -> bool:
        """Check if a message contains profanity."""
        return profanity.contains_profanity(message)
        
    def add_custom_word(self, word: str) -> bool:
        """Add a custom word to the filter."""
        if word not in self.custom_badwords:
            self.custom_badwords.append(word)
            profanity.add_censor_words([word])
            return True
        return False
        
    def remove_custom_word(self, word: str) -> bool:
        """Remove a custom word from the filter."""
        if word in self.custom_badwords:
            self.custom_badwords.remove(word)
            # Note: better_profanity doesn't have a direct method to remove words,
            # so we'd need to reload and re-add our custom list without this word
            profanity.load_censor_words()
            profanity.add_censor_words(self.custom_badwords)
            return True
        return False
        
    def get_custom_words(self) -> list:
        """Get the list of custom bad words."""
        return self.custom_badwords

# Initialize the message filter
message_filter = MessageFilter()

# Connection Manager to handle WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # Connected users
        self.waiting_users: Dict[str, Tuple[str, str]] = {}  # Waiting users
        self.chat_pairs: Dict[str, str] = {}  # Paired users
        self.standby_users: Dict[str, float] = {}  # Users on the AdzuChatCard page with last heartbeat timestamp
        self.code_waiting_users: Dict[str, str] = {}  # Code -> user_id mapping for code-based matching
        self.lock = threading.Lock()  # Lock to prevent race conditions
        self.start_cleanup_thread()  # Start the cleanup thread

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
            
        # Clean up from code waiting list
        self.remove_user_from_code_waiting(user_id)

        # Clean up chat pair
        if user_id in self.chat_pairs:
            paired_user = self.chat_pairs[user_id]
            del self.chat_pairs[user_id]
            if paired_user in self.chat_pairs:  # Avoid KeyError
                del self.chat_pairs[paired_user]

            # Notify the paired user and prevent re-pairing
            if paired_user in self.active_connections:
                self.waiting_users.pop(paired_user, None)  # Remove from waiting queue if present
                return paired_user

        return None

    def pair_users(self, user1: str, has_code: bool = False) -> Optional[str]:
        """Pair user1 with any waiting user with matching campus and preference, ensuring only two users per chat.
        If has_code is True, don't pair users (reserved for code-based matching only)."""
        if user1 not in self.waiting_users or user1 in self.chat_pairs:
            return None  # Ensure the user is not already chatting
            
        # If user has a code, don't pair them with regular matching
        if has_code:
            return None

        campus1, preference1 = self.waiting_users[user1]

        with self.lock:
            for user2, (campus2, preference2) in self.waiting_users.items():
                if user1 != user2 and campus1 == campus2 and preference1 == preference2:
                    # Also make sure user2 doesn't have a code match pending
                    if user2 not in self.chat_pairs and not self._user_has_code(user2):
                        self.chat_pairs[user1] = user2
                        self.chat_pairs[user2] = user1
                        del self.waiting_users[user1]
                        del self.waiting_users[user2]
                        return user2
        return None
        
    def _user_has_code(self, user_id: str) -> bool:
        """Check if a user is waiting with a code"""
        for waiting_user_id in self.code_waiting_users.values():
            if waiting_user_id == user_id:
                return True
        return False

    async def send_message(self, sender: str, receiver: str, message: str):
        """Send a message to the paired user, handle errors."""
        try:
            if sender in self.chat_pairs and receiver in self.active_connections:
                filtered_message = message_filter.filter_message(message)
                await self.active_connections[receiver].send_json({
                    "type": "message",
                    "message": filtered_message
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
                    original_message = message_data["message"]
                    
                    # Check if message contains profanity
                    if message_filter.contains_profanity(original_message):
                        # Send a warning to the sender
                        await self.active_connections[user_id].send_json({
                            "type": "system",
                            "message": "⚠️ Your message contained inappropriate content and was filtered."
                        })
                        
                    # Send filtered message to recipient
                    await self.send_message(user_id, partner_id, original_message)
        except json.JSONDecodeError:
            print("Received malformed message:", data)
        except Exception as e:
            print(f"Error processing message: {e}")

    def add_standby_user(self, user_id: str):
        """Add a user to the standby pool with current timestamp."""
        import time
        with self.lock:
            self.standby_users[user_id] = time.time()
            
    def remove_standby_user(self, user_id: str):
        """Remove a user from the standby pool."""
        with self.lock:
            if user_id in self.standby_users:
                del self.standby_users[user_id]
    
    def update_standby_timestamp(self, user_id: str):
        """Update the timestamp of a standby user."""
        import time
        with self.lock:
            if user_id in self.standby_users:
                self.standby_users[user_id] = time.time()
    
    def cleanup_stale_standby_users(self, timeout_seconds=60):
        """Remove standby users that haven't pinged in the specified timeout period."""
        import time
        current_time = time.time()
        stale_users = []
        
        with self.lock:
            for user_id, last_seen in list(self.standby_users.items()):
                if current_time - last_seen > timeout_seconds:
                    stale_users.append(user_id)
            
            for user_id in stale_users:
                del self.standby_users[user_id]
                
        if stale_users:
            print(f"Cleaned up {len(stale_users)} stale standby users")
    
    def start_cleanup_thread(self):
        """Start a background thread to periodically clean up stale standby users."""
        import threading
        import time
        
        def cleanup_task():
            while True:
                time.sleep(30)  # Check every 30 seconds
                self.cleanup_stale_standby_users()
        
        cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
        cleanup_thread.start()

    def get_user_stats(self):
        """Return the number of active, waiting, and chatting users."""
        return {
            "active_users": len(self.active_connections),
            "waiting_users": len(self.waiting_users),
            "chatting_users": len(self.chat_pairs),  # Each chat has 2 users
            "standby_users": len(self.standby_users)  # Users on the AdzuChatCard page
        }

    def add_user_with_code(self, user_id: str, code: str) -> Optional[str]:
        """Add a user with a specific code and check if someone is waiting with the same code"""
        with self.lock:
            # Check if someone is already waiting with this code
            if code in self.code_waiting_users:
                waiting_user = self.code_waiting_users[code]
                # Make sure the waiting user isn't the same user and is still connected
                if waiting_user != user_id and waiting_user in self.active_connections:
                    # Found a match - remove from code waiting
                    del self.code_waiting_users[code]
                    return waiting_user
            
            # No match yet, add this user to code waiting
            self.code_waiting_users[code] = user_id
            return None

    def remove_user_from_code_waiting(self, user_id: str):
        """Remove a user from code waiting list when they disconnect or match with someone else"""
        with self.lock:
            # Find and remove user from code_waiting_users
            codes_to_remove = []
            for code, waiting_user_id in self.code_waiting_users.items():
                if waiting_user_id == user_id:
                    codes_to_remove.append(code)
            
            for code in codes_to_remove:
                del self.code_waiting_users[code]


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
            await manager.active_connections[user_id].send_json({
                "type": "system",
                "message": "Chats are anonymous by default — we recommend not sharing personal information. Your identity stays private unless you choose to share it. You’re free to leave a chat anytime."
            })
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Connected to a chat partner!"
            })
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Chats are anonymous by default — we recommend not sharing personal information. Your identity stays private unless you choose to share it. You’re free to leave a chat anytime."
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

# New WebSocket endpoint for code-based matching
@app.websocket("/ws/code/{user_id}/{campus}/{preference}/{code}")
async def websocket_code_endpoint(websocket: WebSocket, user_id: str, campus: str, preference: str, code: str):
    await manager.connect(websocket, user_id, campus, preference)
    
    try:
        # First, check for a code match
        matched_user = manager.add_user_with_code(user_id, code)
        
        if matched_user:
            # Code match found - create a chat pair
            manager.chat_pairs[user_id] = matched_user
            manager.chat_pairs[matched_user] = user_id
            
            # Remove both users from regular waiting list if they're there
            manager.waiting_users.pop(user_id, None)
            manager.waiting_users.pop(matched_user, None)
            
            # Privacy message to send to both users
            privacy_msg = "Chats are anonymous by default — we recommend not sharing personal information. Your identity stays private unless you choose to share it. You're free to leave a chat anytime."
            
            # Notify both users that they are paired via code
            await manager.active_connections[user_id].send_json({
                "type": "system",
                "message": "Connected to your chat partner via matching code!"
            })
            await manager.active_connections[user_id].send_json({
                "type": "system",
                "message": privacy_msg
            })
            
            await manager.active_connections[matched_user].send_json({
                "type": "system",
                "message": "Connected to your chat partner via matching code!"
            })
            await manager.active_connections[matched_user].send_json({
                "type": "system",
                "message": privacy_msg
            })
        # else:
        #     # No code match yet, notify the user that we're waiting
        #     await manager.active_connections[user_id].send_json({
        #         "type": "system",
        #         "message": f"Waiting for someone with the matching code '{code}'. You'll be connected automatically when they join."
        #     })
            
            # DO NOT try regular matching as a fallback when using codes
            # Just keep the user waiting for a code match

        # Message handling loop
        while True:
            await manager.receive_message(websocket, user_id)

    except WebSocketDisconnect:
        # Handle disconnection
        paired_user = manager.disconnect(user_id)
        if paired_user and paired_user in manager.active_connections:
            await manager.active_connections[paired_user].send_json({
                "type": "system",
                "message": "Your chat partner has disconnected."
            })

# Endpoint to fetch user stats (active, waiting, chatting users)
@app.get("/user-stats")
async def get_user_stats():
    # Get regular chat stats
    regular_stats = manager.get_user_stats()
    
    # Get global chat stats
    global_stats = global_chat_manager.get_stats()
    
    # Combine chatting users: regular chat pairs + global chat active users
    combined_chatting_users = regular_stats["chatting_users"] + global_stats["active_users"]
    
    return {
        "active_users": regular_stats["active_users"],
        "waiting_users": regular_stats["waiting_users"], 
        "chatting_users": combined_chatting_users,  # Regular chatting + Global chat users
        "standby_users": regular_stats["standby_users"]
    }

@app.get("/ping")
async def ping():
    return {"status": "ok"}

# Administrative endpoints for managing profanity filter
@app.get("/filter/words")
async def get_filter_words():
    """Get the list of custom filtered words."""
    return {"words": message_filter.get_custom_words()}

@app.post("/filter/words/{word}")
async def add_filter_word(word: str):
    """Add a word to the profanity filter."""
    success = message_filter.add_custom_word(word)
    return {"success": success, "message": f"Word '{word}' added to filter" if success else f"Word '{word}' already in filter"}

@app.delete("/filter/words/{word}")
async def remove_filter_word(word: str):
    """Remove a word from the profanity filter."""
    success = message_filter.remove_custom_word(word)
    return {"success": success, "message": f"Word '{word}' removed from filter" if success else f"Word '{word}' not in filter"}

@app.post("/standby/{user_id}")
async def register_standby_user(user_id: str):
    """Register a user as being on the AdzuChatCard page."""
    manager.add_standby_user(user_id)
    return {"success": True, "message": f"User {user_id} added to standby pool"}

@app.delete("/standby/{user_id}")
async def unregister_standby_user(user_id: str):
    """Unregister a user from the AdzuChatCard page."""
    manager.remove_standby_user(user_id)
    return {"success": True, "message": f"User {user_id} removed from standby pool"}

@app.post("/standby/heartbeat/{user_id}")
async def standby_heartbeat(user_id: str):
    """Update the timestamp for a standby user to prevent timeout."""
    manager.update_standby_timestamp(user_id)
    return {"success": True, "message": f"Heartbeat received for user {user_id}"}

# Global Chat WebSocket endpoint
@app.websocket("/ws/global/{user_id}")
async def global_chat_websocket(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for global chat functionality."""
    await global_chat_manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from user
            raw_message = await websocket.receive_text()
            await global_chat_manager.process_message(user_id, raw_message)
            
    except WebSocketDisconnect:
        global_chat_manager.disconnect(user_id)
        # Broadcast updated user count
        await global_chat_manager.broadcast_user_count()

# Global Chat stats endpoint
@app.get("/global-chat-stats")
async def get_global_chat_stats():
    """Get global chat statistics."""
    return global_chat_manager.get_stats()
