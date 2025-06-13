
# Requerimiento: App Web de Pictionary (Versión Simplificada)

Quiero que desarrolles una aplicación web para jugar al Pictionary, con las siguientes características:

## Tecnologías

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS

- **Backend:**
  - FastAPI (Python)
  - WebSocket para comunicación en tiempo real
  - Almacenamiento en memoria (no usar base de datos)

## Objetivo funcional

Crear una app web de Pictionary simplificada donde:

1. Cada jugador se une a una sala ingresando su nombre.
2. Un jugador por vez dibuja una palabra aleatoria.
3. El resto de los jugadores intenta adivinar escribiendo la palabra.
4. Si alguien adivina correctamente:
   - El adivinador gana 1 punto.
   - El dibujante gana 1 punto.
   - Se muestra un mensaje indicando que se adivinó.
   - Se espera 3 segundos y se pasa automáticamente al siguiente turno.
5. El turno pasa al siguiente jugador de manera rotativa.
6. Se muestra en pantalla la tabla de puntuaciones actualizada.

## Requisitos de funcionalidad

### Frontend (React + TypeScript + Tailwind)

- Página de inicio para unirse a una sala (nombre + código de sala).
- Página principal del juego:
  - Si es tu turno:
    - Ves la palabra a dibujar (secreta para los demás).
    - Tenés acceso a un canvas para dibujar.
  - Si NO es tu turno:
    - Ves el canvas en tiempo real.
    - Tenés un input para adivinar la palabra.
- La tabla de puntuaciones debe estar visible durante el juego.
- El diseño debe ser limpio, funcional, y usar Tailwind.

### Canvas

- Implementar un componente DrawingCanvas.
- Solo el dibujante puede usar el mouse para dibujar.
- Los trazos deben enviarse por WebSocket como eventos `{ x, y, color, width, isDrawing }`.
- El backend debe reenviar esos eventos a los demás jugadores para que reproduzcan el dibujo en sus canvases.
- El canvas puede tener tamaño fijo (ej: 800x600).

### Backend (FastAPI)

- WebSocket en `/ws/{room_id}` para:
  - Enviar y recibir eventos de dibujo.
  - Recibir adivinanzas.
  - Enviar mensajes de aciertos.
  - Enviar mensajes de cambio de turno.
- Rutas HTTP para:
  - Crear sala
  - Unirse a sala

#### Estado mantenido en memoria:
- Lista de jugadores por sala
- Turno actual (índice)
- Palabra actual (elegida al azar de una lista fija)
- Tabla de puntuaciones
- Lista de conexiones WebSocket por sala

## Consideraciones

- No se implementan categorías de palabras ni autenticación.
- Las palabras se seleccionan aleatoriamente de una lista predefinida.
- No se necesita guardar datos permanentemente.
- El juego puede continuar indefinidamente o hasta que los jugadores decidan salir.
- El backend puede enviar un snapshot del dibujo actual a jugadores nuevos (opcional).

## Bonus (opcional)

- Mostrar temporizador por turno (por ejemplo, 60 segundos).
- Mostrar mensajes tipo “Juan adivinó la palabra!”.
- Reiniciar juego cuando se cumplan X rondas.