# Requirement: Pictionary Web App (Simplified Version)

You are to develop a web application to play Pictionary, with the following features:

## Technologies

- **Frontend:**
  - React  
  - TypeScript  
  - Tailwind CSS  

- **Backend:**
  - FastAPI (Python)  
  - WebSocket for real-time communication  
  - In-memory storage (no database)

## Functional Goal

Create a simplified Pictionary web app where:

1. Each player joins a room by entering their name.
2. One player at a time draws a random word.
3. The rest of the players try to guess the word by typing it.
4. If someone guesses correctly:
   - The guesser earns 1 point.
   - The drawer earns 1 point.
   - A message is displayed indicating the word was guessed.
   - After 3 seconds, the turn automatically moves to the next player.
5. Turns rotate among players.
6. The updated scoreboard is displayed on screen.

## Functional Requirements

### Frontend (React + TypeScript + Tailwind)

- Home page to join a room (name + room code).
- Main game page:
  - If it's your turn:
    - You see the word to draw (hidden from others).
    - You have access to a drawing canvas.
  - If it's not your turn:
    - You see the canvas updated in real time.
    - You have an input to guess the word.
- The scoreboard must be visible during the game.
- The design should be clean, functional, and styled using Tailwind.

### Canvas

- Implement a `DrawingCanvas` component.
- Only the drawing player can use the mouse to draw.
- Strokes should be sent over WebSocket as events: `{ x, y, color, width, isDrawing }`.
- The backend must forward these events to other players so they can replicate the drawing on their own canvases.
- The canvas can have a fixed size (e.g., 800x600).

### Backend (FastAPI)

- WebSocket at `/ws/{room_id}` to:
  - Send and receive drawing events
  - Receive guesses
  - Send "correct guess" messages
  - Send "turn change" messages

- HTTP routes to:
  - Create a room
  - Join a room

#### State kept in memory:
- List of players per room
- Current turn (index)
- Current word (randomly chosen from a fixed list)
- Scoreboard
- List of WebSocket connections per room

## Considerations

- No word categories or authentication are implemented.
- Words are randomly selected from a predefined list.
- No need to persist any data.
- The game can continue indefinitely or until players choose to leave.
- The backend can optionally send a snapshot of the current drawing to new players.

## Bonus (Optional)

- Display a turn timer (e.g., 60 seconds).
- Show messages like "Juan guessed the word!"
- Restart the game after X rounds.

## Project Structure

```
pictionary/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── utils/
│   └── public/
└── backend/
    ├── app/
    │   ├── routes/
    │   ├── websockets/
    │   └── models/
    └── tests/
```

## Game States

1. **Waiting Room**
   - Players can join
   - Minimum 2 players required to start
   - Display list of joined players

2. **In Game**
   - Active drawing/guessing
   - Scoreboard visible
   - Turn timer running

3. **Round End**
   - Display round results
   - Show next drawer
   - 3-second transition

4. **Game End**
   - Display final scores
   - Option to start new game
   - Option to return to lobby

## WebSocket Events

```typescript
// Drawing Events
interface DrawingEvent {
  type: 'draw';
  data: {
    x: number;
    y: number;
    color: string;
    width: number;
    isDrawing: boolean;
  };
}

// Game Events
interface GameEvent {
  type: 'guess' | 'correct_guess' | 'turn_change' | 'player_joined' | 'player_left';
  data: {
    player: string;
    message?: string;
    word?: string;
  };
}
```

## Error Handling

- **Room Errors**
  - Room full (max 8 players)
  - Room not found
  - Duplicate player names

- **Game Errors**
  - Invalid guess format
  - Drawing outside canvas
  - WebSocket disconnection

## Security Considerations

- Validate all user inputs
- Sanitize player names
- Rate limit guesses
- Prevent XSS in chat/messages
- Validate WebSocket messages

## Testing

- **Frontend Tests**
  - Component rendering
  - User interactions
  - Canvas functionality
  - WebSocket integration

- **Backend Tests**
  - Room management
  - Game logic
  - WebSocket handling
  - Error cases

## Deployment

- **Requirements**
  - Node.js 16+
  - Python 3.8+
  - WebSocket support
  - 1GB RAM minimum

- **Environment Variables**
  - `PORT`: Backend port
  - `MAX_PLAYERS`: Maximum players per room
  - `ROUND_TIME`: Seconds per turn
  - `MAX_ROUNDS`: Rounds before game restart

## UI Components

- **Home Page**
  - Room code input
  - Player name input
  - Join button
  - Create room button

- **Game Page**
  - Canvas (800x600)
  - Chat/guess input
  - Scoreboard
  - Player list
  - Turn timer
  - Word display (for drawer)

## Responsive Design

- Mobile-first approach
- Canvas scales to screen size
- Collapsible sidebar on mobile
- Touch support for drawing