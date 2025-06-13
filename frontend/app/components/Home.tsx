'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import Game from './Game';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [gameState, setGameState] = useState<any>(null);
  const { isConnected, error, sendMessage, addMessageHandler } = useWebSocketContext();

  const handleJoin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      setIsJoining(true);
      sendMessage({ type: 'join', player: playerName.trim() });
    }
  }, [playerName, sendMessage]);

  useEffect(() => {
    const cleanup = addMessageHandler((data) => {
      console.log('Home component received message:', data);
      if (data.type === 'player_joined') {
        console.log('Player joined successfully:', data);
      } else if (data.type === 'game_state') {
        console.log('Game state received:', data);
        setGameState(data.state);
      } else if (data.type === 'game_start') {
        console.log('Game started:', data);
      }
    });

    return cleanup;
  }, [addMessageHandler]);

  if (gameState) {
    return <Game initialGameState={gameState} />;
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Connecting to server...</h1>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to Draw & Guess!</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isJoining}
            />
          </div>
          <button
            type="submit"
            disabled={!playerName.trim() || isJoining}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
} 