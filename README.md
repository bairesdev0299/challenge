# Pictionary Game

Un juego de Pictionary en tiempo real donde los jugadores pueden dibujar y adivinar palabras*.

* al momento funciona bien con rectas, la interpolación curva no llegó a lograrse.

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

2. Crea y activa el entorno virtual:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En Unix/MacOS
   # o
   .\venv\Scripts\activate  # En Windows
   ```

3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus configuraciones específicas.

5. Inicia el servidor:
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
2. Acceder a la sala del juego
3. Invita a otros jugadores compartiendo la url del juego
4. Cuando todos los jugadores estén en la sala, el juego comenzará automáticamente
5. Cada jugador tendrá su turno para dibujar una palabra mientras los demás intentan adivinar. El sisetma asigna aleatoriamente los turnos
6. Mientras un jugador dibujar el puede adivinar ingresando la palabra que creen, es la correcta
7. Si un jugador acierta, gana un punto el jugador y el dibujante. Todos los puntos se acumulan. El jugador con más puntos al final gana

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

## License

MIT 