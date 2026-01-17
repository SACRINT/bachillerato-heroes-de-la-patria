import React, { useState, useEffect } from 'react'
import './OnboardingTutorial.css'

interface TutorialStep {
    id: number
    title: string
    description: string
    icon: string
    action?: string
    highlight?: string // CSS selector o área a resaltar
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 1,
        title: '¡Bienvenido al Metaverso BGE!',
        description: 'Explora un mundo virtual donde puedes aprender, socializar y divertirte con tus compañeros.',
        icon: '🌐',
        action: 'Presiona cualquier tecla para continuar'
    },
    {
        id: 2,
        title: 'Muévete por el Mundo',
        description: 'Usa las teclas WASD o las flechas del teclado para caminar. Mantén SHIFT para correr.',
        icon: '🎮',
        action: 'Intenta moverte'
    },
    {
        id: 3,
        title: 'Salta Obstáculos',
        description: 'Presiona la BARRA ESPACIADORA para saltar sobre objetos y explorar nuevas áreas.',
        icon: '🦘',
        action: 'Intenta saltar'
    },
    {
        id: 4,
        title: 'Interactúa con Objetos',
        description: 'Acércate a pizarras y NPCs. Cuando veas el prompt, presiona E para interactuar.',
        icon: '🖐️',
        action: 'Busca una pizarra azul'
    },
    {
        id: 5,
        title: 'Chatea con Otros',
        description: 'Presiona ENTER para abrir el chat y comunicarte con otros jugadores en tiempo real.',
        icon: '💬',
        action: 'Abre el chat'
    },
    {
        id: 6,
        title: '¡Estás Listo!',
        description: 'Ya conoces los controles básicos. ¡Explora las lecciones y diviértete aprendiendo!',
        icon: '🎓',
        action: 'Cerrar tutorial'
    }
]

interface OnboardingTutorialProps {
    isVisible: boolean
    onComplete: () => void
}

/**
 * Semana 8 Tarea #12: Tutorial de Onboarding Interactivo
 */
export default function OnboardingTutorial({ isVisible, onComplete }: OnboardingTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isVisible) return

            // Avanzar con cualquier tecla o Enter
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                nextStep()
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isVisible, currentStep])

    const nextStep = () => {
        if (isAnimating) return

        setIsAnimating(true)

        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setTimeout(() => {
                setCurrentStep(prev => prev + 1)
                setIsAnimating(false)
            }, 300)
        } else {
            // Completar tutorial
            setTimeout(() => {
                onComplete()
                setCurrentStep(0)
                setIsAnimating(false)
            }, 300)
        }
    }

    const prevStep = () => {
        if (currentStep > 0 && !isAnimating) {
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentStep(prev => prev - 1)
                setIsAnimating(false)
            }, 300)
        }
    }

    if (!isVisible) return null

    const step = TUTORIAL_STEPS[currentStep]

    return (
        <div className="onboarding-overlay">
            <div className={`onboarding-card ${isAnimating ? 'animating' : ''}`}>
                {/* Indicador de progreso */}
                <div className="onboarding-progress">
                    {TUTORIAL_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                {/* Icono */}
                <div className="onboarding-icon">{step.icon}</div>

                {/* Contenido */}
                <h2 className="onboarding-title">{step.title}</h2>
                <p className="onboarding-description">{step.description}</p>

                {/* Acción sugerida */}
                <div className="onboarding-action">
                    <span className="action-hint">{step.action}</span>
                </div>

                {/* Botones de navegación */}
                <div className="onboarding-buttons">
                    {currentStep > 0 && (
                        <button className="onboarding-btn secondary" onClick={prevStep}>
                            ← Anterior
                        </button>
                    )}
                    <button className="onboarding-btn primary" onClick={nextStep}>
                        {currentStep === TUTORIAL_STEPS.length - 1 ? '¡Empezar!' : 'Siguiente →'}
                    </button>
                </div>

                {/* Skip */}
                <button className="onboarding-skip" onClick={onComplete}>
                    Saltar tutorial
                </button>
            </div>
        </div>
    )
}
