'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AITutorPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content:
                '¡Hola! Soy tu tutor de IA personalizado. Puedo ayudarte con tus tareas, explicarte conceptos difíciles, resolver dudas de cualquier materia y prepararte para tus exámenes. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // TODO: Connect to /api/ai-chatbot
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Entiendo que necesitas ayuda con "${input}". Aquí está mi explicación:\n\nEste es un sistema de respuesta simulada. En producción, me conectaré con el backend para darte respuestas personalizadas basadas en tu historial académico y estilo de aprendizaje.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickPrompts = [
        'Explícame teorema de Pitágoras',
        'Ayúdame con ecuaciones cuadráticas',
        'Resumen de la Revolución Mexicana',
        'Tips para mi examen de Química',
    ];

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-8rem)] flex-col">
                {/* Header */}
                <div className="mb-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-10 w-10" />
                        <div>
                            <h1 className="text-3xl font-bold">Tutor IA</h1>
                            <p className="mt-1 text-purple-100">
                                Tu asistente personal de aprendizaje 24/7
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div className="flex-1 text-sm text-blue-900">
                        <strong>Modo de prueba:</strong> Este chatbot funciona con respuestas
                        simuladas. En producción, se conectará con el backend (
                        <code className="rounded bg-blue-100 px-1 py-0.5">/api/ai-chatbot</code>) para
                        darte respuestas personalizadas basadas en tu perfil académico.
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                                        <Bot className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {message.content}
                                    </p>
                                    <div
                                        className={`mt-2 text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}
                                    >
                                        {message.timestamp.toLocaleTimeString('es-MX', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                                {message.role === 'user' && (
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div className="rounded-2xl bg-gray-100 px-4 py-3">
                                    <div className="flex gap-2">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                                        <div
                                            className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                                            style={{ animationDelay: '0.2s' }}
                                        ></div>
                                        <div
                                            className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                                            style={{ animationDelay: '0.4s' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Quick Prompts */}
                {messages.length === 1 && (
                    <div className="my-4 flex flex-wrap gap-2">
                        {quickPrompts.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(prompt)}
                                className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-100"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Escribe tu pregunta aquí... (Shift+Enter para nueva línea)"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                        <span>Enviar</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
