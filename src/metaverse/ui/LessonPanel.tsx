import React, { useEffect } from 'react'
import './LessonPanel.css'

interface LessonData {
    id: string
    title: string
    description: string
    subject: string
    duration: string
    imageUrl?: string
    contentUrl?: string
}

interface LessonPanelProps {
    lesson: LessonData | null
    isOpen: boolean
    onClose: () => void
    onStartLesson: (lessonId: string) => void
}

/**
 * Semana 7: Panel de Lección
 * Modal que aparece al interactuar con un objeto de lección.
 */
export default function LessonPanel({ lesson, isOpen, onClose, onStartLesson }: LessonPanelProps) {
    // Cerrar con Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    if (!isOpen || !lesson) return null

    return (
        <div className="lesson-panel-overlay" onClick={onClose}>
            <div className="lesson-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="lesson-panel-header">
                    <div className="lesson-subject-badge">{lesson.subject}</div>
                    <button className="lesson-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className="lesson-panel-body">
                    {lesson.imageUrl && (
                        <div className="lesson-image" style={{ backgroundImage: `url(${lesson.imageUrl})` }} />
                    )}

                    <h2 className="lesson-title">{lesson.title}</h2>
                    <p className="lesson-description">{lesson.description}</p>

                    <div className="lesson-meta">
                        <span className="lesson-meta-item">
                            <span className="meta-icon">⏱️</span>
                            <span>{lesson.duration}</span>
                        </span>
                        <span className="lesson-meta-item">
                            <span className="meta-icon">📖</span>
                            <span>Lección Interactiva</span>
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="lesson-panel-footer">
                    <button className="lesson-btn secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="lesson-btn primary" onClick={() => onStartLesson(lesson.id)}>
                        🚀 Iniciar Lección
                    </button>
                </div>
            </div>
        </div>
    )
}
