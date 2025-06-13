# Pictionary Game

Un juego de Pictionary en tiempo real donde los jugadores pueden dibujar y adivinar palabras.

## Requisitos

### Backend
- Python 3.8+
- pip (gestor de paquetes de Python)

### Frontend
- Node.js 18+
- npm (gestor de paquetes de Node.js)

## Configuración

### Backend
1. Navega al directorio del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Inicia el servidor:
   ```bash
   uvicorn app.main:app --reload
   ```
   El servidor se ejecutará en `http://localhost:8000`

### Frontend
1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`

## Cómo jugar

1. Abre la aplicación en tu navegador (`http://localhost:3000`)
2. Crea una nueva sala o únete a una existente
3. Invita a otros jugadores compartiendo el ID de la sala
4. Cuando todos los jugadores estén en la sala, el juego comenzará automáticamente
5. Cada jugador tendrá su turno para dibujar una palabra mientras los demás intentan adivinar
6. El juego termina después de que cada jugador haya dibujado 3 veces
7. El jugador con más puntos al final gana

## Características

- Dibujo en tiempo real
- Sistema de puntuación
- Chat para adivinar palabras
- Lista de jugadores y puntuaciones
- Interfaz intuitiva y responsive
- Soporte para múltiples salas de juego

## Tecnologías utilizadas

### Backend
- FastAPI
- WebSockets
- Python

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- WebSocket API

## Development

- Backend API documentation is available at `http://localhost:8000/docs`
- The frontend uses Vite for fast development and building
- Tailwind CSS is used for styling

## License

MIT 