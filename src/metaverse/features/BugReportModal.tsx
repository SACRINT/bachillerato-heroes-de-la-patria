import React, { useState } from 'react'
import './BugReportModal.css'

interface BugReportData {
    type: 'bug' | 'suggestion' | 'performance' | 'other'
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    screenshot?: string
    playerPosition?: { x: number; y: number; z: number }
    userAgent: string
    timestamp: string
}

interface BugReportModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: BugReportData) => void
    playerPosition?: { x: number; y: number; z: number }
}

const BUG_TYPES = [
    { value: 'bug', label: '🐛 Bug', desc: 'Algo no funciona correctamente' },
    { value: 'performance', label: '🐢 Rendimiento', desc: 'El juego va lento o se traba' },
    { value: 'suggestion', label: '💡 Sugerencia', desc: 'Tengo una idea de mejora' },
    { value: 'other', label: '📝 Otro', desc: 'Otra cosa' }
]

const SEVERITY_LEVELS = [
    { value: 'low', label: 'Bajo', color: '#44aa44' },
    { value: 'medium', label: 'Medio', color: '#ffaa00' },
    { value: 'high', label: 'Alto', color: '#ff6644' },
    { value: 'critical', label: 'Crítico', color: '#ff2222' }
]

/**
 * Semana 10 Tarea #6: Sistema de Reporte de Bugs In-Game
 */
export default function BugReportModal({ isOpen, onClose, onSubmit, playerPosition }: BugReportModalProps) {
    const [type, setType] = useState<BugReportData['type']>('bug')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState<BugReportData['severity']>('medium')
    const [includeScreenshot, setIncludeScreenshot] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return

        setIsSubmitting(true)

        // Capturar screenshot si se solicitó
        let screenshot: string | undefined
        if (includeScreenshot) {
            const canvas = document.querySelector('canvas')
            if (canvas) {
                screenshot = canvas.toDataURL('image/jpeg', 0.7)
            }
        }

        const reportData: BugReportData = {
            type,
            title: title.trim(),
            description: description.trim(),
            severity,
            screenshot,
            playerPosition,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        }

        // Simular envío (en producción, enviar a backend)
        await new Promise(resolve => setTimeout(resolve, 1000))

        onSubmit(reportData)
        setSubmitted(true)
        setIsSubmitting(false)

        // Cerrar después de mostrar confirmación
        setTimeout(() => {
            setSubmitted(false)
            setTitle('')
            setDescription('')
            onClose()
        }, 2000)
    }

    if (!isOpen) return null

    return (
        <div className="bug-report-overlay" onClick={onClose}>
            <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
                {submitted ? (
                    <div className="bug-report-success">
                        <div className="success-icon">✅</div>
                        <h2>¡Gracias por tu reporte!</h2>
                        <p>Nuestro equipo lo revisará pronto.</p>
                    </div>
                ) : (
                    <>
                        <div className="bug-report-header">
                            <h2>📝 Reportar Problema</h2>
                            <button className="bug-close" onClick={onClose}>✕</button>
                        </div>

                        <div className="bug-report-body">
                            {/* Tipo de Reporte */}
                            <div className="form-group">
                                <label>Tipo de Reporte</label>
                                <div className="type-buttons">
                                    {BUG_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            className={`type-btn ${type === t.value ? 'active' : ''}`}
                                            onClick={() => setType(t.value as BugReportData['type'])}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Título */}
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Resumen breve del problema"
                                    maxLength={100}
                                />
                            </div>

                            {/* Descripción */}
                            <div className="form-group">
                                <label>Descripción *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explica qué pasó, cómo reproducirlo, qué esperabas..."
                                    rows={4}
                                    maxLength={1000}
                                />
                            </div>

                            {/* Severidad */}
                            {type === 'bug' && (
                                <div className="form-group">
                                    <label>Severidad</label>
                                    <div className="severity-buttons">
                                        {SEVERITY_LEVELS.map((s) => (
                                            <button
                                                key={s.value}
                                                className={`severity-btn ${severity === s.value ? 'active' : ''}`}
                                                style={{ borderColor: severity === s.value ? s.color : undefined }}
                                                onClick={() => setSeverity(s.value as BugReportData['severity'])}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Options */}
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={includeScreenshot}
                                        onChange={(e) => setIncludeScreenshot(e.target.checked)}
                                    />
                                    Incluir captura de pantalla
                                </label>
                            </div>
                        </div>

                        <div className="bug-report-footer">
                            <button className="bug-btn cancel" onClick={onClose}>
                                Cancelar
                            </button>
                            <button
                                className="bug-btn submit"
                                onClick={handleSubmit}
                                disabled={!title.trim() || !description.trim() || isSubmitting}
                            >
                                {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
