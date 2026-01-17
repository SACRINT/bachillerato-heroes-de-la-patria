import React from 'react'
import './ToastNotification.css'

export interface Toast {
    id: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    icon?: string
    duration?: number
}

interface ToastNotificationProps {
    toasts: Toast[]
    onDismiss: (id: string) => void
}

/**
 * Semana 8 Tarea #6: Notificaciones "Toast" in-world
 */
export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
    if (toasts.length === 0) return null

    const getIcon = (type: Toast['type'], customIcon?: string) => {
        if (customIcon) return customIcon
        switch (type) {
            case 'success': return '✅'
            case 'warning': return '⚠️'
            case 'error': return '❌'
            default: return 'ℹ️'
        }
    }

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => onDismiss(toast.id)}
                >
                    <span className="toast-icon">{getIcon(toast.type, toast.icon)}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close">✕</button>
                </div>
            ))}
        </div>
    )
}

/**
 * Hook para gestionar toasts
 */
import { useState, useCallback } from 'react'

export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 4000) => {
        const id = `toast_${Date.now()}`
        const newToast: Toast = { id, message, type, duration }

        setToasts(prev => [...prev, newToast])

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }

        return id
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const clearAll = useCallback(() => {
        setToasts([])
    }, [])

    return {
        toasts,
        addToast,
        dismissToast,
        clearAll,
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        warning: (msg: string) => addToast(msg, 'warning'),
        info: (msg: string) => addToast(msg, 'info')
    }
}
