import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

interface HologramPanelProps {
    position: [number, number, number]
    title: string
    isVisible: boolean
    onClose?: () => void
    children?: React.ReactNode
}

/**
 * Semana 8 Tarea #2: Panel Holográfico Flotante
 * Menú 3D que flota en el espacio con efecto de holograma.
 */
export default function HologramPanel({ position, title, isVisible, onClose, children }: HologramPanelProps) {
    const groupRef = useRef<THREE.Group>(null!)
    const [hovered, setHovered] = useState(false)

    useFrame((state) => {
        if (!groupRef.current || !isVisible) return

        const t = state.clock.getElapsedTime()

        // Flotación suave
        groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1

        // Rotación muy sutil
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05
    })

    if (!isVisible) return null

    return (
        <group ref={groupRef} position={position}>
            {/* Marco exterior con glow */}
            <RoundedBox
                args={[3, 2, 0.05]}
                radius={0.1}
                smoothness={4}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color="#001830"
                    transparent
                    opacity={0.9}
                    roughness={0.2}
                    metalness={0.8}
                />
            </RoundedBox>

            {/* Borde brillante */}
            <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[2.9, 1.9]} />
                <meshStandardMaterial
                    color="#003366"
                    emissive="#0066cc"
                    emissiveIntensity={hovered ? 0.8 : 0.4}
                    transparent
                    opacity={0.95}
                />
            </mesh>

            {/* Título */}
            <Text
                position={[0, 0.7, 0.06]}
                fontSize={0.15}
                color="#00ddff"
                anchorX="center"
                anchorY="middle"
                font="/fonts/Inter-Bold.woff"
            >
                {title}
            </Text>

            {/* Línea decorativa bajo el título */}
            <mesh position={[0, 0.55, 0.06]}>
                <planeGeometry args={[2.5, 0.01]} />
                <meshBasicMaterial color="#00aaff" />
            </mesh>

            {/* Contenido HTML */}
            <Html
                position={[0, 0, 0.1]}
                center
                distanceFactor={5}
                style={{ pointerEvents: 'auto' }}
            >
                <div style={{
                    width: '280px',
                    padding: '20px',
                    fontFamily: 'Inter, sans-serif',
                    color: 'white'
                }}>
                    {children}
                </div>
            </Html>

            {/* Botón de cierre */}
            {onClose && (
                <group position={[1.35, 0.85, 0.06]}>
                    <mesh onClick={onClose} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
                        <circleGeometry args={[0.1, 16]} />
                        <meshBasicMaterial color="#ff4466" />
                    </mesh>
                    <Text position={[0, 0, 0.01]} fontSize={0.08} color="white" anchorX="center" anchorY="middle">
                        ✕
                    </Text>
                </group>
            )}

            {/* Scanlines effect (decorativo) */}
            <mesh position={[0, 0, 0.04]}>
                <planeGeometry args={[2.9, 1.9]} />
                <meshBasicMaterial
                    color="#000000"
                    transparent
                    opacity={0.1}
                />
            </mesh>

            {/* Luces del panel */}
            <pointLight position={[0, 0, 1]} color="#00aaff" intensity={0.5} distance={3} />
        </group>
    )
}
