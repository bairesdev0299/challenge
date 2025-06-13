'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  onDraw: (data: { x: number; y: number; type: string }) => void;
  width: number;
  height: number;
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ isDrawing, onDraw, width, height }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const lastSentPointRef = useRef<{ x: number; y: number } | null>(null);
    const lastSendTimeRef = useRef(0);
    const MIN_DISTANCE = 5; // Distancia mínima entre puntos para enviar
    const MIN_TIME = 16; // Tiempo mínimo entre envíos (60fps)

    useImperativeHandle(ref, () => canvasRef.current!);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Set default styles
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, [width, height]);

    const getCoordinates = (event: MouseEvent | TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      return {
        x: Math.round(clientX - rect.left),
        y: Math.round(clientY - rect.top),
      };
    };

    const shouldSendPoint = useCallback((point: { x: number; y: number }) => {
      const now = Date.now();
      const lastPoint = lastSentPointRef.current;
      
      if (!lastPoint) return true;
      
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + 
        Math.pow(point.y - lastPoint.y, 2)
      );
      
      return distance >= MIN_DISTANCE && (now - lastSendTimeRef.current) >= MIN_TIME;
    }, []);

    const startDrawing = (event: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      isDrawingRef.current = true;
      const point = getCoordinates(event);
      lastPointRef.current = point;
      lastSentPointRef.current = point;
      lastSendTimeRef.current = Date.now();
      onDraw({ ...point, type: 'start' });
    };

    const draw = (event: MouseEvent | TouchEvent) => {
      if (!isDrawing || !isDrawingRef.current) return;
      event.preventDefault();
      const point = getCoordinates(event);
      const lastPoint = lastPointRef.current;
      if (!lastPoint) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Dibujar localmente
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      // Enviar punto solo si cumple con los criterios
      if (shouldSendPoint(point)) {
        onDraw({ ...point, type: 'draw' });
        lastSentPointRef.current = point;
        lastSendTimeRef.current = Date.now();
      }

      lastPointRef.current = point;
    };

    const stopDrawing = (event: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      isDrawingRef.current = false;
      const point = lastPointRef.current;
      if (point) {
        onDraw({ ...point, type: 'end' });
      }
      lastPointRef.current = null;
      lastSentPointRef.current = null;
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      // Touch events
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
      };
    }, [isDrawing]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ccc',
          touchAction: 'none',
          cursor: isDrawing ? 'crosshair' : 'default',
        }}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas; 