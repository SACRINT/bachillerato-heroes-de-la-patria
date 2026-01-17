import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'

interface ChatBubble3DProps {
    message: string
    position: [number, number, number]
    duration?: number // Tiempo visible en ms
    onComplete?: () => void
}

/**
 * Semana 8 Tarea #4: Burbuja de Chat 3D
 * Aparece sobre el avatar cuando el jugador envía un mensaje.
 */
export default function ChatBubble3D({ message, position, duration = 5000, onComplete }: ChatBubble3DProps) {
    const groupRef = useRef<THREE.Group>(null!)
    const [opacity, setOpacity] = useState(1)
    const [visible, setVisible] = useState(true)
    const startTime = useRef(Date.now())

    // Animación de aparición y desvanecimiento
    useFrame(() => {
        if (!groupRef.current) return

        const elapsed = Date.now() - startTime.current
        const fadeStart = duration - 1000 // Comenzar fade 1s antes

        // Billboard effect - siempre mira a la cámara
        groupRef.current.quaternion.copy(groupRef.current.parent?.quaternion || new THREE.Quaternion())

        // Animación de flotación
        groupRef.current.position.y = position[1] + Math.sin(elapsed * 0.003) * 0.05

        // Fade out
        if (elapsed > fadeStart) {
            const fadeProgress = (elapsed - fadeStart) / 1000
            setOpacity(1 - fadeProgress)
        }

        // Remover después de duration
        if (elapsed > duration) {
            setVisible(false)
            onComplete?.()
        }
    })

    if (!visible) return null

    // Truncar mensaje largo
    const displayText = message.length > 50 ? message.substring(0, 47) + '...' : message

    return (
        <group ref={groupRef} position={position}>
            <Html
                center
                distanceFactor={8}
                style={{
                    opacity,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                }}
            >
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 40, 80, 0.95), rgba(0, 60, 100, 0.9))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 200, 255, 0.4)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    maxWidth: '200px',
                    color: 'white',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 150, 255, 0.2)',
                    animation: 'bubble-pop 0.3s ease-out'
                }}>
                    {displayText}
                    {/* Flecha inferior */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid rgba(0, 60, 100, 0.9)'
                    }} />
                </div>
            </Html>

            <style>{`
        @keyframes bubble-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </group>
    )
}
