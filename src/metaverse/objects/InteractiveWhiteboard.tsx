import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface WhiteboardProps {
    position: [number, number, number];
    width?: number;
    height?: number;
    canEdit?: boolean;
}

interface DrawPoint {
    x: number;
    y: number;
    color: string;
    size: number;
    type: 'start' | 'draw' | 'end';
}

/**
 * Semana 26: Pizarra Interactiva 3D con Canvas sincronizable
 */
export default function InteractiveWhiteboard({
    position,
    width = 6,
    height = 3,
    canEdit = true
}: WhiteboardProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textureRef = useRef<THREE.CanvasTexture | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [showTools, setShowTools] = useState(false);

    // Crear canvas para dibujo
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        canvasRef.current = canvas;
        textureRef.current = new THREE.CanvasTexture(canvas);
        textureRef.current.needsUpdate = true;

        return () => {
            textureRef.current?.dispose();
        };
    }, []);

    // Actualizar textura cada frame
    useFrame(() => {
        if (textureRef.current) {
            textureRef.current.needsUpdate = true;
        }
    });

    // Convertir coordenadas de ratón a coordenadas del canvas
    const getCanvasCoords = useCallback((uv: THREE.Vector2): { x: number; y: number } | null => {
        if (!canvasRef.current) return null;

        return {
            x: uv.x * canvasRef.current.width,
            y: (1 - uv.y) * canvasRef.current.height
        };
    }, []);

    // Dibujar en el canvas
    const draw = useCallback((coords: { x: number; y: number }, isNewStroke: boolean) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isNewStroke) {
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        } else {
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    }, [currentColor, brushSize]);

    // Limpiar pizarra
    const clearBoard = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, []);

    // Guardar como imagen
    const saveAsImage = useCallback(() => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.download = `pizarra-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    }, []);

    // Colores disponibles
    const colors = ['#000000', '#E53935', '#1E88E5', '#43A047', '#FDD835', '#8E24AA', '#FF6F00'];

    return (
        <group position={position}>
            {/* Marco de la pizarra */}
            <mesh position={[0, 0, -0.05]} castShadow>
                <boxGeometry args={[width + 0.3, height + 0.3, 0.1]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>

            {/* Superficie de dibujo */}
            <mesh
                ref={meshRef}
                onPointerDown={(e) => {
                    if (!canEdit) return;
                    e.stopPropagation();
                    setIsDrawing(true);
                    const coords = getCanvasCoords(e.uv!);
                    if (coords) draw(coords, true);
                }}
                onPointerMove={(e) => {
                    if (!isDrawing || !canEdit) return;
                    const coords = getCanvasCoords(e.uv!);
                    if (coords) draw(coords, false);
                }}
                onPointerUp={() => setIsDrawing(false)}
                onPointerLeave={() => setIsDrawing(false)}
                onClick={() => setShowTools(!showTools)}
            >
                <planeGeometry args={[width, height]} />
                {textureRef.current && (
                    <meshBasicMaterial map={textureRef.current} />
                )}
            </mesh>

            {/* Panel de herramientas flotante */}
            {showTools && canEdit && (
                <Html position={[width / 2 + 0.5, 0, 0]} center>
                    <div className="whiteboard-tools">
                        <div className="color-picker">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    style={{ background: color }}
                                    className={currentColor === color ? 'selected' : ''}
                                    onClick={() => setCurrentColor(color)}
                                />
                            ))}
                        </div>
                        <div className="size-slider">
                            <label>Tamaño: {brushSize}</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="actions">
                            <button onClick={clearBoard}>🗑️ Limpiar</button>
                            <button onClick={saveAsImage}>💾 Guardar</button>
                        </div>
                    </div>
                </Html>
            )}

            {/* Bandeja de tizas decorativa */}
            <mesh position={[0, -height / 2 - 0.15, 0.1]} castShadow>
                <boxGeometry args={[width * 0.8, 0.1, 0.15]} />
                <meshStandardMaterial color="#795548" />
            </mesh>
        </group>
    );
}
