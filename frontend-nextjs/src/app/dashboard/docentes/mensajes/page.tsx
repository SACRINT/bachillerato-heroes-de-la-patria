'use client';

import {
    MessageSquare,
    Send,
    Search,
    MoreVertical,
    Paperclip,
    Smile,
    Star,
    Archive
} from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useState } from 'react';

export default function MensajesPage() {
    const [selectedChat, setSelectedChat] = useState(1);
    const [messageText, setMessageText] = useState('');

    const conversaciones = [
        {
            id: 1,
            nombre: 'Ana García López',
            tipo: 'estudiante',
            ultimoMensaje: '¿Podría explicarme el ejercicio 5?',
            tiempo: '10 min',
            noLeidos: 2,
            avatar: 'AG',
            online: true
        },
        {
            id: 2,
            nombre: 'María Rodríguez',
            tipo: 'padre',
            ultimoMensaje: 'Gracias por el reporte, profesor',
            tiempo: '1 hora',
            noLeidos: 0,
            avatar: 'MR',
            online: false
        },
        {
            id: 3,
            nombre: 'Carlos Hernández',
            tipo: 'estudiante',
            ultimoMensaje: 'Entendido, profesor',
            tiempo: '3 horas',
            noLeidos: 0,
            avatar: 'CH',
            online: true
        },
    ];

    const mensajes = [
        {
            id: 1,
            emisor: 'Ana García López',
            contenido: 'Buenas tardes, profesor',
            tiempo: '14:32',
            propio: false
        },
        {
            id: 2,
            emisor: 'Tú',
            contenido: 'Buenas tardes, Ana. ¿En qué puedo ayudarte?',
            tiempo: '14:33',
            propio: true
        },
        {
            id: 3,
            emisor: 'Ana García López',
            contenido: '¿Podría explicarme el ejercicio 5 de la tarea? No entiendo el segundo paso',
            tiempo: '14:34',
            propio: false
        },
        {
            id: 4,
            emisor: 'Tú',
            contenido: 'Claro que sí. El segundo paso requiere factorizar la expresión. ¿Ya intentaste identificar los factores comunes?',
            tiempo: '14:35',
            propio: true
        },
    ];

    const handleSend = () => {
        if (messageText.trim()) {
            console.log('Enviando mensaje:', messageText);
            setMessageText('');
        }
    };

    return (
        <TeacherDashboardLayout>
            <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Sidebar de Conversaciones */}
                <div className="w-80 border-r border-gray-200">
                    {/* Search */}
                    <div className="border-b border-gray-200 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar conversación..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Lista de Conversaciones */}
                    <div className="overflow-y-auto" style={{ height: 'calc(100% - 73px)' }}>
                        {conversaciones.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedChat(conv.id)}
                                className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors ${selectedChat === conv.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                        {conv.avatar}
                                    </div>
                                    {conv.online && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between">
                                        <h4 className="truncate text-sm font-semibold text-gray-900">
                                            {conv.nombre}
                                        </h4>
                                        <span className="text-xs text-gray-500">{conv.tiempo}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="truncate text-sm text-gray-500">{conv.ultimoMensaje}</p>
                                        {conv.noLeidos > 0 && (
                                            <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                                                {conv.noLeidos}
                                            </span>
                                        )}
                                    </div>
                                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                        {conv.tipo}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Área de Chat */}
                <div className="flex flex-1 flex-col">
                    {/* Header del Chat */}
                    <div className="flex items-center justify-between border-b border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                    AG
                                </div>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Ana García López</h3>
                                <p className="text-xs text-emerald-600">En línea</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                                <Star className="h-5 w-5" />
                            </button>
                            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                                <Archive className="h-5 w-5" />
                            </button>
                            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {mensajes.map((mensaje) => (
                            <div
                                key={mensaje.id}
                                className={`flex ${mensaje.propio ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${mensaje.propio ? 'order-2' : 'order-1'}`}>
                                    {!mensaje.propio && (
                                        <p className="mb-1 text-xs font-medium text-gray-600">
                                            {mensaje.emisor}
                                        </p>
                                    )}
                                    <div
                                        className={`rounded-2xl px-4 py-2 ${mensaje.propio
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        <p className="text-sm">{mensaje.contenido}</p>
                                    </div>
                                    <p className={`mt-1 text-xs text-gray-500 ${mensaje.propio ? 'text-right' : ''}`}>
                                        {mensaje.tiempo}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input de Mensaje */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-end gap-3">
                            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <div className="flex-1">
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                                <Smile className="h-5 w-5" />
                            </button>
                            <button
                                onClick={handleSend}
                                className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
