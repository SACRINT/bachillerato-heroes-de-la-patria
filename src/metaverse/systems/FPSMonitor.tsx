import { useEffect, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'

interface FPSStats {
    current: number
    average: number
    min: number
    max: number
    frameTime: number
}

interface UseFPSMonitorOptions {
    targetFPS?: number
    sampleSize?: number
    onLowFPS?: (stats: FPSStats) => void
    lowFPSThreshold?: number
}

/**
 * Semana 9 Tarea #13: FPS Monitor Hook
 * Monitorea el rendimiento y puede disparar eventos cuando baja.
 */
export function useFPSMonitor(options: UseFPSMonitorOptions = {}) {
    const {
        targetFPS = 60,
        sampleSize = 60,
        onLowFPS,
        lowFPSThreshold = 30
    } = options

    const frameTimes = useRef<number[]>([])
    const lastTime = useRef(performance.now())
    const [stats, setStats] = useState<FPSStats>({
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        frameTime: 16.67
    })

    useFrame(() => {
        const now = performance.now()
        const delta = now - lastTime.current
        lastTime.current = now

        // Agregar frame time
        frameTimes.current.push(delta)
        if (frameTimes.current.length > sampleSize) {
            frameTimes.current.shift()
        }

        // Calcular estadísticas cada 30 frames
        if (frameTimes.current.length % 30 === 0) {
            const times = frameTimes.current
            const avgFrameTime = times.reduce((a, b) => a + b, 0) / times.length
            const minFrameTime = Math.min(...times)
            const maxFrameTime = Math.max(...times)

            const newStats: FPSStats = {
                current: Math.round(1000 / delta),
                average: Math.round(1000 / avgFrameTime),
                min: Math.round(1000 / maxFrameTime), // min FPS = max frame time
                max: Math.round(1000 / minFrameTime),
                frameTime: avgFrameTime
            }

            setStats(newStats)

            // Callback si FPS bajo
            if (newStats.average < lowFPSThreshold && onLowFPS) {
                onLowFPS(newStats)
            }
        }
    })

    return stats
}

/**
 * Semana 9 Tarea #13: FPS Throttler para ahorro de batería
 */
export function useFPSThrottler(enabled: boolean = false, targetFPS: number = 30) {
    const frameInterval = 1000 / targetFPS
    const lastFrameTime = useRef(0)
    const [isThrottled, setIsThrottled] = useState(enabled)

    const shouldRender = useCallback(() => {
        if (!isThrottled) return true

        const now = performance.now()
        if (now - lastFrameTime.current >= frameInterval) {
            lastFrameTime.current = now
            return true
        }
        return false
    }, [isThrottled, frameInterval])

    return {
        isThrottled,
        setIsThrottled,
        shouldRender
    }
}

/**
 * Componente de Performance Overlay (Debug)
 */
interface PerformanceOverlayProps {
    stats: FPSStats
    isVisible: boolean
}

export function PerformanceOverlay({ stats, isVisible }: PerformanceOverlayProps) {
    if (!isVisible) return null

    const fpsColor = stats.average >= 50 ? '#00ff88' : stats.average >= 30 ? '#ffaa00' : '#ff4444'

    return (
        <div style={{
            position: 'fixed',
            top: '60px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: 'white',
            zIndex: 1000,
            pointerEvents: 'none'
        }}>
            <div style={{ color: fpsColor, fontWeight: 'bold', fontSize: '14px' }}>
                {stats.current} FPS
            </div>
            <div style={{ opacity: 0.7 }}>
                Avg: {stats.average} | Min: {stats.min} | Max: {stats.max}
            </div>
            <div style={{ opacity: 0.5 }}>
                Frame: {stats.frameTime.toFixed(2)}ms
            </div>
        </div>
    )
}
