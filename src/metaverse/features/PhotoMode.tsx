import React, { useState, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import './PhotoMode.css'

interface PhotoModeProps {
    isActive: boolean
    onToggle: (active: boolean) => void
}

/**
 * Semana 10 Tarea #5: Photo Mode para capturas de pantalla
 */
export function usePhotoMode() {
    const [isPhotoMode, setIsPhotoMode] = useState(false)
    const [lastPhoto, setLastPhoto] = useState<string | null>(null)
    const { gl, scene, camera } = useThree()

    const takeScreenshot = useCallback(() => {
        // Renderizar frame actual
        gl.render(scene, camera)

        // Obtener imagen del canvas
        const dataUrl = gl.domElement.toDataURL('image/png')
        setLastPhoto(dataUrl)

        // Descargar automáticamente
        const link = document.createElement('a')
        link.download = `metaverse_screenshot_${Date.now()}.png`
        link.href = dataUrl
        link.click()

        console.log('[PhotoMode] Screenshot captured!')

        return dataUrl
    }, [gl, scene, camera])

    const togglePhotoMode = useCallback(() => {
        setIsPhotoMode(prev => !prev)
    }, [])

    return {
        isPhotoMode,
        togglePhotoMode,
        takeScreenshot,
        lastPhoto
    }
}

/**
 * UI Overlay para Photo Mode
 */
export function PhotoModeUI({ isActive, onToggle }: PhotoModeProps) {
    const [showFlash, setShowFlash] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const handleCapture = useCallback(() => {
        // Buscar el canvas de Three.js
        const canvas = document.querySelector('canvas')
        if (!canvas) return

        // Efecto flash
        setShowFlash(true)
        setTimeout(() => setShowFlash(false), 200)

        // Capturar
        const dataUrl = canvas.toDataURL('image/png')

        // Descargar
        const link = document.createElement('a')
        link.download = `bge_metaverse_${new Date().toISOString().split('T')[0]}_${Date.now()}.png`
        link.href = dataUrl
        link.click()

        // Mostrar notificación
        console.log('📸 Captura guardada!')
    }, [])

    if (!isActive) return null

    return (
        <>
            {/* Flash Effect */}
            {showFlash && <div className="photo-flash" />}

            {/* Photo Mode UI */}
            <div className="photo-mode-container">
                {/* Frame/Grid Overlay */}
                <div className="photo-grid">
                    <div className="grid-line horizontal" style={{ top: '33%' }} />
                    <div className="grid-line horizontal" style={{ top: '66%' }} />
                    <div className="grid-line vertical" style={{ left: '33%' }} />
                    <div className="grid-line vertical" style={{ left: '66%' }} />
                </div>

                {/* Corner Brackets */}
                <div className="photo-bracket top-left" />
                <div className="photo-bracket top-right" />
                <div className="photo-bracket bottom-left" />
                <div className="photo-bracket bottom-right" />

                {/* Controls */}
                <div className="photo-controls">
                    <button className="photo-btn capture" onClick={handleCapture}>
                        📷 Capturar
                    </button>
                    <button className="photo-btn exit" onClick={() => onToggle(false)}>
                        ✕ Salir
                    </button>
                </div>

                {/* Instructions */}
                <div className="photo-instructions">
                    <span>Mueve la cámara para componer tu foto</span>
                    <span>Presiona <kbd>P</kbd> para capturar</span>
                </div>

                {/* Watermark Preview */}
                <div className="photo-watermark">
                    BGE Metaverse © 2026
                </div>
            </div>
        </>
    )
}
