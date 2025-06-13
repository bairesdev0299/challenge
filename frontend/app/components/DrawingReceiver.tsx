'use client';

import React, { useEffect, useRef } from 'react';

interface DrawingReceiverProps {
    width: number;
    height: number;
    drawingData?: any;
}

const DrawingReceiver: React.FC<DrawingReceiverProps> = ({ width, height, drawingData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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

    useEffect(() => {
        if (!drawingData) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Asegurarnos de que los datos sean números
        const x = Number(drawingData.x);
        const y = Number(drawingData.y);
        const lineWidth = Number(drawingData.lineWidth) || 2;
        const color = drawingData.color || '#000000';

        console.log('=== DRAWING RECEIVER ===');
        console.log('Drawing point:', { x, y, color, lineWidth });

        // Configurar el estilo del trazo
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Si hay un último punto, interpolar y dibujar
        if (lastPointRef.current) {
            const interpolatedPoints = interpolatePoints(lastPointRef.current, { x, y });
            
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            
            interpolatedPoints.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            
            ctx.stroke();
        } else {
            // Si no hay último punto, dibujar un punto
            ctx.beginPath();
            ctx.arc(x, y, lineWidth/2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Actualizar el último punto
        lastPointRef.current = { x, y };
        
        console.log('=== END DRAWING RECEIVER ===');
    }, [drawingData]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                border: '1px solid #ccc',
                backgroundColor: 'white',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none' // Permite que los eventos pasen al canvas de dibujo
            }}
        />
    );
};

export default DrawingReceiver; 