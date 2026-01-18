import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Semana 53: AR Mobile System
 * Sistema de Realidad Aumentada para móviles
 */

interface ARSessionState {
    isSupported: boolean;
    isActive: boolean;
    hitTestSource: any | null;
}

/**
 * Hook para estado de AR
 */
export function useARSession() {
    const [state, setState] = useState<ARSessionState>({
        isSupported: false,
        isActive: false,
        hitTestSource: null
    });

    useEffect(() => {
        checkARSupport();
    }, []);

    const checkARSupport = async () => {
        if ('xr' in navigator) {
            try {
                const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
                setState(prev => ({ ...prev, isSupported: supported }));
            } catch (e) {
                console.log('AR no soportado:', e);
            }
        }
    };

    const startARSession = async () => {
        if (!state.isSupported) return;

        try {
            const session = await (navigator as any).xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'local-floor'],
                optionalFeatures: ['dom-overlay'],
            });

            setState(prev => ({ ...prev, isActive: true }));
            return session;
        } catch (e) {
            console.error('Error iniciando AR:', e);
        }
    };

    const endARSession = () => {
        setState(prev => ({ ...prev, isActive: false, hitTestSource: null }));
    };

    return { ...state, startARSession, endARSession };
}

/**
 * Componente de modelo 3D en AR
 */
interface ARModelProps {
    modelUrl: string;
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function ARModel({ modelUrl, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }: ARModelProps) {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Rotación suave automática
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
            {/* Placeholder - En producción, usar useGLTF para cargar modelos */}
            <mesh castShadow>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="#7C4DFF" />
            </mesh>
        </group>
    );
}

/**
 * Marcador de superficie detectada
 */
export function ARSurfaceMarker({ position }: { position: [number, number, number] }) {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.15, 32]} />
            <meshBasicMaterial color="#00FF00" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
    );
}

/**
 * Portal AR para entrar al campus
 */
export function ARPortal({
    onEnter,
    position = [0, 0, -2]
}: {
    onEnter?: () => void;
    position?: [number, number, number];
}) {
    const portalRef = useRef<THREE.Mesh>(null);
    const [isNear, setIsNear] = useState(false);

    useFrame(() => {
        if (portalRef.current) {
            // Efecto de pulsación
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.05;
            portalRef.current.scale.set(scale, scale, 1);
        }
    });

    return (
        <group position={position}>
            {/* Borde del portal */}
            <mesh>
                <torusGeometry args={[0.8, 0.08, 16, 64]} />
                <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
            </mesh>

            {/* Interior del portal */}
            <mesh ref={portalRef} onClick={onEnter}>
                <circleGeometry args={[0.7, 64]} />
                <meshBasicMaterial color="#000040" transparent opacity={0.8} />
            </mesh>

            {/* Texto */}
            <group position={[0, 1, 0]}>
                {/* Usar Text de drei en producción */}
            </group>
        </group>
    );
}

/**
 * Escáner de marcadores (libros físicos)
 */
export function ARMarkerScanner({
    onMarkerDetected
}: {
    onMarkerDetected: (markerId: string) => void;
}) {
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const startScanning = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setScanning(true);
            }
        } catch (e) {
            console.error('Error accediendo a la cámara:', e);
        }
    };

    const stopScanning = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setScanning(false);
    };

    return (
        <div className="ar-scanner">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    display: scanning ? 'block' : 'none',
                    width: '100%',
                    maxHeight: '60vh'
                }}
            />

            {!scanning ? (
                <button onClick={startScanning} className="scan-btn">
                    📷 Escanear Libro
                </button>
            ) : (
                <div className="scanner-overlay">
                    <div className="scanner-frame">
                        <span>Apunta al código del libro</span>
                    </div>
                    <button onClick={stopScanning} className="cancel-btn">Cancelar</button>
                </div>
            )}
        </div>
    );
}

/**
 * Componente principal de AR
 */
export function ARView({ children }: { children?: React.ReactNode }) {
    const arSession = useARSession();
    const [placedObjects, setPlacedObjects] = useState<Array<{ id: string; position: [number, number, number] }>>([]);

    const handlePlaceObject = (position: [number, number, number]) => {
        setPlacedObjects(prev => [...prev, {
            id: `obj-${Date.now()}`,
            position
        }]);
    };

    if (!arSession.isSupported) {
        return (
            <div className="ar-not-supported">
                <p>⚠️ Tu dispositivo no soporta Realidad Aumentada</p>
                <p>Intenta con un navegador compatible (Chrome en Android, Safari en iOS)</p>
            </div>
        );
    }

    return (
        <div className="ar-container">
            {!arSession.isActive ? (
                <button onClick={arSession.startARSession} className="ar-start-btn">
                    🔮 Iniciar Experiencia AR
                </button>
            ) : (
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} />

                    {/* Objetos colocados */}
                    {placedObjects.map(obj => (
                        <ARModel key={obj.id} modelUrl="" position={obj.position} />
                    ))}

                    {children}
                </Canvas>
            )}
        </div>
    );
}

export default { ARView, ARModel, ARPortal, ARMarkerScanner, useARSession };
