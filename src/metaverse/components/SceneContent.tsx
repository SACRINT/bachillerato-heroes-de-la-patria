import React from 'react'
import { Grid } from '@react-three/drei'
import WorldEnvironment from './WorldEnvironment'
import Terreno from './Terreno'
import Vegetacion from './Vegetacion'
import LessonBoard from '../objects/LessonBoard'

interface SceneContentProps {
    onInteract?: (object: any) => void
}

// Datos de ejemplo de lecciones
const SAMPLE_LESSONS = [
    {
        id: 'lesson_math_001',
        position: [8, 2, -5] as [number, number, number],
        title: 'Álgebra Básica',
        subject: 'Matemáticas',
        lessonData: {
            id: 'lesson_math_001',
            title: 'Álgebra Básica',
            description: 'Aprende los fundamentos del álgebra: ecuaciones lineales, factorización y expresiones algebraicas.',
            subject: 'Matemáticas',
            duration: '45 min'
        }
    },
    {
        id: 'lesson_esp_001',
        position: [-8, 2, -3] as [number, number, number],
        title: 'Redacción Creativa',
        subject: 'Español',
        lessonData: {
            id: 'lesson_esp_001',
            title: 'Redacción Creativa',
            description: 'Desarrolla tu habilidad de escritura con técnicas de narrativa y expresión literaria.',
            subject: 'Español',
            duration: '30 min'
        }
    },
    {
        id: 'lesson_hist_001',
        position: [0, 2, -12] as [number, number, number],
        title: 'Revolución Mexicana',
        subject: 'Historia',
        lessonData: {
            id: 'lesson_hist_001',
            title: 'Revolución Mexicana',
            description: 'Explora los eventos, personajes y consecuencias de la Revolución Mexicana de 1910.',
            subject: 'Historia',
            duration: '60 min'
        }
    }
]

/**
 * SceneContent - Coordinator
 * Semana 7: Ahora incluye objetos interactuables.
 */
export default function SceneContent({ onInteract }: SceneContentProps) {
    return (
        <>
            {/* Entorno y Atmósfera */}
            <WorldEnvironment />

            {/* Terreno Procedural */}
            <Terreno />

            {/* Vegetación Optimizada */}
            <Vegetacion count={150} />

            {/* Grid de Referencia */}
            <Grid
                infiniteGrid
                fadeDistance={40}
                sectionColor="#ffffff"
                cellColor="#555555"
                sectionThickness={1}
                cellThickness={0.5}
                position={[0, 0.05, 0]}
            />

            {/* Spawn Point Marker */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 3, 1]} />
                <meshStandardMaterial
                    color="#00ffaa"
                    emissive="#00ffaa"
                    emissiveIntensity={1.5}
                    toneMapped={false}
                />
            </mesh>

            {/* 📚 OBJETOS INTERACTUABLES - Pizarras de Lecciones */}
            {SAMPLE_LESSONS.map((lesson) => (
                <LessonBoard
                    key={lesson.id}
                    id={lesson.id}
                    position={lesson.position}
                    title={lesson.title}
                    subject={lesson.subject}
                    lessonData={lesson.lessonData}
                />
            ))}
        </>
    )
}
