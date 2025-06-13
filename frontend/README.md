# Pictionary Game Frontend

This is the frontend application for the Pictionary game, built with Next.js, TypeScript, and Tailwind CSS.

## Project Structure

```
frontend/
├── src/
│   └── app/                 # Next.js app directory
│       ├── layout.tsx      # Root layout component
│       ├── page.tsx        # Home page component
│       └── globals.css     # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Technologies Used

- **Next.js**: React framework for production
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Geist Fonts**: Custom fonts for the application

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific settings, especially the backend WebSocket URL.

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## Environment Variables

```ini
# Backend Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws

# Game Configuration
NEXT_PUBLIC_ROUND_TIME=60
NEXT_PUBLIC_MIN_PLAYERS=2
NEXT_PUBLIC_MAX_PLAYERS=8
```

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

## Features

- Real-time drawing canvas
- Player score tracking
- Game room management
- Responsive design
- Dark mode support

## Components

### Layout (`layout.tsx`)
- Root layout component
- Font configuration
- Global styles

### Home Page (`page.tsx`)
- Main landing page
- Game options
- Navigation

## Styling

The application uses Tailwind CSS for styling with the following features:
- Responsive design
- Dark mode support
- Custom font configuration
- Utility-first approach

## TypeScript

The project uses TypeScript for type safety. Key type definitions include:
- Component props
- WebSocket events
- Game state
- Player information

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
