import React, { useRef } from 'react'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Semana 3 Tarea #7: Edificio "Recepción" placeholder
 * Edificio básico con colisiones para el campus virtual.
 */
export function BuildingReception({ position = [20, 0, -20] }: { position?: [number, number, number] }) {
    return (
        <RigidBody type="fixed" position={position} colliders="cuboid">
            <group>
                {/* Base del edificio */}
                <mesh position={[0, 4, 0]} castShadow receiveShadow>
                    <boxGeometry args={[12, 8, 10]} />
                    <meshStandardMaterial color="#445566" roughness={0.7} />
                </mesh>

                {/* Techo */}
                <mesh position={[0, 8.5, 0]} castShadow>
                    <boxGeometry args={[13, 1, 11]} />
                    <meshStandardMaterial color="#334455" roughness={0.6} />
                </mesh>

                {/* Puerta */}
                <mesh position={[0, 2, 5.01]}>
                    <boxGeometry args={[3, 4, 0.1]} />
                    <meshStandardMaterial color="#2a1810" />
                </mesh>

                {/* Ventanas */}
                {[-3, 3].map((x, i) => (
                    <mesh key={i} position={[x, 5, 5.01]}>
                        <boxGeometry args={[2, 2, 0.1]} />
                        <meshStandardMaterial
                            color="#88ccff"
                            emissive="#88ccff"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                ))}

                {/* Letrero */}
                <Text
                    position={[0, 7.5, 5.1]}
                    fontSize={0.5}
                    color="#00ddff"
                    anchorX="center"
                    anchorY="middle"
                >
                    RECEPCIÓN
                </Text>

                {/* Luz de entrada */}
                <pointLight position={[0, 3, 6]} color="#ffaa66" intensity={0.5} distance={10} />
            </group>
        </RigidBody>
    )
}

/**
 * Semana 3 Tarea #11: Bordes del mundo (muros invisibles)
 */
export function WorldBoundaries({ size = 100 }: { size?: number }) {
    const halfSize = size / 2
    const wallHeight = 20

    return (
        <group>
            {/* Muro Norte */}
            <RigidBody type="fixed" position={[0, wallHeight / 2, -halfSize]} colliders="cuboid">
                <mesh visible={false}>
                    <boxGeometry args={[size, wallHeight, 1]} />
                </mesh>
            </RigidBody>

            {/* Muro Sur */}
            <RigidBody type="fixed" position={[0, wallHeight / 2, halfSize]} colliders="cuboid">
                <mesh visible={false}>
                    <boxGeometry args={[size, wallHeight, 1]} />
                </mesh>
            </RigidBody>

            {/* Muro Este */}
            <RigidBody type="fixed" position={[halfSize, wallHeight / 2, 0]} colliders="cuboid">
                <mesh visible={false}>
                    <boxGeometry args={[1, wallHeight, size]} />
                </mesh>
            </RigidBody>

            {/* Muro Oeste */}
            <RigidBody type="fixed" position={[-halfSize, wallHeight / 2, 0]} colliders="cuboid">
                <mesh visible={false}>
                    <boxGeometry args={[1, wallHeight, size]} />
                </mesh>
            </RigidBody>
        </group>
    )
}

export default { BuildingReception, WorldBoundaries }
