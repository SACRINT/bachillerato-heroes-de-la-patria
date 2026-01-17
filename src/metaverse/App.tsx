import React, { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, KeyboardControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Leva, useControls } from 'leva'
import { io, Socket } from 'socket.io-client'

// Scene Components
import SceneContent from './components/SceneContent'
import LoadingScreen from './components/LoadingScreen'
import Player from './components/Player'

// UI Components (Semana 7)
import HUD from './ui/HUD'
import ChatBox from './ui/ChatBox'
import InteractionPrompt from './ui/InteractionPrompt'
import LessonPanel from './ui/LessonPanel'

// UI Components (Semana 8)
import Minimap from './ui/Minimap'
import OnboardingTutorial from './ui/OnboardingTutorial'

// Assets
import './ui/HUD.css'
import './ui/ChatBox.css'
import './ui/InteractionPrompt.css'
import './ui/LessonPanel.css'
import './ui/Minimap.css'
import './ui/OnboardingTutorial.css'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const keyboardMap = [
    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
    { name: 'jump', keys: ['Space'] },
    { name: 'run', keys: ['Shift'] },
    { name: 'interact', keys: ['e', 'E'] },
]

export default function App() {
    const { debugPhysics } = useControls('Physics', { debugPhysics: false })

    // Estado de conexión y jugador
    const [isConnected, setIsConnected] = useState(false)
    const [playerCount, setPlayerCount] = useState(1)
    const [playerId, setPlayerId] = useState('player_' + Math.random().toString(36).substr(2, 5))
    const [playerName] = useState('Héroe ' + Math.floor(Math.random() * 1000))

    // Socket ref para pasar al chat
    const socketRef = useRef<Socket | null>(null)

    // Estado de interacción
    const [hoveredObject, setHoveredObject] = useState<any>(null)
    const [activeLessonPanel, setActiveLessonPanel] = useState<any>(null)

    // Estado Semana 8
    const [showTutorial, setShowTutorial] = useState(true) // Mostrar al inicio
    const [localPlayerPos, setLocalPlayerPos] = useState({ x: 0, z: 0 })
    const [remotePlayers, setRemotePlayers] = useState<any[]>([])

    // Conectar Socket
    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            auth: { token: 'METAVERSE_GUEST_TOKEN' },
            transports: ['websocket']
        })

        socketRef.current.on('connect', () => {
            setIsConnected(true)
            setPlayerId(socketRef.current?.id || playerId)
        })

        socketRef.current.on('disconnect', () => {
            setIsConnected(false)
        })

        socketRef.current.on('metaverse:player_joined', () => {
            setPlayerCount(prev => prev + 1)
        })

        return () => {
            socketRef.current?.disconnect()
        }
    }, [])

    // Handler de interacción
    const handleInteraction = (object: any) => {
        if (object.type === 'lesson') {
            setActiveLessonPanel(object.data)
        }
        // Otros tipos de interacción...
    }

    const handleStartLesson = (lessonId: string) => {
        console.log('Iniciando lección:', lessonId)
        // Aquí podrías navegar a una página de lección o abrir un iframe
        window.open(`/lecciones/${lessonId}`, '_blank')
        setActiveLessonPanel(null)
    }

    return (
        <KeyboardControls map={keyboardMap}>
            {/* UI Overlay Layer */}
            <HUD
                playerName={playerName}
                isConnected={isConnected}
                playerCount={playerCount}
            />

            <ChatBox
                socket={socketRef.current}
                playerId={playerId}
                playerName={playerName}
            />

            <InteractionPrompt
                objectName={hoveredObject?.name || ''}
                objectType={hoveredObject?.type || ''}
                isVisible={!!hoveredObject}
            />

            <LessonPanel
                lesson={activeLessonPanel}
                isOpen={!!activeLessonPanel}
                onClose={() => setActiveLessonPanel(null)}
                onStartLesson={handleStartLesson}
            />

            {/* Semana 8: Minimapa Radar */}
            <Minimap
                localPlayerPosition={localPlayerPos}
                remotePlayers={remotePlayers}
            />

            {/* Semana 8: Tutorial de Onboarding */}
            <OnboardingTutorial
                isVisible={showTutorial}
                onComplete={() => setShowTutorial(false)}
            />

            {/* Loading Screen */}
            <LoadingScreen />

            {/* Debug Tools */}
            <Stats className="stats-panel" />
            <Leva collapsed={true} />

            {/* 3D Canvas */}
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{ antialias: true }}
                camera={{ position: [0, 5, 10], fov: 50 }}
            >
                <Physics debug={debugPhysics} gravity={[0, -9.81, 0]}>
                    <Suspense fallback={null}>
                        <SceneContent onInteract={handleInteraction} />
                        <Player />
                    </Suspense>
                </Physics>

                <OrbitControls makeDefault />
            </Canvas>
        </KeyboardControls>
    )
}
