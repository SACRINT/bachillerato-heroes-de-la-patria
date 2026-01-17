import React from 'react'
import './InteractionPrompt.css'

interface InteractionPromptProps {
    objectName: string
    objectType: string
    isVisible: boolean
}

/**
 * Semana 7 Tarea #2: Prompt Visual "Presiona E para interactuar"
 */
export default function InteractionPrompt({ objectName, objectType, isVisible }: InteractionPromptProps) {
    if (!isVisible) return null

    const getIcon = () => {
        switch (objectType) {
            case 'lesson': return '📚'
            case 'npc': return '💬'
            case 'door': return '🚪'
            case 'item': return '✨'
            case 'info': return 'ℹ️'
            default: return '🎯'
        }
    }

    const getAction = () => {
        switch (objectType) {
            case 'lesson': return 'Abrir Lección'
            case 'npc': return 'Hablar'
            case 'door': return 'Abrir'
            case 'item': return 'Recoger'
            case 'info': return 'Leer'
            default: return 'Interactuar'
        }
    }

    return (
        <div className="interaction-prompt">
            <div className="interaction-prompt-content">
                <span className="interaction-icon">{getIcon()}</span>
                <div className="interaction-details">
                    <span className="interaction-name">{objectName}</span>
                    <span className="interaction-action">
                        <kbd>E</kbd> {getAction()}
                    </span>
                </div>
            </div>
        </div>
    )
}
