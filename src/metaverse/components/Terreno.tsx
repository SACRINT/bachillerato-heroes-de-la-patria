import React, { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'

/**
 * Tarea #2 + #6: Terreno Físico
 * Genera el mesh visual Y el collider de físicas para caminar sobre él.
 */
export default function Terreno() {
    const terrainGeometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(300, 300, 60, 60)
        const positions = geo.attributes.position

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i)
            const y = positions.getY(i)
            const dist = Math.sqrt(x * x + y * y)
            const flatFactor = Math.min(1, Math.max(0, (dist - 25) / 15))

            const h1 = Math.sin(x * 0.04) * Math.cos(y * 0.04) * 8
            const h2 = Math.sin(x * 0.1 + 100) * Math.cos(y * 0.1) * 3

            const height = (h1 + h2) * flatFactor
            positions.setZ(i, height)
        }
        geo.computeVertexNormals()
        return geo
    }, [])

    return (
        // RigidBody Fixed: El suelo no se mueve, pero interactúa con físicos
        // Colliders="trimesh": Genera colisión exacta basada en la geometría (Mesh)
        <RigidBody type="fixed" colliders="trimesh" friction={1}>
            <mesh
                geometry={terrainGeometry}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -2, 0]}
                receiveShadow
            >
                <meshStandardMaterial
                    color="#2c3e50"
                    roughness={0.9}
                    metalness={0.1}
                    flatShading={true}
                />
            </mesh>
        </RigidBody>
    )
}
