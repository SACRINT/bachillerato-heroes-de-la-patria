import React, { useEffect, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { XR, Controllers, Hands, VRButton, useXR } from '@react-three/xr';
import * as THREE from 'three';

/**
 * Semana 52: VR Controller System
 * Manejo de controladores Quest 2/3 y interacciones VR
 */

interface VRControllerProps {
    hand: 'left' | 'right';
    onGrab?: (object: THREE.Object3D) => void;
    onRelease?: () => void;
}

export function VRController({ hand, onGrab, onRelease }: VRControllerProps) {
    const { player } = useXR();
    const [isGrabbing, setIsGrabbing] = useState(false);

    useFrame(() => {
        // Actualizar posición del rayo del controlador
        if (player) {
            // El rayo se actualiza automáticamente por XR
        }
    });

    const rayColor = hand === 'left' ? '#00FF00' : '#FF0000';

    return (
        <group>
            {/* Rayo de apuntado usando un cilindro delgado */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -2.5]}>
                <cylinderGeometry args={[0.005, 0.005, 5, 8]} />
                <meshBasicMaterial color={rayColor} transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

/**
 * Sistema de teletransporte VR
 */
export function VRTeleport() {
    const { player } = useXR();
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const markerRef = useRef<THREE.Mesh>(null);

    const handleTeleport = () => {
        if (targetPosition && player) {
            player.position.copy(targetPosition);
        }
    };

    return (
        <>
            {/* Marcador de destino */}
            {targetPosition && (
                <mesh ref={markerRef} position={targetPosition}>
                    <ringGeometry args={[0.3, 0.5, 32]} />
                    <meshBasicMaterial color="#00FFFF" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
            )}
        </>
    );
}

/**
 * Teclado Virtual VR
 */
export function VRKeyboard({
    onInput,
    position = [0, 1.2, -1]
}: {
    onInput: (text: string) => void;
    position?: [number, number, number];
}) {
    const [text, setText] = useState('');

    const keys = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫', '↵']
    ];

    const handleKeyPress = (key: string) => {
        if (key === '⌫') {
            setText(prev => prev.slice(0, -1));
        } else if (key === '↵') {
            onInput(text);
            setText('');
        } else {
            setText(prev => prev + key);
        }
    };

    return (
        <group position={position} rotation={[-0.3, 0, 0]}>
            {/* Display */}
            <mesh position={[0, 0.3, 0]}>
                <planeGeometry args={[1.2, 0.15]} />
                <meshBasicMaterial color="#1a1a2e" />
            </mesh>

            {/* Teclas */}
            {keys.map((row, rowIndex) => (
                <group key={rowIndex} position={[0, -rowIndex * 0.11, 0]}>
                    {row.map((key, keyIndex) => (
                        <mesh
                            key={key}
                            position={[(keyIndex - row.length / 2 + 0.5) * 0.11, 0, 0]}
                            onClick={() => handleKeyPress(key)}
                        >
                            <boxGeometry args={[0.1, 0.1, 0.02]} />
                            <meshStandardMaterial color="#3F51B5" />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

/**
 * Proveedor principal de VR
 */
export function VRProvider({ children }: { children: React.ReactNode }) {
    const [vrSupported, setVrSupported] = useState(false);

    useEffect(() => {
        if ('xr' in navigator) {
            (navigator as any).xr?.isSessionSupported('immersive-vr').then((supported: boolean) => {
                setVrSupported(supported);
            });
        }
    }, []);

    return (
        <>
            <XR>
                <Controllers />
                <Hands />
                {children}
            </XR>
        </>
    );
}

/**
 * Botón de entrada a VR
 */
export function VREntryButton() {
    return <VRButton />;
}

/**
 * Hook para detectar estado VR
 */
export function useVRStatus() {
    const { isPresenting, player } = useXR();

    return {
        isInVR: isPresenting,
        playerPosition: player?.position,
        playerRotation: player?.rotation
    };
}

/**
 * Wrapper de escena optimizada para VR
 * - Ajusta escala 1:1
 * - Optimiza renderizado estéreo
 */
export function VRScene({ children }: { children: React.ReactNode }) {
    const { gl } = useThree();

    useEffect(() => {
        // Configurar para VR
        gl.xr.enabled = true;
        gl.setPixelRatio(window.devicePixelRatio);
    }, [gl]);

    return (
        <group>
            {/* Suelo de referencia para VR */}
            <gridHelper args={[100, 100, '#444', '#222']} />

            {children}
        </group>
    );
}

export default { VRProvider, VRController, VRTeleport, VRKeyboard, VREntryButton, VRScene, useVRStatus };
