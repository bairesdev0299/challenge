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
    const [currentDrawingData, setCurrentDrawingData] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isCurrentPlayer = gameState?.currentTurn === gameState?.players?.find((p: any) => p.isCurrentUser)?.name;
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const handleMessage = (message: any) => {
            console.log('Received message:', message);
            
            if (message.type === 'draw' && !isDrawing) {
                console.log('Processing drawing message:', message);
                setCurrentDrawingData({
                    x: message.x,
                    y: message.y,
                    type: message.drawType,
                    color: message.color,
                    lineWidth: message.lineWidth
                });
            } else if (message.type === 'game_state') {
                setGameState(message.data);
            }

            switch (message.type) {
                case 'correct_guess':
                    setMessages(prev => [...prev, `${message.player} adivinó la palabra: ${message.word}!`]);
                    break;
            }
        };

        addMessageHandler(handleMessage);
        return () => removeMessageHandler(handleMessage);
    }, [addMessageHandler, removeMessageHandler, isDrawing]);

    const handleDraw = (drawingData: any) => {
        if (!isDrawing) return;
        console.log('Sending drawing data:', drawingData);
        sendMessage({
            type: 'draw',
            x: drawingData.x,
            y: drawingData.y,
            drawType: drawingData.type,
            color: drawingData.color,
            lineWidth: drawingData.lineWidth
        });
    };

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
        setCurrentDrawingData(null);
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
                            drawingData={currentDrawingData}
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