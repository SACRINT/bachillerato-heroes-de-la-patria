import React, { useEffect, useRef, useState } from 'react'
import './Minimap.css'

interface Player {
    id: string
    position: { x: number; z: number }
    isLocal?: boolean
}

interface MinimapProps {
    localPlayerPosition: { x: number; z: number }
    remotePlayers: Player[]
    worldSize?: number // Tamaño del mundo en unidades
    mapSize?: number // Tamaño del minimapa en px
}

/**
 * Semana 8 Tarea #5: Minimapa Estilo Radar
 * Muestra la posición del jugador y otros jugadores cercanos.
 */
export default function Minimap({
    localPlayerPosition,
    remotePlayers,
    worldSize = 200,
    mapSize = 150
}: MinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [rotation, setRotation] = useState(0)

    // Efecto de rotación del radar
    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 2) % 360)
        }, 50)
        return () => clearInterval(interval)
    }, [])

    // Renderizado del minimapa
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const center = mapSize / 2
        const scale = mapSize / worldSize

        // Limpiar
        ctx.clearRect(0, 0, mapSize, mapSize)

        // Fondo
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
        gradient.addColorStop(0, 'rgba(0, 40, 60, 0.9)')
        gradient.addColorStop(1, 'rgba(0, 20, 40, 0.95)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(center, center, center - 2, 0, Math.PI * 2)
        ctx.fill()

        // Círculos de distancia
        ctx.strokeStyle = 'rgba(0, 150, 200, 0.3)'
        ctx.lineWidth = 1
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath()
            ctx.arc(center, center, (center / 3) * i - 5, 0, Math.PI * 2)
            ctx.stroke()
        }

        // Cruz central
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)'
        ctx.beginPath()
        ctx.moveTo(center, 10)
        ctx.lineTo(center, mapSize - 10)
        ctx.moveTo(10, center)
        ctx.lineTo(mapSize - 10, center)
        ctx.stroke()

        // Línea de escaneo (sweep)
        const sweepAngle = (rotation * Math.PI) / 180
        ctx.strokeStyle = 'rgba(0, 255, 200, 0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.lineTo(
            center + Math.cos(sweepAngle) * (center - 10),
            center + Math.sin(sweepAngle) * (center - 10)
        )
        ctx.stroke()

        // Jugadores remotos (puntos azules)
        remotePlayers.forEach(player => {
            const relX = (player.position.x - localPlayerPosition.x) * scale + center
            const relZ = (player.position.z - localPlayerPosition.z) * scale + center

            // Solo mostrar si está dentro del rango
            const dist = Math.sqrt((relX - center) ** 2 + (relZ - center) ** 2)
            if (dist < center - 10) {
                ctx.fillStyle = '#00aaff'
                ctx.beginPath()
                ctx.arc(relX, relZ, 4, 0, Math.PI * 2)
                ctx.fill()

                // Pulso
                ctx.strokeStyle = 'rgba(0, 170, 255, 0.4)'
                ctx.beginPath()
                ctx.arc(relX, relZ, 6 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2)
                ctx.stroke()
            }
        })

        // Jugador local (centro - triángulo verde)
        ctx.fillStyle = '#00ff88'
        ctx.beginPath()
        ctx.moveTo(center, center - 6)
        ctx.lineTo(center - 5, center + 5)
        ctx.lineTo(center + 5, center + 5)
        ctx.closePath()
        ctx.fill()

        // Borde exterior
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(center, center, center - 2, 0, Math.PI * 2)
        ctx.stroke()

    }, [localPlayerPosition, remotePlayers, rotation, mapSize, worldSize])

    return (
        <div className="minimap-container">
            <canvas
                ref={canvasRef}
                width={mapSize}
                height={mapSize}
                className="minimap-canvas"
            />
            <div className="minimap-label">RADAR</div>
        </div>
    )
}
