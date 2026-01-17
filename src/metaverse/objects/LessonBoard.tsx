import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

interface LessonBoardProps {
    id: string
    position: [number, number, number]
    title: string
    subject: string
    lessonData: {
        id: string
        title: string
        description: string
        subject: string
        duration: string
    }
    onRegister?: (id: string, data: any) => void
}

/**
 * Semana 7: Pizarra de Lección Interactuable
 * Objeto 3D que representa una lección. Al hacer clic, abre el panel de lección.
 */
export default function LessonBoard({ id, position, title, subject, lessonData, onRegister }: LessonBoardProps) {
    const groupRef = useRef<THREE.Group>(null!)
    const [hovered, setHovered] = useState(false)

    // Registrar como interactuable al montar
    useEffect(() => {
        if (onRegister && groupRef.current) {
            onRegister(id, {
                id,
                name: title,
                type: 'lesson',
                data: lessonData
            })
        }
    }, [id, title, lessonData, onRegister])

    // Animación de flotación y hover
    useFrame((state) => {
        if (!groupRef.current) return
        const t = state.clock.getElapsedTime()

        // Flotación suave
        groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05

        // Rotación lenta
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1

        // Escala en hover
        const targetScale = hovered ? 1.1 : 1
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    })

    const getSubjectColor = () => {
        switch (subject.toLowerCase()) {
            case 'matemáticas': return '#ff6b6b'
            case 'español': return '#4ecdc4'
            case 'historia': return '#ffe66d'
            case 'ciencias': return '#95e1d3'
            case 'inglés': return '#a8e6cf'
            default: return '#00ddff'
        }
    }

    return (
        <group
            ref={groupRef}
            position={position}
            name={id} // Importante para el raycaster
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Base de la pizarra */}
            <RoundedBox args={[2, 1.5, 0.1]} radius={0.05} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial
                    color={hovered ? '#1a3a5c' : '#0f2540'}
                    roughness={0.3}
                    metalness={0.8}
                />
            </RoundedBox>

            {/* Pantalla interna (glow) */}
            <mesh position={[0, 0, 0.06]}>
                <planeGeometry args={[1.8, 1.3]} />
                <meshStandardMaterial
                    color={getSubjectColor()}
                    emissive={getSubjectColor()}
                    emissiveIntensity={hovered ? 1.5 : 0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Título */}
            <Text
                position={[0, 0.3, 0.12]}
                fontSize={0.15}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="/fonts/Inter-Bold.woff"
            >
                {title.length > 20 ? title.substring(0, 20) + '...' : title}
            </Text>

            {/* Etiqueta de materia */}
            <Text
                position={[0, -0.2, 0.12]}
                fontSize={0.1}
                color="rgba(255,255,255,0.7)"
                anchorX="center"
                anchorY="middle"
            >
                📚 {subject}
            </Text>

            {/* Indicador de interacción */}
            {hovered && (
                <Text
                    position={[0, -0.55, 0.12]}
                    fontSize={0.08}
                    color="#00ff88"
                    anchorX="center"
                    anchorY="middle"
                >
                    [ E ] Abrir
                </Text>
            )}

            {/* Luz puntual */}
            <pointLight
                position={[0, 0, 0.5]}
                color={getSubjectColor()}
                intensity={hovered ? 2 : 0.5}
                distance={3}
            />
        </group>
    )
}
