import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleSystemProps {
    type: 'dust' | 'leaves' | 'sparkles' | 'rain'
    count?: number
    area?: [number, number, number] // width, height, depth
    position?: [number, number, number]
}

/**
 * Semana 3 Tarea #9: Sistema de partículas (polvo/hojas)
 */
export default function ParticleSystem({
    type = 'dust',
    count = 100,
    area = [50, 20, 50],
    position = [0, 10, 0]
}: ParticleSystemProps) {
    const pointsRef = useRef<THREE.Points>(null!)

    const { positions, velocities, config } = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const velocities = new Float32Array(count * 3)

        // Configuración por tipo
        const configs = {
            dust: {
                color: 0xcccccc,
                size: 0.1,
                speed: 0.2,
                opacity: 0.3
            },
            leaves: {
                color: 0x88aa55,
                size: 0.3,
                speed: 0.5,
                opacity: 0.8
            },
            sparkles: {
                color: 0xffffaa,
                size: 0.15,
                speed: 0.8,
                opacity: 0.9
            },
            rain: {
                color: 0xaaccff,
                size: 0.05,
                speed: 3,
                opacity: 0.6
            }
        }

        const config = configs[type]

        // Inicializar posiciones aleatorias
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * area[0]
            positions[i * 3 + 1] = Math.random() * area[1]
            positions[i * 3 + 2] = (Math.random() - 0.5) * area[2]

            // Velocidades
            velocities[i * 3] = (Math.random() - 0.5) * 0.1
            velocities[i * 3 + 1] = -Math.random() * config.speed
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1
        }

        return { positions, velocities, config }
    }, [type, count, area])

    useFrame((state, delta) => {
        if (!pointsRef.current) return

        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < count; i++) {
            // Actualizar posición
            posArray[i * 3] += velocities[i * 3] * delta
            posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta
            posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta

            // Reset si sale del área
            if (posArray[i * 3 + 1] < 0) {
                posArray[i * 3 + 1] = area[1]
                posArray[i * 3] = (Math.random() - 0.5) * area[0]
                posArray[i * 3 + 2] = (Math.random() - 0.5) * area[2]
            }

            // Movimiento ondulatorio para hojas
            if (type === 'leaves') {
                posArray[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <points ref={pointsRef} position={position}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={config.size}
                color={config.color}
                transparent
                opacity={config.opacity}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    )
}
