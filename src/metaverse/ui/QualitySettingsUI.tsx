import React, { useState } from 'react'
import { QualityLevel, QUALITY_PRESETS } from '../systems/QualitySettings'
import './QualitySettingsUI.css'

interface QualitySettingsUIProps {
    currentLevel: QualityLevel
    onChangeLevel: (level: QualityLevel) => void
    onAutoDetect: () => void
    isVisible: boolean
    onClose: () => void
}

const QUALITY_LABELS: Record<QualityLevel, { label: string; icon: string; desc: string }> = {
    low: {
        label: 'Bajo',
        icon: '🔋',
        desc: 'Para equipos antiguos o Chromebooks. Máximo rendimiento.'
    },
    medium: {
        label: 'Medio',
        icon: '⚡',
        desc: 'Balance entre calidad y rendimiento. Recomendado.'
    },
    high: {
        label: 'Alto',
        icon: '✨',
        desc: 'Sombras, efectos y vegetación completa.'
    },
    ultra: {
        label: 'Ultra',
        icon: '🚀',
        desc: 'Máxima calidad. Requiere GPU dedicada.'
    }
}

/**
 * Semana 9 Tarea #7: UI de Configuración de Calidad
 */
export default function QualitySettingsUI({
    currentLevel,
    onChangeLevel,
    onAutoDetect,
    isVisible,
    onClose
}: QualitySettingsUIProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    if (!isVisible) return null

    const currentSettings = QUALITY_PRESETS[currentLevel]

    return (
        <div className="quality-overlay" onClick={onClose}>
            <div className="quality-panel" onClick={(e) => e.stopPropagation()}>
                <div className="quality-header">
                    <h2>⚙️ Configuración de Gráficos</h2>
                    <button className="quality-close" onClick={onClose}>✕</button>
                </div>

                <div className="quality-body">
                    {/* Presets */}
                    <div className="quality-presets">
                        {(Object.keys(QUALITY_LABELS) as QualityLevel[]).map((level) => {
                            const { label, icon, desc } = QUALITY_LABELS[level]
                            const isActive = level === currentLevel

                            return (
                                <button
                                    key={level}
                                    className={`quality-preset ${isActive ? 'active' : ''}`}
                                    onClick={() => onChangeLevel(level)}
                                >
                                    <span className="preset-icon">{icon}</span>
                                    <span className="preset-label">{label}</span>
                                    <span className="preset-desc">{desc}</span>
                                    {isActive && <span className="preset-check">✓</span>}
                                </button>
                            )
                        })}
                    </div>

                    {/* Auto-detect Button */}
                    <button className="quality-autodetect" onClick={onAutoDetect}>
                        🔍 Detectar Automáticamente
                    </button>

                    {/* Advanced Toggle */}
                    <button
                        className="quality-advanced-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? '▼' : '▶'} Configuración Avanzada
                    </button>

                    {/* Advanced Settings */}
                    {showAdvanced && (
                        <div className="quality-advanced">
                            <div className="advanced-item">
                                <span>Sombras</span>
                                <span className={currentSettings.shadows ? 'on' : 'off'}>
                                    {currentSettings.shadows ? 'Activadas' : 'Desactivadas'}
                                </span>
                            </div>
                            <div className="advanced-item">
                                <span>Anti-aliasing</span>
                                <span className={currentSettings.antialias ? 'on' : 'off'}>
                                    {currentSettings.antialias ? 'MSAA' : 'Desactivado'}
                                </span>
                            </div>
                            <div className="advanced-item">
                                <span>Post-procesado</span>
                                <span className={currentSettings.postProcessing ? 'on' : 'off'}>
                                    {currentSettings.postProcessing ? 'Bloom + Vignette' : 'Desactivado'}
                                </span>
                            </div>
                            <div className="advanced-item">
                                <span>Distancia de dibujado</span>
                                <span>{currentSettings.drawDistance}m</span>
                            </div>
                            <div className="advanced-item">
                                <span>Densidad de vegetación</span>
                                <span>{Math.round(currentSettings.vegetationDensity * 100)}%</span>
                            </div>
                            <div className="advanced-item">
                                <span>FPS Objetivo</span>
                                <span>{currentSettings.targetFPS} FPS</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="quality-footer">
                    <p className="quality-hint">
                        💡 Los cambios se aplican inmediatamente
                    </p>
                </div>
            </div>
        </div>
    )
}
