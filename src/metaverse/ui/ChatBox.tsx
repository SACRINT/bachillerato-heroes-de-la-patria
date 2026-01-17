import React, { useState, useRef, useEffect } from 'react'
import './ChatBox.css'

interface ChatMessage {
    id: string
    sender: string
    text: string
    timestamp: Date
    isSystem?: boolean
}

interface ChatBoxProps {
    socket: any // Socket.io instance
    playerId: string
    playerName: string
}

/**
 * Semana 7: Sistema de Chat
 * Chat de texto en tiempo real integrado con Socket.io.
 */
export default function ChatBox({ socket, playerId, playerName }: ChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'welcome', sender: 'Sistema', text: '¡Bienvenido al BGE Metaverse! Presiona Enter para chatear.', timestamp: new Date(), isSystem: true }
    ])
    const [inputText, setInputText] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll al nuevo mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Escuchar mensajes entrantes
    useEffect(() => {
        if (!socket) return

        const handleChatMessage = (data: { senderId: string, senderName: string, text: string }) => {
            const newMessage: ChatMessage = {
                id: `msg_${Date.now()}`,
                sender: data.senderName,
                text: data.text,
                timestamp: new Date(),
                isSystem: false
            }
            setMessages(prev => [...prev, newMessage])

            // Si el chat está cerrado, incrementar contador
            if (!isOpen) {
                setUnreadCount(prev => prev + 1)
            }
        }

        socket.on('chat:message', handleChatMessage)

        return () => {
            socket.off('chat:message', handleChatMessage)
        }
    }, [socket, isOpen])

    // Atajo de teclado global para abrir chat
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isOpen) {
                e.preventDefault()
                setIsOpen(true)
                setUnreadCount(0)
                setTimeout(() => inputRef.current?.focus(), 100)
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    const handleSend = () => {
        if (!inputText.trim() || !socket) return

        // Enviar al servidor
        socket.emit('chat:send', {
            text: inputText.trim(),
            senderId: playerId,
            senderName: playerName
        })

        // Mostrar localmente (optimistic update)
        const localMessage: ChatMessage = {
            id: `local_${Date.now()}`,
            sender: 'Tú',
            text: inputText.trim(),
            timestamp: new Date()
        }
        setMessages(prev => [...prev, localMessage])
        setInputText('')
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className={`chatbox-container ${isOpen ? 'open' : 'minimized'}`}>
            {/* Header / Toggle */}
            <div className="chatbox-header" onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}>
                <span className="chatbox-title">💬 Chat</span>
                {!isOpen && unreadCount > 0 && (
                    <span className="chatbox-unread">{unreadCount}</span>
                )}
                <span className="chatbox-toggle">{isOpen ? '▼' : '▲'}</span>
            </div>

            {/* Messages Area */}
            {isOpen && (
                <>
                    <div className="chatbox-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chatbox-message ${msg.isSystem ? 'system' : ''} ${msg.sender === 'Tú' ? 'own' : ''}`}>
                                <span className="chatbox-sender">{msg.sender}:</span>
                                <span className="chatbox-text">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chatbox-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Escribe un mensaje..."
                            maxLength={200}
                        />
                        <button onClick={handleSend} disabled={!inputText.trim()}>
                            Enviar
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
