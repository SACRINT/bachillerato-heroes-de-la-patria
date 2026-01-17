import React, { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface FloatingEmoji {
    id: string
    emoji: string
    startTime: number
}

interface EmojiReaction3DProps {
    position: [number, number, number]
    socket?: any
    playerId: string
}

// Emojis disponibles
const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '🎉', '👏', '🔥', '💯', '✨']

/**
 * Semana 8 Tarea #9: Sistema de Emojis/Reacciones Flotantes
 * Permite enviar reacciones que flotan sobre el avatar.
 */
export function EmojiReaction3D({ position, socket, playerId }: EmojiReaction3DProps) {
    const [emojis, setEmojis] = useState<FloatingEmoji[]>([])

    const addEmoji = (emoji: string) => {
        const newEmoji: FloatingEmoji = {
            id: `emoji_${Date.now()}_${Math.random()}`,
            emoji,
            startTime: Date.now()
        }
        setEmojis(prev => [...prev, newEmoji])

        // Remover después de 2 segundos
        setTimeout(() => {
            setEmojis(prev => prev.filter(e => e.id !== newEmoji.id))
        }, 2000)

        // Enviar a otros jugadores
        socket?.emit('metaverse:emoji', { emoji, playerId })
    }

    return (
        <group position={position}>
            {emojis.map((e, index) => (
                <FloatingEmojiItem
                    key={e.id}
                    emoji={e.emoji}
                    startTime={e.startTime}
                    index={index}
                />
            ))}
        </group>
    )
}

interface FloatingEmojiItemProps {
    emoji: string
    startTime: number
    index: number
}

function FloatingEmojiItem({ emoji, startTime, index }: FloatingEmojiItemProps) {
    const ref = useRef<THREE.Group>(null!)

    useFrame(() => {
        if (!ref.current) return

        const elapsed = (Date.now() - startTime) / 1000
        const spread = (index % 3 - 1) * 0.3 // -0.3, 0, 0.3

        // Subir y desvanecer
        ref.current.position.y = elapsed * 1.5
        ref.current.position.x = spread + Math.sin(elapsed * 5) * 0.1

        // Escala con bounce
        const scale = Math.min(1, elapsed * 4) * (1 - elapsed / 2)
        ref.current.scale.setScalar(Math.max(0.1, scale))
    })

    return (
        <group ref={ref}>
            <Text fontSize={0.4} anchorX="center" anchorY="middle">
                {emoji}
            </Text>
        </group>
    )
}

/**
 * Barra de selección de emojis (UI overlay)
 */
interface EmojiBarProps {
    onSelect: (emoji: string) => void
    isVisible: boolean
}

export function EmojiBar({ onSelect, isVisible }: EmojiBarProps) {
    if (!isVisible) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: '160px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(0, 20, 40, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px',
            borderRadius: '30px',
            border: '1px solid rgba(0, 200, 255, 0.3)',
            zIndex: 200,
            animation: 'slideUp 0.3s ease-out'
        }}>
            {AVAILABLE_EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)'
                        e.currentTarget.style.background = 'rgba(0, 150, 255, 0.3)'
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {emoji}
                </button>
            ))}

            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
        </div>
    )
}
