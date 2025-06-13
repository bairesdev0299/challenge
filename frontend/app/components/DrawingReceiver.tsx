'use client';

import React, { useEffect, useRef } from 'react';

interface DrawingReceiverProps {
    width: number;
    height: number;
    drawingData?: any;
}

const DrawingReceiver: React.FC<DrawingReceiverProps> = ({ width, height, drawingData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

        // Dibujar el punto
        ctx.beginPath();
        ctx.arc(x, y, lineWidth/2, 0, Math.PI * 2);
        ctx.fill();
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