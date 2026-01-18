import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Definición de zonas del campus
export const CAMPUS_ZONES = {
    PLAZA_CENTRAL: { position: [0, 0, 0], radius: 25, name: 'Plaza Central' },
    BIBLIOTECA: { position: [60, 0, 0], radius: 20, name: 'Biblioteca' },
    AULAS: { position: [-50, 0, 40], radius: 30, name: 'Edificio de Aulas' },
    PATIO: { position: [0, 0, -60], radius: 25, name: 'Patio de Recreo' },
    ADMIN: { position: [-60, 0, -30], radius: 15, name: 'Administración' },
} as const;

// POIs para teletransporte
export const TELEPORT_POINTS = Object.entries(CAMPUS_ZONES).map(([key, zone]) => ({
    id: key,
    name: zone.name,
    position: zone.position as [number, number, number],
}));

interface BuildingProps {
    position: [number, number, number];
    size: [number, number, number];
    color: string;
    name: string;
}

/** Edificio Whitebox genérico */
function WhiteboxBuilding({ position, size, color, name }: BuildingProps) {
    return (
        <group position={position}>
            <RigidBody type="fixed" colliders="cuboid">
                <mesh castShadow receiveShadow>
                    <boxGeometry args={size} />
                    <meshStandardMaterial color={color} />
                </mesh>
            </RigidBody>
            {/* Cartel del edificio */}
            <Text
                position={[0, size[1] / 2 + 2, size[2] / 2 + 0.1]}
                fontSize={2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor="#000000"
            >
                {name}
            </Text>
        </group>
    );
}

/** Plaza Central - Spawn Point */
function PlazaCentral() {
    return (
        <group position={[0, 0.1, 0]}>
            {/* Suelo de la plaza */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[25, 32]} />
                    <meshStandardMaterial color="#8B7355" />
                </mesh>
            </RigidBody>

            {/* Fuente central */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[4, 5, 2, 16]} />
                <meshStandardMaterial color="#607D8B" />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[1.5, 16, 16]} />
                <meshStandardMaterial color="#2196F3" transparent opacity={0.7} />
            </mesh>

            {/* Bancos alrededor */}
            {[0, 90, 180, 270].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * 15;
                const z = Math.sin(rad) * 15;
                return (
                    <mesh key={i} position={[x, 0.5, z]} rotation={[0, -rad + Math.PI / 2, 0]} castShadow>
                        <boxGeometry args={[3, 0.5, 1]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Caminos/Senderos */
function Pathways() {
    const pathMaterial = new THREE.MeshStandardMaterial({ color: '#9E9E9E' });

    return (
        <group>
            {/* Camino a Biblioteca */}
            <mesh position={[30, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[60, 5]} />
                <primitive object={pathMaterial} attach="material" />
            </mesh>

            {/* Camino a Aulas */}
            <mesh position={[-25, 0.05, 20]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
                <planeGeometry args={[50, 5]} />
                <primitive object={pathMaterial} attach="material" />
            </mesh>

            {/* Camino al Patio */}
            <mesh position={[0, 0.05, -30]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[5, 60]} />
                <primitive object={pathMaterial} attach="material" />
            </mesh>
        </group>
    );
}

/** Límites del mundo (Montañas/Agua) */
function WorldBoundaries() {
    return (
        <group>
            {/* Montañas de fondo */}
            {[-100, 100].map((x, i) => (
                <mesh key={`mountain-${i}`} position={[x, 0, 0]} castShadow>
                    <coneGeometry args={[30, 50, 4]} />
                    <meshStandardMaterial color="#4E342E" />
                </mesh>
            ))}

            {/* Agua/Lago decorativo */}
            <mesh position={[80, -0.5, -80]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[30, 32]} />
                <meshStandardMaterial color="#1565C0" transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

/** Señalética 3D */
function SignPost({ position, text }: { position: [number, number, number]; text: string }) {
    return (
        <group position={position}>
            {/* Poste */}
            <mesh position={[0, 1.5, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
                <meshStandardMaterial color="#795548" />
            </mesh>
            {/* Cartel */}
            <mesh position={[0, 3, 0]} castShadow>
                <boxGeometry args={[3, 1, 0.1]} />
                <meshStandardMaterial color="#FFC107" />
            </mesh>
            <Text position={[0, 3, 0.1]} fontSize={0.4} color="#000000">
                {text}
            </Text>
        </group>
    );
}

/** Componente Principal del Campus */
export default function CampusLayout() {
    return (
        <group name="campus-layout">
            {/* Plaza Central (Spawn) */}
            <PlazaCentral />

            {/* Edificios Whitebox */}
            <WhiteboxBuilding
                position={[60, 10, 0]}
                size={[30, 20, 25]}
                color="#1565C0"
                name="📚 Biblioteca"
            />
            <WhiteboxBuilding
                position={[-50, 8, 40]}
                size={[40, 16, 30]}
                color="#43A047"
                name="🏫 Aulas"
            />
            <WhiteboxBuilding
                position={[0, 6, -60]}
                size={[50, 12, 35]}
                color="#FF7043"
                name="⚽ Patio"
            />
            <WhiteboxBuilding
                position={[-60, 6, -30]}
                size={[20, 12, 20]}
                color="#7E57C2"
                name="🏛️ Admin"
            />

            {/* Caminos */}
            <Pathways />

            {/* Límites del mundo */}
            <WorldBoundaries />

            {/* Señalética */}
            <SignPost position={[20, 0, 0]} text="→ Biblioteca" />
            <SignPost position={[-15, 0, 15]} text="← Aulas" />
            <SignPost position={[0, 0, -20]} text="↓ Patio" />
        </group>
    );
}
