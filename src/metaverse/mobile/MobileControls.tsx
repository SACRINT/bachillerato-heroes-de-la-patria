import React, { useState, useEffect, useCallback } from 'react'
import './MobileControls.css'

interface JoystickState {
    x: number  // -1 to 1
    y: number  // -1 to 1
    active: boolean
}

interface MobileControlsProps {
    onMove: (x: number, y: number) => void
    onJump: () => void
    onInteract: () => void
    onRun: (running: boolean) => void
    enabled?: boolean
}

/**
 * Semana 5 Tarea #14: Joystick virtual para móviles
 */
export default function MobileControls({
    onMove,
    onJump,
    onInteract,
    onRun,
    enabled = true
}: MobileControlsProps) {
    const [joystick, setJoystick] = useState<JoystickState>({ x: 0, y: 0, active: false })
    const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 })
    const [isRunning, setIsRunning] = useState(false)

    // Detectar si es dispositivo móvil
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Enviar movimiento
    useEffect(() => {
        if (joystick.active) {
            onMove(joystick.x, joystick.y)
        } else {
            onMove(0, 0)
        }
    }, [joystick, onMove])

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0]
        const rect = e.currentTarget.getBoundingClientRect()
        setJoystickOrigin({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        })
        setJoystick({ x: 0, y: 0, active: true })
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!joystick.active) return

        const touch = e.touches[0]
        const rect = e.currentTarget.getBoundingClientRect()
        const currentX = touch.clientX - rect.left
        const currentY = touch.clientY - rect.top

        const deltaX = currentX - joystickOrigin.x
        const deltaY = currentY - joystickOrigin.y

        const maxRadius = 50
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxRadius)
        const angle = Math.atan2(deltaY, deltaX)

        setJoystick({
            x: (Math.cos(angle) * distance) / maxRadius,
            y: (Math.sin(angle) * distance) / maxRadius,
            active: true
        })
    }, [joystick.active, joystickOrigin])

    const handleTouchEnd = useCallback(() => {
        setJoystick({ x: 0, y: 0, active: false })
    }, [])

    const toggleRun = () => {
        const newRunning = !isRunning
        setIsRunning(newRunning)
        onRun(newRunning)
    }

    if (!isMobile || !enabled) return null

    // Calcular posición del stick
    const stickX = joystick.x * 40
    const stickY = joystick.y * 40

    return (
        <div className="mobile-controls">
            {/* Joystick izquierdo */}
            <div
                className="joystick-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="joystick-base">
                    <div
                        className="joystick-stick"
                        style={{
                            transform: `translate(${stickX}px, ${stickY}px)`
                        }}
                    />
                </div>
            </div>

            {/* Botones de acción derecha */}
            <div className="action-buttons">
                <button
                    className={`action-btn run-btn ${isRunning ? 'active' : ''}`}
                    onTouchStart={toggleRun}
                >
                    🏃
                </button>
                <button
                    className="action-btn jump-btn"
                    onTouchStart={() => onJump()}
                >
                    ⬆️
                </button>
                <button
                    className="action-btn interact-btn"
                    onTouchStart={() => onInteract()}
                >
                    E
                </button>
            </div>
        </div>
    )
}
