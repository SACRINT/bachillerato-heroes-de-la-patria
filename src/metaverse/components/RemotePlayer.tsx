import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import Avatar from './Avatar'
import { RemotePlayerState } from '../hooks/useMultiplayer'

interface Props {
    data: RemotePlayerState
}

/**
 * Representación de un Jugador Remoto
 * Interpola la posición para movimientos suaves.
 */
export default function RemotePlayer({ data }: Props) {
    const group = useRef<THREE.Group>(null!)
    const targetPos = new THREE.Vector3(data.position.x, data.position.y, data.position.z)

    useFrame((state, delta) => {
        if (!group.current) return

        // Interpolación lineal simple (Lerp) para suavizar el lag de red
        // Factor 10 = movimiento rápido pero suave.
        group.current.position.lerp(targetPos, delta * 12)

        // Rotación (si viniera en la data)
        // group.current.rotation.y = THREE.MathUtils.lerp(...)
    })

    return (
        <group ref={group} position={[data.position.x, data.position.y, data.position.z]}>
            {/* Reutilizamos el visual del Avatar */}
            <Avatar animation={data.animation || 'Idle'} />

            {/* Tarea #12: Nombre de Usuario */}
            <Html position={[0, 2.2, 0]} center>
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    whiteSpace: 'nowrap'
                }}>
                    Player {data.id.substr(0, 4)}
                </div>
            </Html>
        </group>
    )
}
