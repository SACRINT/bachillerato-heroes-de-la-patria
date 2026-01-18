import React, { useState, useRef } from 'react';
import { RigidBody, BallCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/** Balón interactivo con física */
function SoccerBall({ position }: { position: [number, number, number] }) {
    const ballRef = useRef<any>(null);

    return (
        <RigidBody
            ref={ballRef}
            position={position}
            colliders={false}
            restitution={0.8}
            friction={0.5}
            mass={0.5}
        >
            <BallCollider args={[0.3]} />
            <mesh castShadow>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
        </RigidBody>
    );
}

/** Portería */
function Goal({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Postes */}
            <mesh position={[-1.5, 1, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[1.5, 1, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
            {/* Travesaño */}
            <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 3, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
            </mesh>
        </group>
    );
}

/** Campo de fútbol */
function SoccerField() {
    return (
        <group position={[0, 0, 0]}>
            {/* Césped */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[30, 20]} />
                <meshStandardMaterial color="#4CAF50" />
            </mesh>

            {/* Líneas del campo */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[3, 3.1, 32]} />
                <meshBasicMaterial color="#FFFFFF" />
            </mesh>

            {/* Porterías */}
            <Goal position={[0, 0, -9]} rotation={0} />
            <Goal position={[0, 0, 9]} rotation={Math.PI} />

            {/* Balón */}
            <SoccerBall position={[0, 0.5, 0]} />
        </group>
    );
}

/** Plataforma de Parkour */
function ParkourPlatform({ position, size = [2, 0.3, 2] }: {
    position: [number, number, number];
    size?: [number, number, number];
}) {
    const [landed, setLanded] = useState(false);

    return (
        <RigidBody type="fixed" position={position} colliders="cuboid">
            <mesh
                castShadow
                receiveShadow
                onPointerDown={() => setLanded(true)}
            >
                <boxGeometry args={size} />
                <meshStandardMaterial
                    color={landed ? '#4CAF50' : '#FF9800'}
                    emissive={landed ? '#4CAF50' : '#000'}
                    emissiveIntensity={landed ? 0.2 : 0}
                />
            </mesh>
        </RigidBody>
    );
}

/** Zona de Parkour */
function ParkourZone() {
    const platforms = [
        { pos: [0, 0.5, 0], size: [3, 0.3, 3] },
        { pos: [4, 1, 0], size: [2, 0.3, 2] },
        { pos: [7, 1.5, 2], size: [2, 0.3, 2] },
        { pos: [10, 2, 0], size: [2, 0.3, 2] },
        { pos: [10, 2.5, -3], size: [2, 0.3, 2] },
        { pos: [7, 3, -5], size: [2, 0.3, 2] },
        { pos: [4, 3.5, -5], size: [3, 0.3, 3] }, // Meta
    ];

    return (
        <group position={[-15, 0, 0]}>
            <Text position={[0, 4, 0]} fontSize={0.5} color="#FF5722">
                🏃 Parkour Challenge
            </Text>

            {platforms.map((p, i) => (
                <ParkourPlatform
                    key={i}
                    position={p.pos as [number, number, number]}
                    size={p.size as [number, number, number]}
                />
            ))}
        </group>
    );
}

/** Zona Chill con música */
function ChillZone() {
    return (
        <group position={[20, 0, 0]}>
            {/* Área circular */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <circleGeometry args={[8, 32]} />
                <meshStandardMaterial color="#7986CB" />
            </mesh>

            {/* Pufs/Asientos */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return (
                    <mesh key={i} position={[Math.cos(rad) * 5, 0.4, Math.sin(rad) * 5]} castShadow>
                        <sphereGeometry args={[0.8, 16, 16]} />
                        <meshStandardMaterial color={`hsl(${angle}, 70%, 60%)`} />
                    </mesh>
                );
            })}

            {/* Altavoz central */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.7, 1.5, 16]} />
                <meshStandardMaterial color="#37474F" metalness={0.8} roughness={0.2} />
            </mesh>

            <Text position={[0, 2.5, 0]} fontSize={0.4} color="#FFFFFF">
                🎵 Chill Zone
            </Text>
        </group>
    );
}

/** Componente Principal del Patio */
export default function GamingArea() {
    return (
        <group position={[0, 0, -60]} name="gaming-area">
            {/* Suelo general del patio */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[80, 50]} />
                <meshStandardMaterial color="#8D6E63" />
            </mesh>

            {/* Zona de Fútbol */}
            <group position={[0, 0, 0]}>
                <SoccerField />
            </group>

            {/* Zona de Parkour */}
            <ParkourZone />

            {/* Zona Chill */}
            <ChillZone />

            {/* Leaderboard holográfico */}
            <group position={[-25, 0, 10]}>
                <mesh position={[0, 2, 0]}>
                    <boxGeometry args={[4, 3, 0.1]} />
                    <meshStandardMaterial
                        color="#1A237E"
                        transparent
                        opacity={0.8}
                        emissive="#1A237E"
                        emissiveIntensity={0.3}
                    />
                </mesh>
                <Text position={[0, 3, 0.1]} fontSize={0.3} color="#00E5FF">
                    🏆 LEADERBOARD
                </Text>
                <Text position={[0, 2.3, 0.1]} fontSize={0.2} color="#FFFFFF">
                    1. ProGamer - 1500 XP
                </Text>
                <Text position={[0, 2, 0.1]} fontSize={0.2} color="#FFFFFF">
                    2. StarPlayer - 1200 XP
                </Text>
                <Text position={[0, 1.7, 0.1]} fontSize={0.2} color="#FFFFFF">
                    3. Champion - 1100 XP
                </Text>
            </group>

            {/* Iluminación del patio */}
            <pointLight position={[0, 10, 0]} intensity={0.5} color="#FFF" />
            <pointLight position={[20, 5, 0]} intensity={0.3} color="#7C4DFF" />
        </group>
    );
}
