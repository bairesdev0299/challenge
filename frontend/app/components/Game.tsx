'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import DrawingCanvas from './DrawingCanvas';
import DrawingReceiver from './DrawingReceiver';

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
            console.log('=== GAME COMPONENT MESSAGE HANDLER ===');
            console.log('Raw message received:', message);
            
            // Asegurarnos de que el mensaje sea un objeto
            const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
            console.log('Parsed message:', parsedMessage);
            
            if (parsedMessage.type === 'drawing') {
                console.log('Drawing message received by Game:', parsedMessage.data);
                const isCurrentPlayerDrawing = gameState?.currentTurn === gameState?.players?.find((p: any) => p.isCurrentUser)?.name;
                console.log('Drawing message details:', {
                    messageType: parsedMessage.type,
                    drawingData: parsedMessage.data,
                    isDrawing,
                    isCurrentPlayerDrawing,
                    currentTurn: gameState?.currentTurn,
                    isCurrentPlayer: gameState?.players?.find((p: any) => p.isCurrentUser)?.name
                });

                // Solo procesar el mensaje si no es el jugador que está dibujando
                if (!isCurrentPlayerDrawing) {
                    console.log('Processing drawing message as observer');
                    setCurrentDrawingData(parsedMessage.data);
                } else {
                    console.log('Ignoring drawing message as current drawer');
                }
            } else if (parsedMessage.type === 'game_state') {
                console.log('Setting game state:', parsedMessage.state);
                setGameState(parsedMessage.state);
                setIsDrawing(parsedMessage.state.currentTurn === parsedMessage.state.players.find((p: any) => p.isCurrentUser)?.name);
            } else if (parsedMessage.type === 'correct_guess') {
                setMessages(prev => [...prev, `${parsedMessage.player} adivinó la palabra: ${parsedMessage.word}!`]);
            }
            console.log('=== END MESSAGE HANDLER ===');
        };

        addMessageHandler(handleMessage);
        return () => removeMessageHandler(handleMessage);
    }, [addMessageHandler, removeMessageHandler, isDrawing]);

    const handleDraw = (drawingData: any) => {
        if (!isDrawing) return;
        console.log('=== SENDING DRAWING POINT ===');
        console.log('Drawing point to send:', drawingData);
        sendMessage({
            type: 'drawing',
            data: drawingData
        });
        console.log('=== END SENDING DRAWING POINT ===');
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

    const handleResetGame = useCallback(() => {
        sendMessage({
            type: 'reset_game'
        });
    }, [sendMessage]);

    // Efecto para limpiar el canvas cuando cambia el turno
    useEffect(() => {
        if (gameState?.currentTurn) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            setCurrentDrawingData(null);
            setIsDrawing(gameState.currentTurn === gameState.players.find((p: any) => p.isCurrentUser)?.name);
        }
    }, [gameState?.currentTurn]);

    if (!gameState) {
        return <div>Loading game state...</div>;
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="text-xl font-bold">
                {isDrawing ? `Tu turno - Dibuja: ${gameState?.word}` : 'Espera tu turno'}
            </div>
            
            <button
                onClick={handleResetGame}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-4"
            >
                Reiniciar Juego
            </button>

            <div className="relative">
                <DrawingCanvas
                    ref={canvasRef}
                    isDrawing={isDrawing}
                    onDraw={handleDraw}
                    width={800}
                    height={600}
                />
                {!isDrawing && (
                    <DrawingReceiver
                        width={800}
                        height={600}
                        drawingData={currentDrawingData}
                    />
                )}
            </div>

            <form onSubmit={handleGuess} className="flex gap-2">
                <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Adivina la palabra..."
                    className="px-4 py-2 border rounded"
                    disabled={isDrawing}
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={isDrawing}
                >
                    Adivinar
                </button>
            </form>

            <div className="w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">Mensajes:</h3>
                <div className="border rounded p-4 h-48 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className="mb-2">
                            {msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 