import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

/**
 * Semana 7 Tarea #3: Puerta Automática con animación
 */
interface AutoDoorProps {
    position: [number, number, number]
    id: string
    onStateChange?: (isOpen: boolean) => void
}

export function AutoDoor({ position, id, onStateChange }: AutoDoorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const leftDoorRef = useRef<THREE.Mesh>(null!)
    const rightDoorRef = useRef<THREE.Mesh>(null!)

    const openAmount = useRef(0)
    const targetOpenAmount = isOpen ? 1 : 0

    useFrame((state, delta) => {
        // Animación suave
        openAmount.current = THREE.MathUtils.lerp(openAmount.current, targetOpenAmount, delta * 3)

        if (leftDoorRef.current && rightDoorRef.current) {
            // Puertas corredizas
            leftDoorRef.current.position.x = -0.8 - openAmount.current * 0.8
            rightDoorRef.current.position.x = 0.8 + openAmount.current * 0.8
        }

        // Detectar fin de animación
        if (Math.abs(openAmount.current - targetOpenAmount) < 0.01) {
            setIsAnimating(false)
        }
    })

    const toggleDoor = () => {
        if (isAnimating) return
        setIsAnimating(true)
        const newState = !isOpen
        setIsOpen(newState)
        onStateChange?.(newState)
    }

    return (
        <group position={position} name={id} onClick={toggleDoor}>
            {/* Marco de la puerta */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[2.4, 3.2, 0.2]} />
                <meshStandardMaterial color="#334455" />
            </mesh>

            {/* Puerta izquierda */}
            <mesh ref={leftDoorRef} position={[-0.8, 1.5, 0.05]}>
                <boxGeometry args={[0.75, 2.8, 0.1]} />
                <meshStandardMaterial color="#5588aa" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Puerta derecha */}
            <mesh ref={rightDoorRef} position={[0.8, 1.5, 0.05]}>
                <boxGeometry args={[0.75, 2.8, 0.1]} />
                <meshStandardMaterial color="#5588aa" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Indicador de estado */}
            <mesh position={[0, 2.8, 0.15]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial
                    color={isOpen ? '#00ff88' : '#ff4444'}
                    emissive={isOpen ? '#00ff88' : '#ff4444'}
                    emissiveIntensity={0.8}
                />
            </mesh>
        </group>
    )
}

/**
 * Semana 7 Tarea #5: Sillas Sentables (Snap to position)
 */
interface SittableChairProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    id: string
    onSit?: (playerId: string) => void
    onStand?: (playerId: string) => void
}

export function SittableChair({ position, rotation = [0, 0, 0], id, onSit, onStand }: SittableChairProps) {
    const [isOccupied, setIsOccupied] = useState(false)

    const handleInteract = () => {
        if (!isOccupied) {
            setIsOccupied(true)
            onSit?.(id)
        } else {
            setIsOccupied(false)
            onStand?.(id)
        }
    }

    return (
        <group position={position} rotation={rotation} name={id} onClick={handleInteract}>
            {/* Asiento */}
            <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[0.5, 0.08, 0.5]} />
                <meshStandardMaterial color={isOccupied ? '#66aa66' : '#8B4513'} />
            </mesh>

            {/* Respaldo */}
            <mesh position={[0, 0.75, -0.22]}>
                <boxGeometry args={[0.5, 0.6, 0.08]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Patas */}
            {[[-0.2, 0, -0.2], [0.2, 0, -0.2], [-0.2, 0, 0.2], [0.2, 0, 0.2]].map((pos, i) => (
                <mesh key={i} position={[pos[0], 0.22, pos[2]]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                    <meshStandardMaterial color="#5a3d2b" />
                </mesh>
            ))}
        </group>
    )
}

/**
 * Semana 7 Tarea #6: Zonas de Teletransporte
 */
interface TeleportZoneProps {
    position: [number, number, number]
    targetPosition: [number, number, number]
    id: string
    label?: string
    onTeleport?: (targetPos: [number, number, number]) => void
}

export function TeleportZone({ position, targetPosition, id, label = 'Teletransporte', onTeleport }: TeleportZoneProps) {
    const ringRef = useRef<THREE.Mesh>(null!)

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.y = state.clock.elapsedTime
        }
    })

    return (
        <group position={position} name={id} onClick={() => onTeleport?.(targetPosition)}>
            {/* Plataforma base */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                <meshStandardMaterial
                    color="#0066ff"
                    emissive="#0044aa"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Anillo rotante */}
            <mesh ref={ringRef} position={[0, 0.5, 0]}>
                <torusGeometry args={[1.3, 0.05, 8, 32]} />
                <meshBasicMaterial color="#00ddff" />
            </mesh>

            {/* Partículas de efecto */}
            <pointLight position={[0, 1, 0]} color="#00aaff" intensity={1} distance={5} />
        </group>
    )
}

/**
 * Semana 7 Tarea #8: Item Pickup (Monedas flotantes)
 */
interface CollectibleCoinProps {
    position: [number, number, number]
    id: string
    value?: number
    onCollect?: (id: string, value: number) => void
}

export function CollectibleCoin({ position, id, value = 1, onCollect }: CollectibleCoinProps) {
    const coinRef = useRef<THREE.Mesh>(null!)
    const [collected, setCollected] = useState(false)

    useFrame((state) => {
        if (!coinRef.current || collected) return

        // Rotación y flotación
        coinRef.current.rotation.y = state.clock.elapsedTime * 2
        coinRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1
    })

    const handleCollect = () => {
        if (collected) return
        setCollected(true)
        onCollect?.(id, value)
    }

    if (collected) return null

    return (
        <mesh ref={coinRef} position={position} name={id} onClick={handleCollect}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
            <meshStandardMaterial
                color="#ffd700"
                emissive="#ffaa00"
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.2}
            />
            <pointLight position={[0, 0, 0]} color="#ffdd00" intensity={0.5} distance={3} />
        </mesh>
    )
}

export default { AutoDoor, SittableChair, TeleportZone, CollectibleCoin }
