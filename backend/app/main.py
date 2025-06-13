from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import random
from typing import List, Dict, Optional
import logging
from pydantic import BaseModel
import asyncio

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurar CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class GameState:
    def __init__(self):
        self.players: Dict[str, WebSocket] = {}
        self.scores: Dict[str, int] = {}
        self.current_turn: Optional[str] = None
        self.current_word: Optional[str] = None
        self.rounds_played: int = 0
        self.max_rounds: int = 10  # 10 rondas en total
        self.words = [
            "casa", "perro", "gato", "árbol", "sol", "luna", "estrella",
            "montaña", "río", "mar", "avión", "tren", "bicicleta", "coche",
            "flor", "libro", "teléfono", "computadora", "mesa", "silla"
        ]

    async def add_player(self, player_name: str, websocket: WebSocket):
        logger.info(f"Adding player: {player_name}")
        self.players[player_name] = websocket
        self.scores[player_name] = 0
        
        # Send confirmation to the joining player
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

    def remove_player(self, player_name: str):
        logger.info(f"Removing player: {player_name}")
        if player_name in self.players:
            del self.players[player_name]
            del self.scores[player_name]
            if self.current_turn == player_name:
                self.start_new_round()

    async def start_new_round(self):
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

    async def broadcast_game_state(self):
        logger.info("Broadcasting game state")
        for player_name, websocket in self.players.items():
            try:
                # Solo enviar la palabra al jugador que debe dibujar
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

    async def broadcast_game_over(self):
        logger.info("Broadcasting game over")
        for websocket in self.players.values():
            try:
                await websocket.send_json({
                    "type": "game_over",
                    "scores": self.scores
                })
            except Exception as e:
                logger.error(f"Error broadcasting game over: {str(e)}")

    async def broadcast_drawing(self, drawing_data: dict):
        logger.info(f"Broadcasting drawing data: {drawing_data}")
        # Solo enviar a los jugadores que no están dibujando
        for player_name, websocket in self.players.items():
            if player_name != self.current_turn:
                try:
                    # Enviar todos los datos necesarios para el dibujo
                    message = {
                        "type": "drawing",
                        "data": {
                            "x": drawing_data.get("x", 0),
                            "y": drawing_data.get("y", 0),
                            "type": drawing_data.get("drawType", "draw"),
                            "color": drawing_data.get("color", "#000000"),
                            "lineWidth": drawing_data.get("lineWidth", 2)
                        }
                    }
                    logger.info(f"Sending drawing data to {player_name}: {message}")
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting drawing to {player_name}: {str(e)}")

    async def handle_guess(self, player_name: str, guess: str):
        if (player_name != self.current_turn and 
            self.current_word and 
            guess.lower() == self.current_word.lower()):
            self.scores[player_name] += 1
            await self.broadcast_correct_guess(player_name)
            await self.start_new_round()
            return True
        return False

    async def broadcast_correct_guess(self, player_name: str):
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

# Global game state
game_state = GameState()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
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

                elif message["type"] == "draw" and player_name == game_state.current_turn:
                    logger.info(f"Drawing from {player_name}: {message}")
                    # Validar que los datos de dibujo sean válidos
                    if all(key in message for key in ["x", "y", "drawType"]):
                        await game_state.broadcast_drawing(message)
                    else:
                        logger.warning(f"Invalid drawing data received from {player_name}: {message}")

                elif message["type"] == "guess":
                    logger.info(f"Guess from {player_name}: {message['guess']}")
                    await game_state.handle_guess(player_name, message["guess"])

                elif message["type"] == "pong":
                    # Handle pong response
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
        # Cancel ping task
        if 'ping_task' in locals():
            ping_task.cancel()
            try:
                await ping_task
            except asyncio.CancelledError:
                pass

async def send_ping(websocket: WebSocket):
    """Send periodic ping messages to keep the connection alive"""
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
    uvicorn.run(app, host="0.0.0.0", port=8000) 