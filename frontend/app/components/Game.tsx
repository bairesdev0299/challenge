'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import DrawingCanvas from './DrawingCanvas';

interface GameProps {
    initialGameState: any;
}

export default function Game({ initialGameState }: GameProps) {
    const { sendMessage, addMessageHandler, removeMessageHandler } = useWebSocketContext();
    const [gameState, setGameState] = useState(initialGameState);
    const [messages, setMessages] = useState<string[]>([]);
    const [guess, setGuess] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isCurrentPlayer = gameState?.currentTurn === gameState?.players?.find((p: any) => p.isCurrentUser)?.name;

    useEffect(() => {
        const handleMessage = (message: any) => {
            console.log('Received message:', message);
            
            if (message.type === 'drawing' && !isCurrentPlayer) {
                console.log('Processing drawing message:', message.data);
                const canvas = canvasRef.current;
                if (!canvas) {
                    console.error('No canvas available');
                    return;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error('No canvas context available');
                    return;
                }

                const { x, y, type, color, lineWidth } = message.data;
                
                // Configurar el estilo del trazo
                ctx.strokeStyle = color || '#000000';
                ctx.lineWidth = lineWidth || 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                // Ajustar las coordenadas al tamaño del canvas
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const adjustedX = x * scaleX;
                const adjustedY = y * scaleY;

                switch (type) {
                    case 'start':
                        console.log('Starting new path at:', adjustedX, adjustedY);
                        ctx.beginPath();
                        ctx.moveTo(adjustedX, adjustedY);
                        break;
                    case 'draw':
                        console.log('Drawing line to:', adjustedX, adjustedY);
                        ctx.lineTo(adjustedX, adjustedY);
                        ctx.stroke();
                        break;
                    case 'end':
                        console.log('Ending path');
                        ctx.closePath();
                        break;
                    default:
                        console.warn('Unknown drawing type:', type);
                }
            }

            switch (message.type) {
                case 'game_state':
                    setGameState(message.state);
                    break;
                case 'correct_guess':
                    setMessages(prev => [...prev, `${message.player} adivinó la palabra: ${message.word}!`]);
                    break;
            }
        };

        addMessageHandler(handleMessage);
        return () => removeMessageHandler(handleMessage);
    }, [addMessageHandler, removeMessageHandler, isCurrentPlayer]);

    const handleDraw = useCallback((drawingData: any) => {
        if (isCurrentPlayer) {
            console.log('Sending drawing data:', drawingData);
            sendMessage({
                type: 'draw',
                x: drawingData.x,
                y: drawingData.y,
                drawType: drawingData.type,
                color: drawingData.color,
                lineWidth: drawingData.lineWidth
            });
        }
    }, [isCurrentPlayer, sendMessage]);

    const handleGuess = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (guess.trim() && !isCurrentPlayer) {
            sendMessage({
                type: 'guess',
                guess: guess.trim()
            });
            setGuess('');
        }
    }, [guess, isCurrentPlayer, sendMessage]);

    // Limpiar el canvas cuando cambia el turno
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [gameState?.currentTurn]);

    if (!gameState) {
        return <div>Loading game state...</div>;
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="w-full max-w-2xl">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <h2 className="text-xl font-bold mb-2">Turno actual: {gameState.currentTurn}</h2>
                    <div className="mb-4">
                        <h3 className="font-semibold">Jugadores:</h3>
                        <ul className="list-disc list-inside">
                            {gameState.players.map((player: any) => (
                                <li key={player.name} className={player.isCurrentUser ? 'text-blue-600 font-bold' : ''}>
                                    {player.name} - {player.score} puntos
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mb-4">
                        <p>Ronda {gameState.roundsPlayed} de {gameState.maxRounds}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    {isCurrentPlayer ? (
                        <div className="text-center mb-4">
                            <p className="text-lg font-semibold">Tu turno de dibujar!</p>
                            <p className="text-xl font-bold text-blue-600">Palabra: {gameState.word}</p>
                        </div>
                    ) : (
                        <div className="text-center mb-4">
                            <p className="text-lg font-semibold">Turno de {gameState.currentTurn}</p>
                            <p className="text-gray-600">¡Adivina qué está dibujando!</p>
                        </div>
                    )}

                    <div className="flex justify-center mb-4">
                        <DrawingCanvas
                            ref={canvasRef}
                            isDrawing={isCurrentPlayer}
                            onDraw={handleDraw}
                            width={800}
                            height={600}
                        />
                    </div>

                    {!isCurrentPlayer && (
                        <form onSubmit={handleGuess} className="flex gap-2">
                            <input
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="Escribe tu adivinanza..."
                                className="flex-1 p-2 border rounded"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Adivinar
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-semibold mb-2">Mensajes:</h3>
                    <div className="h-32 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <p key={index} className="mb-1">{msg}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 