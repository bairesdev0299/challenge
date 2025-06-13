'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

interface DrawingCanvasProps {
    isDrawing: boolean;
    onDraw: (data: any) => void;
    width: number;
    height: number;
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>((props, ref) => {
    const { isDrawing, onDraw, width, height } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const lastTimeRef = useRef<number>(0);

    useImperativeHandle(ref, () => canvasRef.current!);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Configurar el tamaño del canvas
        canvas.width = width;
        canvas.height = height;

        // Configurar el estilo por defecto
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
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleStart = (clientX: number, clientY: number) => {
        if (!isDrawing) return;

        const coords = getCanvasCoordinates(clientX, clientY);
        isDrawingRef.current = true;
        lastPointRef.current = coords;
        lastTimeRef.current = Date.now();

        // Dibujar localmente
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }

        // Enviar datos de inicio
        onDraw({
            x: clientX - canvasRef.current!.getBoundingClientRect().left,
            y: clientY - canvasRef.current!.getBoundingClientRect().top,
            type: 'start',
            color: '#000000',
            lineWidth: 2
        });
    };

    const handleDraw = (clientX: number, clientY: number) => {
        if (!isDrawing || !isDrawingRef.current || !lastPointRef.current) return;

        const coords = getCanvasCoordinates(clientX, clientY);
        const now = Date.now();
        const timeDiff = now - lastTimeRef.current;

        // Solo enviar actualizaciones si han pasado al menos 16ms (60fps)
        if (timeDiff >= 16) {
            // Dibujar localmente
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
            }

            // Enviar datos de dibujo
            onDraw({
                x: clientX - canvasRef.current!.getBoundingClientRect().left,
                y: clientY - canvasRef.current!.getBoundingClientRect().top,
                type: 'draw',
                color: '#000000',
                lineWidth: 2
            });

            lastPointRef.current = coords;
            lastTimeRef.current = now;
        }
    };

    const handleEnd = () => {
        if (!isDrawing || !isDrawingRef.current) return;

        isDrawingRef.current = false;
        lastPointRef.current = null;

        // Dibujar localmente
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.closePath();
        }

        // Enviar datos de fin
        onDraw({
            x: 0,
            y: 0,
            type: 'end',
            color: '#000000',
            lineWidth: 2
        });
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
            handleDraw(e.clientX, e.clientY);
        };

        const handleMouseUp = (e: MouseEvent) => {
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
            const touch = e.touches[0];
            handleDraw(touch.clientX, touch.clientY);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            handleEnd();
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
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