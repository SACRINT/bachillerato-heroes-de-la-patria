import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface AITeacherProps {
    position: [number, number, number];
    name: string;
    subject: string;
    personality: string;
    avatarUrl?: string;
    onInteract?: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Semana 51: AI Teacher Avatar con conversación inteligente
 * Integra LLM, TTS y Lip-Sync básico
 */
export default function AITeacher({
    position,
    name,
    subject,
    personality,
    onInteract
}: AITeacherProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [mouthOpenness, setMouthOpenness] = useState(0);

    // Animación de Lip-Sync básica
    useFrame((state) => {
        if (meshRef.current) {
            // Idle animation
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

            // Lip-sync simulation
            if (isSpeaking) {
                setMouthOpenness(Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.5);
            } else {
                setMouthOpenness(0);
            }
        }
    });

    // Sistema de prompt para el AI
    const systemPrompt = `Eres ${name}, un profesor virtual de ${subject} en el Metaverso Educativo "Héroes de la Patria".
Tu personalidad es: ${personality}
Reglas:
1. Responde siempre en español de México
2. Mantén respuestas cortas (máximo 3 oraciones)
3. Si no sabes algo, admítelo honestamente
4. Nunca generes contenido inapropiado para menores
5. Enfócate en temas educativos de ${subject}
6. Sé motivador y paciente con los estudiantes`;

    // Enviar mensaje al AI
    const sendMessage = useCallback(async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = { role: 'user', content: inputText };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/ai/teacher/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    systemPrompt,
                    teacherId: name
                })
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Text-to-Speech
            await speakText(data.response);

        } catch (error) {
            console.error('Error communicating with AI:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Disculpa, tengo un pequeño problema técnico. ¿Podrías repetir tu pregunta?'
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [inputText, messages, name, systemPrompt]);

    // Text-to-Speech con Web Speech API
    const speakText = async (text: string) => {
        if ('speechSynthesis' in window) {
            setIsSpeaking(true);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-MX';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            // Buscar voz en español
            const voices = speechSynthesis.getVoices();
            const spanishVoice = voices.find(v => v.lang.includes('es'));
            if (spanishVoice) utterance.voice = spanishVoice;

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            speechSynthesis.speak(utterance);
        }
    };

    // Manejar input de voz
    const startVoiceInput = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = 'es-MX';
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
            };

            recognition.start();
        }
    };

    return (
        <group position={position}>
            {/* Avatar del profesor */}
            <mesh
                ref={meshRef}
                onClick={() => {
                    setIsInteracting(true);
                    onInteract?.();
                }}
                castShadow
            >
                {/* Cuerpo */}
                <capsuleGeometry args={[0.3, 1, 8, 16]} />
                <meshStandardMaterial color="#3F51B5" />
            </mesh>

            {/* Cabeza */}
            <mesh position={[0, 1, 0]} castShadow>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#FFE0B2" />
            </mesh>

            {/* Boca animada (Lip-Sync) */}
            <mesh position={[0, 0.9, 0.2]} scale={[0.1, 0.02 + mouthOpenness * 0.05, 0.05]}>
                <boxGeometry />
                <meshBasicMaterial color="#D32F2F" />
            </mesh>

            {/* Nombre flotante */}
            <Text
                position={[0, 1.5, 0]}
                fontSize={0.15}
                color="#FFFFFF"
                anchorX="center"
            >
                {name}
            </Text>
            <Text
                position={[0, 1.35, 0]}
                fontSize={0.1}
                color="#90CAF9"
                anchorX="center"
            >
                Profesor de {subject}
            </Text>

            {/* Indicador de estado */}
            {isSpeaking && (
                <mesh position={[0, 1.7, 0]}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshBasicMaterial color="#4CAF50" />
                </mesh>
            )}

            {/* Chat UI */}
            {isInteracting && (
                <Html position={[1.5, 0.5, 0]} center>
                    <div className="ai-teacher-chat">
                        <div className="chat-header">
                            <span>💬 {name}</span>
                            <button onClick={() => setIsInteracting(false)}>✕</button>
                        </div>

                        <div className="messages">
                            {messages.length === 0 && (
                                <div className="welcome">
                                    ¡Hola! Soy tu profesor de {subject}. ¿En qué puedo ayudarte?
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.role}`}>
                                    {msg.content}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="message assistant typing">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            )}
                        </div>

                        <div className="input-area">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Escribe tu pregunta..."
                            />
                            <button onClick={startVoiceInput} title="Voz">🎤</button>
                            <button onClick={sendMessage} title="Enviar">📤</button>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// Estilos CSS inline para el chat
const chatStyles = `
.ai-teacher-chat {
  width: 320px;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid #7C4DFF;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Rajdhani', sans-serif;
}

.chat-header {
  background: #7C4DFF;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.chat-header button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
}

.messages {
  height: 250px;
  overflow-y: auto;
  padding: 15px;
}

.message {
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 10px;
  max-width: 85%;
}

.message.user {
  background: #3F51B5;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.welcome {
  text-align: center;
  color: #aaa;
  padding: 20px;
}

.typing .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #7C4DFF;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 0.5s infinite alternate;
}

.typing .dot:nth-child(2) { animation-delay: 0.1s; }
.typing .dot:nth-child(3) { animation-delay: 0.2s; }

@keyframes bounce {
  to { transform: translateY(-5px); }
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-area input {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.input-area button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #7C4DFF;
  cursor: pointer;
  font-size: 1.2rem;
}
`;
