import React, { useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface NPCProps {
    id: string;
    name: string;
    role: 'guide' | 'tutor' | 'librarian' | 'decorative';
    position: [number, number, number];
    personality?: string;
    color?: string;
}

interface DialogMessage {
    role: 'user' | 'npc';
    content: string;
}

/**
 * Semana 27: Sistema de NPCs con IA
 */
export default function NPC({ id, name, role, position, personality, color = '#2196F3' }: NPCProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isNearby, setIsNearby] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [messages, setMessages] = useState<DialogMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Animación de idle (flotar ligeramente)
    useFrame((state) => {
        if (groupRef.current && role !== 'decorative') {
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    // Llamar a la API de IA del backend
    const askAI = useCallback(async (question: string) => {
        setIsThinking(true);

        try {
            const response = await fetch('/api/ai/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: question,
                    context: {
                        npcName: name,
                        npcRole: role,
                        personality: personality || `Eres ${name}, un ${role} amigable del campus virtual BGE.`
                    }
                })
            });

            const data = await response.json();
            return data.reply || 'Lo siento, no pude procesar tu pregunta.';

        } catch (error) {
            console.error('NPC AI Error:', error);
            return 'Disculpa, estoy teniendo problemas para pensar en este momento.';
        } finally {
            setIsThinking(false);
        }
    }, [name, role, personality]);

    // Manejar envío de mensaje
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = inputText.trim();
        setInputText('');

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        const response = await askAI(userMessage);

        setMessages(prev => [...prev, { role: 'npc', content: response }]);
    };

    // Respuestas predeterminadas según rol
    const getGreeting = () => {
        switch (role) {
            case 'guide': return '¡Hola! Soy tu guía del campus. ¿Necesitas ayuda para encontrar algo?';
            case 'tutor': return '¡Bienvenido! Estoy aquí para ayudarte con tus dudas académicas.';
            case 'librarian': return '¡Buenos días! ¿Buscas algún libro o recurso en particular?';
            default: return '...';
        }
    };

    return (
        <group ref={groupRef} position={position}>
            {/* Cuerpo del NPC */}
            <mesh castShadow>
                <capsuleGeometry args={[0.3, 1, 8, 16]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Cabeza */}
            <mesh position={[0, 1, 0]} castShadow>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshStandardMaterial color="#FFCC80" />
            </mesh>

            {/* Ojos */}
            <mesh position={[-0.12, 1.05, 0.28]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            <mesh position={[0.12, 1.05, 0.28]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#333" />
            </mesh>

            {/* Indicador de rol (icono flotante) */}
            <Text
                position={[0, 1.8, 0]}
                fontSize={0.4}
                anchorX="center"
            >
                {role === 'guide' && '🧭'}
                {role === 'tutor' && '📚'}
                {role === 'librarian' && '📖'}
                {role === 'decorative' && '👤'}
            </Text>

            {/* Nombre */}
            <Text
                position={[0, 1.5, 0]}
                fontSize={0.2}
                color="#FFFFFF"
                anchorX="center"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {name}
            </Text>

            {/* Burbuja de interacción */}
            {role !== 'decorative' && (
                <mesh
                    position={[0, 0, 0]}
                    visible={false}
                    onClick={() => {
                        setIsDialogOpen(true);
                        if (messages.length === 0) {
                            setMessages([{ role: 'npc', content: getGreeting() }]);
                        }
                    }}
                >
                    <sphereGeometry args={[2, 8, 8]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}

            {/* Diálogo HTML */}
            {isDialogOpen && (
                <Html position={[2, 1.5, 0]} center>
                    <div className="npc-dialog">
                        <div className="dialog-header">
                            <span>{name}</span>
                            <button onClick={() => setIsDialogOpen(false)}>✕</button>
                        </div>

                        <div className="dialog-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.role}`}>
                                    {msg.content}
                                </div>
                            ))}
                            {isThinking && (
                                <div className="message npc thinking">
                                    <span>●</span><span>●</span><span>●</span>
                                </div>
                            )}
                        </div>

                        <div className="dialog-input">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe tu pregunta..."
                            />
                            <button onClick={handleSendMessage} disabled={isThinking}>
                                Enviar
                            </button>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}
