# ADZU Chat Documentation

## Overview

ADZU Chat is an open-source anonymous chat platform designed for students of Ateneo de Zamboanga University. It allows users to connect anonymously and chat in real-time without storing any message history.

## Features

- Anonymous one-to-one chat.
- Real-time WebSocket-based communication.
- User preferences for campus and course.
- Responsive and modern UI.
- Secure and private communication.

## Technical Stack

- **Frontend**: React.js
- **Backend**: FastAPI, WebSockets
- **Deployment**: Vercel (Frontend), Render (Backend)

## Setup Instructions

### Backend

1. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```
2. **Activate the virtual environment**:
   ```bash
   .\venv\Scripts\Activate.ps1  # For Windows
   source venv/bin/activate       # For Linux/Mac
   ```
3. **Install dependencies**:
   ```bash
   python -m pip install -r requirements.txt
   ```
4. **Run the server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   - If there is a port conflict, specify a different port:
     ```bash
     uvicorn app.main:app --reload --port 8001
     ```

### Frontend

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the development server**:
   ```bash
   npm start
   ```

## API Endpoints

### WebSocket: `/ws/{user_id}/{campus}/{preference}`

- Handles all chat functionality.
- Accepts WebSocket connections.
- Manages message routing between paired users.

### REST API: `/user-stats`

- Returns the number of active, waiting, and chatting users.

### REST API: `/ping`

- Health check endpoint.

## Frontend Components

### `ChatCard`

- Handles the chat interface and WebSocket connection.
- Prompts users to change preferences if no match is found within 15 seconds.

### `AdzuChatCard`

- Landing page component for selecting campus and course preferences.
- Displays real-time user statistics.

### `StatsModal`

- Fetches and displays user statistics (active users, waiting users, active chats).

### `FAQs`

- Provides answers to frequently asked questions about the platform.

### `NotFound`

- Displays a 404 error page for invalid routes.

## Backend Logic

### ConnectionManager

- Manages WebSocket connections, waiting users, and chat pairs.
- Key methods:
  - `connect()`: Adds a user to active connections.
  - `disconnect()`: Removes a user and cleans up their data.
  - `pair_users()`: Pairs users with matching preferences.

### Message Types

1. **System Messages**:
   ```json
   {
     "type": "system",
     "message": "System notification text"
   }
   ```
2. **Chat Messages**:
   ```json
   {
     "type": "message",
     "message": "User message content"
   }
   ```

## Deployment

### Frontend

- Deployed on Vercel.
- Ensure GitHub repository access is granted for private repositories.

### Backend

- Deployed on Render.
- Ensure CORS is configured to allow requests from the frontend.

## Security Notes

- No message persistence.
- Anonymous connections.
- No user identification stored.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License.
