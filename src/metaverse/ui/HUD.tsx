import React, { useState, useEffect } from 'react'
import './HUD.css'

interface HUDProps {
    playerName: string
    isConnected: boolean
    playerCount?: number
}

/**
 * Semana 7: Heads-Up Display (HUD)
 * Muestra información del jugador superpuesta al Canvas 3D.
 */
export default function HUD({ playerName, isConnected, playerCount = 1 }: HUDProps) {
    const [currentTime, setCurrentTime] = useState('')

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }))
        }
        updateTime()
        const interval = setInterval(updateTime, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="hud-container">
            {/* Panel Superior Izquierdo - Info del Jugador */}
            <div className="hud-panel hud-player-info">
                <div className="hud-avatar-icon">🎮</div>
                <div className="hud-player-details">
                    <span className="hud-player-name">{playerName}</span>
                    <span className={`hud-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '● En línea' : '○ Desconectado'}
                    </span>
                </div>
            </div>

            {/* Panel Superior Derecho - Estadísticas del Mundo */}
            <div className="hud-panel hud-world-info">
                <div className="hud-stat">
                    <span className="hud-stat-icon">👥</span>
                    <span className="hud-stat-value">{playerCount}</span>
                    <span className="hud-stat-label">jugadores</span>
                </div>
                <div className="hud-stat">
                    <span className="hud-stat-icon">🕐</span>
                    <span className="hud-stat-value">{currentTime}</span>
                </div>
            </div>

            {/* Panel Inferior - Controles/Ayuda */}
            <div className="hud-panel hud-controls-hint">
                <span>WASD - Mover</span>
                <span>Espacio - Saltar</span>
                <span>Shift - Correr</span>
                <span>E - Interactuar</span>
                <span>Enter - Chat</span>
            </div>
        </div>
    )
}
