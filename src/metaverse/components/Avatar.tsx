import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

interface AvatarProps {
    animation: string // 'Idle' | 'Walk' | 'Run'
    modelUrl?: string
}

/**
 * Tarea #2, #4, #9: Componente Visual del Avatar
 * Muestra el personaje y gestiona sus animaciones (Procedurales por ahora).
 */
export default function Avatar({ animation, modelUrl }: AvatarProps) {
    const group = useRef<THREE.Group>(null!)

    // En Fase 2 (Assets) aquí usaremos useGLTF(modelUrl) y useAnimations()

    useFrame((state) => {
        if (!group.current) return
        const t = state.clock.getElapsedTime()

        // Animación Procedural "Bobbing" según estado
        if (animation === 'Idle') {
            // Respiración suave
            group.current.scale.y = 1 + Math.sin(t * 2) * 0.005
            group.current.position.y = Math.sin(t) * 0.01
        } else if (animation === 'Walk') {
            // Caminata (rebote)
            group.current.position.y = Math.abs(Math.sin(t * 12)) * 0.1
            group.current.rotation.z = Math.cos(t * 12) * 0.05
        } else if (animation === 'Run') {
            // Carrera (rebote rápido e inclinación)
            group.current.position.y = Math.abs(Math.sin(t * 18)) * 0.15
            group.current.rotation.x = 0.2 // Indicar velocidad
        } else {
            group.current.rotation.x = 0
        }
    })

    return (
        <group ref={group} dispose={null}>
            {/* Cuerpo Roboto (Placeholder Stylish) */}
            <group position={[0, 0.75, 0]}>
                <mesh castShadow receiveShadow>
                    <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
                    <meshStandardMaterial
                        color={animation === 'Run' ? '#ffaa00' : '#0088ff'}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>

                {/* Cabeza */}
                <group position={[0, 0.65, 0]}>
                    <mesh castShadow>
                        <sphereGeometry args={[0.22, 20, 20]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.1} />
                    </mesh>
                    {/* Visor */}
                    <mesh position={[0, 0.05, 0.15]}>
                        <boxGeometry args={[0.3, 0.08, 0.15]} />
                        <meshStandardMaterial color="#111111" />
                    </mesh>
                </group>
            </group>

            {/* Tarea #9: Sombra simple (Blob Shadow) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[0.35, 32]} />
                <meshBasicMaterial color="#000000" opacity={0.4} transparent />
            </mesh>
        </group>
    )
}
