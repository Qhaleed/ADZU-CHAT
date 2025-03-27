# ADZU Chat Backend Documentation

## Overview
This is a simple WebSocket-based backend for an anonymous chat application designed for Ateneo de Zamboanga University students. The system allows for anonymous one-to-one chat connections without storing any message history.

## Technical Stack
- FastAPI
- WebSockets
- Python 3.7+

## Core Components

### ConnectionManager
The main class that handles all WebSocket connections and user pairing logic.

#### Key Attributes:
- `active_connections`: Dictionary storing active WebSocket connections
- `waiting_users`: Set of users waiting to be paired
- `chat_pairs`: Dictionary storing current chat partnerships

#### Key Methods:
- `connect()`: Handles new WebSocket connections
- `disconnect()`: Manages user disconnections
- `pair_users()`: Pairs waiting users together

## Data Flow

1. **Connection Establishment**
   - User connects via WebSocket
   - System assigns unique user ID
   - User added to waiting pool

2. **User Pairing**
   - System automatically pairs waiting users
   - Both users notified of successful connection

3. **Message Exchange**
   - Messages sent through WebSocket
   - No message storage/history
   - Direct user-to-user communication

4. **Disconnection Handling**
   - Automatic cleanup of connections
   - Partner notification of disconnection
   - Users returned to waiting pool if reconnected

## API Endpoints

### WebSocket: `/ws/{user_id}`
- Handles all chat functionality
- Accepts WebSocket connections
- Manages message routing between paired users

## Message Types

1. **System Messages**
   ```json
   {
       "type": "system",
       "message": "System notification text"
   }
   ```

2. **Chat Messages**
   ```json
   {
       "type": "message",
       "message": "User message content"
   }
   ```

## Setup Instructions

1. Install dependencies:
   ```bash
   pip install fastapi uvicorn websockets
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

3. Connect frontend to `ws://localhost:8000/ws/{user_id}`

## Security Notes
- No message persistence
- Anonymous connections
- No user identification stored 