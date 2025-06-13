"""
Pictionary Game Backend Server.

This module implements a FastAPI WebSocket server for a real-time Pictionary game.
It handles player connections, game state management, and real-time drawing events.

The server uses WebSocket connections to maintain real-time communication between
players, managing game state including turns, scores, and drawing events.

Environment Variables:
    HOST (str): Server host address (default: "0.0.0.0")
    PORT (int): Server port number (default: 8000)
    DEBUG (bool): Debug mode flag (default: True)
    SECRET_KEY (str): Secret key for security
    CORS_ORIGINS (str): Comma-separated list of allowed CORS origins
    ROUND_TIME (int): Duration of each round in seconds (default: 60)
    MIN_PLAYERS (int): Minimum players required to start (default: 2)
    MAX_PLAYERS (int): Maximum players allowed (default: 8)
    MAX_ROUNDS (int): Maximum number of rounds (default: 10)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import random
from typing import List, Dict, Optional
import logging
from pydantic import BaseModel
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Game Configuration
ROUND_TIME = int(os.getenv("ROUND_TIME", "60"))
MIN_PLAYERS = int(os.getenv("MIN_PLAYERS", "2"))
MAX_PLAYERS = int(os.getenv("MAX_PLAYERS", "8"))
MAX_ROUNDS = int(os.getenv("MAX_ROUNDS", "10"))

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class GameState:
    """
    Manages the state of a Pictionary game session.

    This class handles all game-related state including players, scores,
    turns, and game progression. It provides methods for managing player
    connections, broadcasting game state, and handling game events.

    Attributes:
        players (Dict[str, WebSocket]): Dictionary mapping player names to their WebSocket connections
        scores (Dict[str, int]): Dictionary mapping player names to their scores
        current_turn (Optional[str]): Name of the player whose turn it is
        current_word (Optional[str]): The word to be drawn in the current round
        rounds_played (int): Number of rounds completed
        max_rounds (int): Maximum number of rounds in the game
        round_time (int): Duration of each round in seconds
        min_players (int): Minimum players required to start
        max_players (int): Maximum players allowed
        words (List[str]): List of words that can be drawn
    """

    def __init__(self):
        """Initialize a new game state with default values."""
        self.players: Dict[str, WebSocket] = {}
        self.scores: Dict[str, int] = {}
        self.current_turn: Optional[str] = None
        self.current_word: Optional[str] = None
        self.rounds_played: int = 0
        self.max_rounds: int = MAX_ROUNDS
        self.round_time: int = ROUND_TIME
        self.min_players: int = MIN_PLAYERS
        self.max_players: int = MAX_PLAYERS
        self.words = [
            "house", "dog", "cat", "tree", "sun", "moon", "star",
            "mountain", "river", "sea", "airplane", "train", "bicycle", "car",
            "flower", "book", "phone", "computer", "table", "chair"
        ]

    async def add_player(self, player_name: str, websocket: WebSocket) -> None:
        """
        Add a new player to the game.

        Args:
            player_name (str): Name of the player to add
            websocket (WebSocket): WebSocket connection for the player

        Note:
            If this is the second player, a new round will be started.
        """
        logger.info(f"Adding player: {player_name}")
        self.players[player_name] = websocket
        self.scores[player_name] = 0
        
        try:
            await websocket.send_json({
                "type": "player_joined",
                "player": player_name,
                "status": "success",
                "message": f"Successfully joined as {player_name}"
            })
            logger.info(f"Sent join confirmation to player: {player_name}")
        except Exception as e:
            logger.error(f"Error sending join confirmation to {player_name}: {str(e)}")
        
        if len(self.players) >= 2 and not self.current_turn:
            await self.start_new_round()

    def remove_player(self, player_name: str) -> None:
        """
        Remove a player from the game.

        Args:
            player_name (str): Name of the player to remove
        """
        logger.info(f"Removing player: {player_name}")
        if player_name in self.players:
            del self.players[player_name]
            del self.scores[player_name]
            if self.current_turn == player_name:
                self.start_new_round()

    async def start_new_round(self) -> None:
        """
        Start a new round of the game.

        This method:
        1. Checks if there are enough players
        2. Increments the round counter
        3. Selects a new player and word
        4. Broadcasts the new game state

        Note:
            If maximum rounds are reached, the game will end.
        """
        if len(self.players) < 2:
            self.current_turn = None
            self.current_word = None
            return

        self.rounds_played += 1
        if self.rounds_played > self.max_rounds:
            await self.broadcast_game_over()
            return

        available_players = [p for p in self.players.keys() if p != self.current_turn]
        self.current_turn = random.choice(available_players)
        self.current_word = random.choice(self.words)
        logger.info(f"New round started. Current turn: {self.current_turn}, Word: {self.current_word}")
        await self.broadcast_game_state()

    async def broadcast_game_state(self) -> None:
        """
        Broadcast the current game state to all players.

        Each player receives:
        - Current turn information
        - The word (only for the current drawer)
        - List of players and their scores
        - Round information
        """
        logger.info("Broadcasting game state")
        for player_name, websocket in self.players.items():
            try:
                word = self.current_word if player_name == self.current_turn else None
                await websocket.send_json({
                    "type": "game_state",
                    "state": {
                        "currentTurn": self.current_turn,
                        "word": word,
                        "players": [{"name": p, "score": self.scores[p], "isCurrentUser": p == player_name} for p in self.players.keys()],
                        "roundsPlayed": self.rounds_played,
                        "maxRounds": self.max_rounds
                    }
                })
                logger.info(f"Sent game state to {player_name}. Word included: {word is not None}")
            except Exception as e:
                logger.error(f"Error broadcasting game state to {player_name}: {str(e)}")

    async def broadcast_game_over(self) -> None:
        """
        Broadcast the game over message to all players.

        This includes the final scores for all players.
        """
        logger.info("Broadcasting game over")
        for websocket in self.players.values():
            try:
                await websocket.send_json({
                    "type": "game_over",
                    "scores": self.scores
                })
            except Exception as e:
                logger.error(f"Error broadcasting game over: {str(e)}")

    async def broadcast_drawing(self, drawing_data: dict) -> None:
        """
        Broadcast drawing data to all players except the drawer.

        Args:
            drawing_data (dict): Drawing event data containing coordinates and drawing state
        """
        logger.info(f"Broadcasting drawing data: {drawing_data}")
        for player_name, websocket in self.players.items():
            if player_name != self.current_turn:
                try:
                    message = {
                        "type": "drawing",
                        "data": drawing_data
                    }
                    logger.info(f"Sending drawing data to {player_name}: {message}")
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting drawing to {player_name}: {str(e)}")

    async def handle_guess(self, player_name: str, guess: str) -> bool:
        """
        Handle a player's guess attempt.

        Args:
            player_name (str): Name of the player making the guess
            guess (str): The word being guessed

        Returns:
            bool: True if the guess was correct, False otherwise
        """
        if (player_name != self.current_turn and 
            self.current_word and 
            guess.lower() == self.current_word.lower()):
            self.scores[player_name] += 1
            await self.broadcast_correct_guess(player_name)
            await self.start_new_round()
            return True
        return False

    async def broadcast_correct_guess(self, player_name: str) -> None:
        """
        Broadcast a correct guess to all players.

        Args:
            player_name (str): Name of the player who made the correct guess
        """
        logger.info(f"Broadcasting correct guess from {player_name}")
        for websocket in self.players.values():
            try:
                await websocket.send_json({
                    "type": "correct_guess",
                    "player": player_name,
                    "word": self.current_word
                })
            except Exception as e:
                logger.error(f"Error broadcasting correct guess: {str(e)}")

    async def reset_game(self) -> None:
        """
        Reset the game state while keeping active players.

        This method:
        1. Resets all player scores to 0
        2. Resets the round counter
        3. Starts a new round
        """
        logger.info("Resetting game state")
        for player in self.players:
            self.scores[player] = 0
        self.rounds_played = 0
        await self.start_new_round()

# Global game state
game_state = GameState()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for handling game connections.

    This endpoint:
    1. Accepts new WebSocket connections
    2. Handles player joining
    3. Processes drawing events
    4. Manages guesses
    5. Handles game resets
    6. Maintains connection with periodic pings

    Args:
        websocket (WebSocket): The WebSocket connection
    """
    logger.info("New WebSocket connection request")
    
    try:
        await websocket.accept()
        logger.info("WebSocket connection accepted")
        player_name = None

        # Start ping task
        ping_task = asyncio.create_task(send_ping(websocket))

        while True:
            try:
                data = await websocket.receive_text()
                logger.info(f"Received message: {data}")
                message = json.loads(data)

                if message["type"] == "join":
                    player_name = message["player"]
                    logger.info(f"Player {player_name} joining")
                    await game_state.add_player(player_name, websocket)
                    await game_state.broadcast_game_state()

                elif message["type"] == "drawing" and player_name == game_state.current_turn:
                    logger.info(f"Drawing from {player_name}: {message}")
                    if "data" in message and all(key in message["data"] for key in ["x", "y"]):
                        await game_state.broadcast_drawing(message["data"])
                    else:
                        logger.warning(f"Invalid drawing data received from {player_name}: {message}")

                elif message["type"] == "guess":
                    logger.info(f"Guess from {player_name}: {message['guess']}")
                    await game_state.handle_guess(player_name, message["guess"])

                elif message["type"] == "reset_game":
                    logger.info(f"Reset game requested by {player_name}")
                    await game_state.reset_game()

                elif message["type"] == "pong":
                    continue

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {str(e)}")
                continue

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {player_name}")
        if player_name:
            game_state.remove_player(player_name)
            await game_state.broadcast_game_state()
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {str(e)}")
        if player_name:
            game_state.remove_player(player_name)
            await game_state.broadcast_game_state()
    finally:
        if 'ping_task' in locals():
            ping_task.cancel()
            try:
                await ping_task
            except asyncio.CancelledError:
                pass

async def send_ping(websocket: WebSocket) -> None:
    """
    Send periodic ping messages to keep the WebSocket connection alive.

    Args:
        websocket (WebSocket): The WebSocket connection to ping
    """
    try:
        while True:
            await asyncio.sleep(30)  # Send ping every 30 seconds
            try:
                await websocket.send_json({"type": "ping"})
            except Exception as e:
                logger.error(f"Error sending ping: {str(e)}")
                break
    except asyncio.CancelledError:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT) 