import React, { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PositionalAudio } from '@react-three/drei'

/**
 * Semana 3 Tarea #12: Audio Ambiental 3D
 */

interface AmbientAudio3DProps {
    url: string
    position?: [number, number, number]
    volume?: number
    refDistance?: number
    loop?: boolean
    autoplay?: boolean
}

export function AmbientAudio3D({
    url,
    position = [0, 0, 0],
    volume = 0.5,
    refDistance = 10,
    loop = true,
    autoplay = true
}: AmbientAudio3DProps) {
    const soundRef = useRef<THREE.PositionalAudio>(null!)
    const { camera } = useThree()

    useEffect(() => {
        // Crear listener si no existe
        if (!camera.children.find(c => c instanceof THREE.AudioListener)) {
            const listener = new THREE.AudioListener()
            camera.add(listener)
        }
    }, [camera])

    return (
        <group position={position}>
            <PositionalAudio
                ref={soundRef}
                url={url}
                distance={refDistance}
                loop={loop}
                autoplay={autoplay}
            />
        </group>
    )
}

/**
 * Zona de audio ambiental (se reproduce cuando el jugador entra)
 */
interface AudioZoneProps {
    position: [number, number, number]
    radius: number
    audioUrl: string
    volume?: number
    children?: React.ReactNode
}

export function AudioZone({
    position,
    radius,
    audioUrl,
    volume = 0.3,
    children
}: AudioZoneProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)

    useEffect(() => {
        // Crear elemento de audio
        audioRef.current = new Audio(audioUrl)
        audioRef.current.loop = true
        audioRef.current.volume = volume

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [audioUrl, volume])

    // API para controlar desde fuera
    const play = () => {
        if (audioRef.current && !isPlaying) {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const pause = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }

    return (
        <group position={position}>
            {/* Visualización de debug (opcional) */}
            <mesh visible={false}>
                <sphereGeometry args={[radius, 16, 16]} />
                <meshBasicMaterial color="blue" wireframe transparent opacity={0.2} />
            </mesh>
            {children}
        </group>
    )
}

/**
 * Configuración de audio ambiental predefinido
 */
export const AmbientSounds = {
    forest: '/audio/ambient/forest.mp3',
    wind: '/audio/ambient/wind.mp3',
    birds: '/audio/ambient/birds.mp3',
    water: '/audio/ambient/water.mp3',
    city: '/audio/ambient/city.mp3'
}

export default AmbientAudio3D
