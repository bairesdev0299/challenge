'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import DrawingCanvas from './DrawingCanvas';

interface GameProps {
  initialGameState: any;
}

export default function Game({ initialGameState }: GameProps) {
  const [gameState, setGameState] = useState(initialGameState);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, error: wsError, sendMessage, addMessageHandler, removeMessageHandler } = useWebSocketContext();

  // Determinar si soy el jugador actual
  const isCurrentPlayer = gameState?.currentTurn === gameState?.players.find((p: any) => p.isCurrentUser)?.name;

  const handleDraw = useCallback((data: { x: number; y: number; type: string }) => {
    console.log('Drawing data:', data);
    sendMessage({
      type: 'draw',
      x: data.x,
      y: data.y,
      drawType: data.type
    });
  }, [sendMessage]);

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('Received message:', message);
      switch (message.type) {
        case 'game_state':
          setGameState(message.state);
          break;
        case 'drawing':
          console.log('Received drawing data:', message.data);
          console.log('Current player:', gameState?.currentTurn);
          console.log('Is current player:', isCurrentPlayer);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) {
              console.error('Could not get canvas context');
              return;
            }

            const { x, y, type } = message.data;
            console.log('Drawing point:', { x, y, type });
            if (type === 'start') {
              console.log('Starting new path');
              ctx.beginPath();
              ctx.moveTo(x, y);
            } else if (type === 'draw') {
              console.log('Drawing line');
              ctx.lineTo(x, y);
              ctx.stroke();
            } else if (type === 'end') {
              console.log('Ending path');
              ctx.closePath();
            }
          } else {
            console.error('Canvas ref is null');
          }
          break;
        case 'correct_guess':
          setMessages(prev => [...prev, `${message.player} adivinó la palabra: ${message.word}!`]);
          break;
        case 'player_joined':
          setMessages(prev => [...prev, `${message.player} se unió al juego`]);
          break;
        case 'player_left':
          setMessages(prev => [...prev, `${message.player} abandonó el juego`]);
          break;
        case 'game_over':
          setMessages(prev => [...prev, '¡Juego terminado!']);
          break;
        case 'error':
          setMessages(prev => [...prev, `Error: ${message.message}`]);
          break;
      }
    };

    addMessageHandler(handleMessage);
    return () => removeMessageHandler(handleMessage);
  }, [addMessageHandler, removeMessageHandler, gameState?.currentTurn, isCurrentPlayer]);

  const handleGuess = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    if (guess.trim() && !isCurrentPlayer) {
      console.log('Sending guess:', guess.trim());
      sendMessage({
        type: 'guess',
        guess: guess.trim(),
      });
      setGuess('');
    }
  }, [isConnected, isCurrentPlayer, guess, sendMessage]);

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Connecting to game server...</h1>
          {wsError && <p className="text-red-500 mt-2">{wsError}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-500">Error</h1>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const currentDrawer = gameState.players.find((p: any) => p.name === gameState.currentTurn);
  const currentWord = gameState.word;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Pictionary Game</h2>
          <p>Players: {gameState.players.map((p: any) => `${p.name} (${p.score})`).join(', ')}</p>
          <p>Round: {gameState.roundsPlayed + 1}/{gameState.maxRounds}</p>
          
          {/* Mostrar información del turno actual */}
          <div className="mt-2 p-2 bg-gray-100 rounded">
            {isCurrentPlayer ? (
              <div>
                <p className="text-green-600 font-bold">¡Es tu turno de dibujar!</p>
                {currentWord && (
                  <p className="text-lg">Palabra a dibujar: <span className="font-bold">{currentWord}</span></p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-blue-600">Es el turno de <span className="font-bold">{currentDrawer?.name}</span></p>
                <p className="text-lg">¡Adivina qué está dibujando!</p>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <DrawingCanvas
            ref={canvasRef}
            isDrawing={isCurrentPlayer}
            onDraw={handleDraw}
            width={800}
            height={600}
          />
          {!isCurrentPlayer && (
            <form onSubmit={handleGuess} className="mt-4">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Escribe tu adivinanza..."
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Adivinar
              </button>
            </form>
          )}
        </div>

        <div className="mt-4">
          <h3 className="font-bold">Mensajes:</h3>
          <div className="h-32 overflow-y-auto border rounded p-2">
            {messages.map((msg, i) => (
              <div key={i} className="mb-1">
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 