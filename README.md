# Pictionary Game

A real-time Pictionary game where players can draw and guess words*.

* Currently, it works well with straight lines. Curve interpolation hasn't been achieved yet.

## Project Documentation

This project was bootstrapped following the detailed functional requirements specified in `cursor-functional-requirements.md`. The requirements document outlines the complete architecture, game states, WebSocket events, and other technical specifications that guided the development of this application.

## Requirements

### Backend
- Python 3.8+
- pip (Python package manager)

### Frontend
- Node.js 18+
- npm (Node.js package manager)

## Setup

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate the virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Unix/MacOS
   # or
   .\venv\Scripts\activate  # On Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configurations.

5. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The server will run at `http://localhost:8000`

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific settings, especially the backend WebSocket URL.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## Environment Variables

### Backend (.env)
```ini
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Security
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Game Configuration
ROUND_TIME=60  # seconds per round
MIN_PLAYERS=2
MAX_PLAYERS=8
MAX_ROUNDS=10
```

### Frontend (.env)
```ini
# Backend Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws

# Game Configuration
NEXT_PUBLIC_ROUND_TIME=60
NEXT_PUBLIC_MIN_PLAYERS=2
NEXT_PUBLIC_MAX_PLAYERS=8
```

## How to Play

1. Open the app in your browser (`http://localhost:3000`)
2. Enter a game room
3. Invite other players by sharing the game URL
4. When all players are in the room, the game starts automatically
5. Each player takes turns drawing a word while others try to guess it. The system assigns turns randomly
6. While a player is drawing, others can guess by typing the word they think is correct
7. If a player guesses correctly, both the guesser and the drawer earn a point. All points accumulate. The player with the most points at the end wins

## Features

- Real-time drawing
- Scoring system
- Chat for guessing words
- Player list with scores
- Intuitive and responsive interface
- Support for multiple game rooms

## Technologies Used

### Backend
- FastAPI
- WebSockets
- Python

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- WebSocket API

## License

MIT