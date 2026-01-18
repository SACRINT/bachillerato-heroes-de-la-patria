import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface VoiceParticipant {
    oderId: string;
    name: string;
    isSpeaking: boolean;
    isMuted: boolean;
    position: [number, number, number];
}

interface SpatialAudioContextType {
    isVoiceEnabled: boolean;
    isMicMuted: boolean;
    participants: VoiceParticipant[];
    volume: number;
    toggleMic: () => void;
    setVolume: (vol: number) => void;
    initializeVoice: () => Promise<void>;
    disconnectVoice: () => void;
}

const SpatialAudioContext = createContext<SpatialAudioContextType | undefined>(undefined);

/**
 * Semana 24: Sistema de Audio Espacial 3D
 * Maneja conexiones de voz y posicionamiento de audio
 */
export function SpatialAudioProvider({ children }: { children: ReactNode }) {
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
    const [volume, setVolume] = useState(0.8);

    const audioContextRef = useRef<AudioContext | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Inicializar Web Audio API
    useEffect(() => {
        // Crear contexto de audio cuando el componente se monta
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const initializeVoice = useCallback(async () => {
        try {
            // Solicitar acceso al micrófono
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            localStreamRef.current = stream;
            setIsVoiceEnabled(true);
            setIsMicMuted(false);

            console.log('🎤 Voice chat initialized');

            // TODO: Conectar a servidor de voz (Agora/Twilio/LiveKit)
            // Aquí iría la lógica de WebRTC o SDK de terceros

        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }, []);

    const disconnectVoice = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        setIsVoiceEnabled(false);
        setIsMicMuted(true);
        console.log('🔇 Voice chat disconnected');
    }, []);

    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Calcular atenuación basada en distancia (para audio posicional)
    const calculateAttenuation = useCallback((
        listenerPos: [number, number, number],
        sourcePos: [number, number, number]
    ): number => {
        const dx = listenerPos[0] - sourcePos[0];
        const dy = listenerPos[1] - sourcePos[1];
        const dz = listenerPos[2] - sourcePos[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const maxDistance = 30; // Distancia máxima de audibilidad
        const rolloff = 1.5;    // Factor de atenuación

        if (distance >= maxDistance) return 0;

        return Math.pow(1 - distance / maxDistance, rolloff);
    }, []);

    return (
        <SpatialAudioContext.Provider
            value={{
                isVoiceEnabled,
                isMicMuted,
                participants,
                volume,
                toggleMic,
                setVolume,
                initializeVoice,
                disconnectVoice,
            }}
        >
            {children}
        </SpatialAudioContext.Provider>
    );
}

export function useSpatialAudio() {
    const context = useContext(SpatialAudioContext);
    if (!context) {
        throw new Error('useSpatialAudio must be used within SpatialAudioProvider');
    }
    return context;
}
