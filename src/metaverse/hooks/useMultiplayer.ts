import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Ajustar URL según entorno (localhost o producción)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface RemotePlayerState {
    id: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number }
    animation: string
    color?: string
}

export function useMultiplayer(localRigidBodyRef: React.MutableRefObject<any>) {
    const socketRef = useRef<Socket | null>(null)
    // Estado local para renderizado React
    const [remotePlayers, setRemotePlayers] = useState<Record<string, RemotePlayerState>>({})

    // Referencia mutable para actualizaciones en tiempo real (sin re-renderizar todo el componente Player)
    const remotePlayersRef = useRef<Record<string, RemotePlayerState>>({})

    useEffect(() => {
        // 1. Conexión
        socketRef.current = io(SOCKET_URL, {
            auth: { token: 'METAVERSE_GUEST_TOKEN' }, // Bypass para desarrollo
            transports: ['websocket'] // Forzar WS para menor latencia
        })

        const socket = socketRef.current

        socket.on('connect', () => {
            console.log('✅ [Metaverse] Connected to Game Server:', socket.id)

            // Unirse al mundo
            const startPos = localRigidBodyRef.current?.translation() || { x: 0, y: 5, z: 0 }
            socket.emit('metaverse:join', {
                position: startPos,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16)
            })
        })

        // 2. Escuchar Movimientos
        socket.on('metaverse:player_moved', (data: RemotePlayerState) => {
            // Actualizar ref para uso en useFrame (suave)
            remotePlayersRef.current[data.id] = data

            // Actualizar state para montar componentes nuevos (menos frecuente)
            // Nota: Esto puede causar re-renders. En prod, usaríamos un store global (Zustand).
            // Para MVP, verificamos si existe antes de setear state.
            setRemotePlayers(prev => {
                if (!prev[data.id]) {
                    return { ...prev, [data.id]: data }
                }
                return prev
            })
        })

        socket.on('metaverse:player_joined', (data) => {
            console.log('Remote player joined:', data.id)
            setRemotePlayers(prev => ({ ...prev, [data.id]: data }))
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    // 3. Loop de Envío (Broadcasting)
    useFrame((state) => {
        if (!socketRef.current || !localRigidBodyRef.current) return

        // Throttling: Enviar solo cada X frames o si se movió mucho
        const frame = state.clock.getElapsedTime()
        // if (frame % 0.1 < 0.016) ... (simple throttle logic)

        const pos = localRigidBodyRef.current.translation()
        // const rot = localRigidBodyRef.current.rotation() // Rapier rotation es quaternion

        // Enviamos datos
        socketRef.current.emit('metaverse:move', {
            position: pos,
            rotation: { x: 0, y: 0, z: 0 }, // Placeholder, rotación real requiere conversión Quat->Euler o enviar Quat
            animation: 'Idle' // TODO: Pasar estado real
        })
    })

    return { remotePlayers, remotePlayersRef }
}
