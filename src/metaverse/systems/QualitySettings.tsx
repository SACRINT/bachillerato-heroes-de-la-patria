import React, { createContext, useContext, useState, useCallback } from 'react'

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra'

interface QualitySettings {
    shadows: boolean
    shadowMapSize: number
    antialias: boolean
    postProcessing: boolean
    vegetationDensity: number
    drawDistance: number
    particleCount: number
    textureQuality: 'low' | 'medium' | 'high'
    targetFPS: number
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
    low: {
        shadows: false,
        shadowMapSize: 512,
        antialias: false,
        postProcessing: false,
        vegetationDensity: 0.3,
        drawDistance: 50,
        particleCount: 10,
        textureQuality: 'low',
        targetFPS: 30
    },
    medium: {
        shadows: true,
        shadowMapSize: 1024,
        antialias: false,
        postProcessing: false,
        vegetationDensity: 0.6,
        drawDistance: 100,
        particleCount: 50,
        textureQuality: 'medium',
        targetFPS: 45
    },
    high: {
        shadows: true,
        shadowMapSize: 2048,
        antialias: true,
        postProcessing: true,
        vegetationDensity: 1.0,
        drawDistance: 150,
        particleCount: 100,
        textureQuality: 'high',
        targetFPS: 60
    },
    ultra: {
        shadows: true,
        shadowMapSize: 4096,
        antialias: true,
        postProcessing: true,
        vegetationDensity: 1.5,
        drawDistance: 200,
        particleCount: 200,
        textureQuality: 'high',
        targetFPS: 60
    }
}

interface QualityContextType {
    qualityLevel: QualityLevel
    settings: QualitySettings
    setQualityLevel: (level: QualityLevel) => void
    autoDetect: () => void
}

const QualityContext = createContext<QualityContextType | null>(null)

export function useQuality() {
    const ctx = useContext(QualityContext)
    if (!ctx) throw new Error('useQuality must be used within QualityProvider')
    return ctx
}

interface QualityProviderProps {
    children: React.ReactNode
    defaultLevel?: QualityLevel
}

/**
 * Semana 9 Tarea #7: Quality Settings Provider
 * Gestiona la configuración de calidad gráfica.
 */
export function QualityProvider({ children, defaultLevel = 'medium' }: QualityProviderProps) {
    const [qualityLevel, setQualityLevel] = useState<QualityLevel>(() => {
        // Intentar cargar de localStorage
        const saved = localStorage.getItem('metaverse_quality')
        return (saved as QualityLevel) || defaultLevel
    })

    const handleSetQuality = useCallback((level: QualityLevel) => {
        setQualityLevel(level)
        localStorage.setItem('metaverse_quality', level)
        console.log(`[Quality] Set to: ${level}`, QUALITY_PRESETS[level])
    }, [])

    // Auto-detectar basado en hardware
    const autoDetect = useCallback(() => {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

        if (!gl) {
            handleSetQuality('low')
            return
        }

        // Detectar GPU
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        const renderer = debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : 'Unknown'

        console.log('[Quality] GPU detected:', renderer)

        // Heurísticas simples
        const rendererLower = renderer.toLowerCase()

        if (rendererLower.includes('intel') || rendererLower.includes('mesa')) {
            handleSetQuality('low')
        } else if (rendererLower.includes('nvidia') || rendererLower.includes('amd')) {
            // Verificar si es móvil o de gama alta
            if (rendererLower.includes('rtx') || rendererLower.includes('rx 6') || rendererLower.includes('rx 7')) {
                handleSetQuality('ultra')
            } else if (rendererLower.includes('gtx') || rendererLower.includes('rx 5')) {
                handleSetQuality('high')
            } else {
                handleSetQuality('medium')
            }
        } else {
            handleSetQuality('medium')
        }

        // Limpiar
        canvas.remove()
    }, [handleSetQuality])

    const settings = QUALITY_PRESETS[qualityLevel]

    return (
        <QualityContext.Provider value={{ qualityLevel, settings, setQualityLevel: handleSetQuality, autoDetect }}>
            {children}
        </QualityContext.Provider>
    )
}

export { QUALITY_PRESETS }
