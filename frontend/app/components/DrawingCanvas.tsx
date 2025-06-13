'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface DrawingCanvasProps {
    isDrawing: boolean;
    onDraw: (data: any) => void;
    width: number;
    height: number;
    drawingData?: any;
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>((props, ref) => {
    const { isDrawing, onDraw, width, height, drawingData } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => canvasRef.current!);

    // Efecto para manejar datos de dibujo recibidos
    useEffect(() => {
        if (!drawingData || isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y, color, lineWidth } = drawingData;
        console.log('=== RECEIVING PLAYER DRAWING INSTRUCTIONS ===');
        console.log('Drawing point received:', {
            x,
            y,
            color,
            lineWidth,
            canvasSize: {
                width: canvas.width,
                height: canvas.height
            }
        });

        // Configurar el estilo del trazo
        ctx.strokeStyle = color || '#000000';
        ctx.lineWidth = lineWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Dibujar el punto
        ctx.beginPath();
        ctx.arc(x, y, lineWidth/2, 0, Math.PI * 2);
        ctx.fill();
        console.log('=== END DRAWING INSTRUCTIONS ===');
    }, [drawingData, isDrawing]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [width, height]);

    const getCanvasCoordinates = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const interpolatePoints = (start: { x: number; y: number }, end: { x: number; y: number }) => {
        const points = [];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(Math.floor(distance / 2), 1); // Un punto cada 2 píxeles

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: start.x + dx * t,
                y: start.y + dy * t
            });
        }
        return points;
    };

    const sendPoint = (x: number, y: number) => {
        console.log('Sending point:', { x, y });
        onDraw({
            x,
            y,
            color: '#000000',
            lineWidth: 2
        });
    };

    const handleStart = (clientX: number, clientY: number) => {
        if (!isDrawing) return;
        console.log('Drawing started');
        isDrawingRef.current = true;
        const coords = getCanvasCoordinates(clientX, clientY);
        lastPointRef.current = coords;

        // Dibujar y enviar el primer punto
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        sendPoint(coords.x, coords.y);
    };

    const handleDraw = (clientX: number, clientY: number) => {
        if (!isDrawing || !isDrawingRef.current) return;

        const coords = getCanvasCoordinates(clientX, clientY);
        
        // Dibujar localmente
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enviar el punto actual
        sendPoint(coords.x, coords.y);
        lastPointRef.current = coords;
    };

    const handleEnd = () => {
        if (!isDrawingRef.current) return;
        console.log('Drawing ended');
        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            handleStart(e.clientX, e.clientY);
        };

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            if (isDrawingRef.current) {
                handleDraw(e.clientX, e.clientY);
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            handleEnd();
        };

        const handleMouseLeave = (e: MouseEvent) => {
            e.preventDefault();
            handleEnd();
        };

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (isDrawingRef.current) {
                const touch = e.touches[0];
                handleDraw(touch.clientX, touch.clientY);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            handleEnd();
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDrawing, onDraw]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                border: '1px solid #ccc',
                cursor: isDrawing ? 'crosshair' : 'default',
                touchAction: 'none',
                backgroundColor: 'white'
            }}
        />
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas; 