import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import Avatar from './Avatar'

import RemotePlayer from './RemotePlayer'
import { useMultiplayer } from '../hooks/useMultiplayer'

/**
 * Tarea #3, #4, #5: Player Controller con Físicas + MULTIPLAYER
 * Implementa movimiento basado en velocidad, salto y seguimiento de cámara.
 */
export default function Player() {
    const body = useRef<RapierRigidBody>(null!)
    const { remotePlayers } = useMultiplayer(body) // Hook de Red
    const [, getKeys] = useKeyboardControls()
    const [anim, setAnim] = useState('Idle')

    // Vector reutilizable para dirección
    const direction = new THREE.Vector3()
    const frontVector = new THREE.Vector3()
    const sideVector = new THREE.Vector3()

    useFrame((state) => {
        if (!body.current) return

        // 1. Input Handling
        const { forward, backward, left, right, run, jump } = getKeys()

        // 2. Calcular Velocidad Deseada
        const velocity = body.current.linvel()

        frontVector.set(0, 0, Number(backward) - Number(forward))
        sideVector.set(Number(left) - Number(right), 0, 0)

        direction.subVectors(frontVector, sideVector).normalize()

        const speed = run ? 8 : 4
        const desiredX = direction.x * speed
        const desiredZ = direction.z * speed

        // 3. Aplicar Movimiento (Kinematic-like control over Dynamic body)
        body.current.setLinvel({ x: desiredX, y: velocity.y, z: desiredZ }, true)

        // 4. Salto (Tarea #4)
        // Raycast simple para "Grounded" check visual: velocity.y ~ 0
        if (jump && Math.abs(velocity.y) < 0.05) {
            body.current.applyImpulse({ x: 0, y: 5, z: 0 }, true)
        }

        // 5. Animación & Rotación
        if (direction.length() > 0) {
            setAnim(run ? 'Run' : 'Walk')
            // Rotación suave del modelo visual (no del RigidBody)
            // Aquí asumimos que el componente Avatar maneja su propia rotación interna
            // o rotamos un grupo contenedor interno. Para MVP, rotamos el player visual completo.
            // (Nota: Rapier bloquea rotación física, pero podemos rotar el mesh hijo? Sí).
        } else {
            setAnim('Idle')
        }

        // 6. Cámara Chase (Tarea #5)
        const pos = body.current.translation()
        const cameraTarget = new THREE.Vector3(pos.x, pos.y + 2, pos.z + 6)
        const lookTarget = new THREE.Vector3(pos.x, pos.y + 1, pos.z)

        state.camera.position.lerp(cameraTarget, 0.1)
        state.camera.lookAt(lookTarget)
    })

    return (
        <>
            <RigidBody
                ref={body}
                colliders={false}
                enabledRotations={[false, false, false]} // Evitar que el personaje se caiga (lock rotation physics)
                position={[0, 10, 0]} // Spawn point aéreo para caer al suelo
                friction={0} // Evitar pegarse a paredes
            >
                {/* Cápsula de Colisión (Tarea #2) */}
                <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />

                {/* Visual */}
                <Avatar animation={anim} />
            </RigidBody>

            {/* Renderizar Jugadores Remotos (Multiplayer) */}
            {Object.values(remotePlayers).map((player) => (
                <RemotePlayer key={player.id} data={player} />
            ))}
        </>
    )
}
