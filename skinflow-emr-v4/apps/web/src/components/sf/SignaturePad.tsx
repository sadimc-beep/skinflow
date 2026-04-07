'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadHandle {
    isEmpty: () => boolean;
    toBlob: (callback: (blob: Blob | null) => void) => void;
    clear: () => void;
}

interface SignaturePadProps {
    width?: number;
    height?: number;
    className?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
    function SignaturePad({ width = 600, height = 200, className = '' }, ref) {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const drawing = useRef(false);
        const lastPos = useRef<{ x: number; y: number } | null>(null);
        const hasStrokes = useRef(false);

        const getPos = (e: PointerEvent, canvas: HTMLCanvasElement) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        };

        const clear = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasStrokes.current = false;
        }, []);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.strokeStyle = '#1C1917';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const onDown = (e: PointerEvent) => {
                drawing.current = true;
                lastPos.current = getPos(e, canvas);
                canvas.setPointerCapture(e.pointerId);
            };

            const onMove = (e: PointerEvent) => {
                if (!drawing.current || !lastPos.current) return;
                const pos = getPos(e, canvas);
                ctx.beginPath();
                ctx.moveTo(lastPos.current.x, lastPos.current.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                lastPos.current = pos;
                hasStrokes.current = true;
            };

            const onUp = () => {
                drawing.current = false;
                lastPos.current = null;
            };

            canvas.addEventListener('pointerdown', onDown);
            canvas.addEventListener('pointermove', onMove);
            canvas.addEventListener('pointerup', onUp);
            canvas.addEventListener('pointerleave', onUp);

            return () => {
                canvas.removeEventListener('pointerdown', onDown);
                canvas.removeEventListener('pointermove', onMove);
                canvas.removeEventListener('pointerup', onUp);
                canvas.removeEventListener('pointerleave', onUp);
            };
        }, []);

        useImperativeHandle(ref, () => ({
            isEmpty: () => !hasStrokes.current,
            toBlob: (callback) => {
                const canvas = canvasRef.current;
                if (!canvas) { callback(null); return; }
                canvas.toBlob(callback, 'image/png');
            },
            clear,
        }));

        return (
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={`touch-none cursor-crosshair ${className}`}
                style={{ touchAction: 'none' }}
            />
        );
    },
);
