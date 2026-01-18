import React, { useState, Suspense } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface BookProps {
    position: [number, number, number];
    title: string;
    color: string;
    resourceUrl?: string;
}

/** Libro 3D Interactivo */
function InteractiveBook({ position, title, color, resourceUrl }: BookProps) {
    const [hovered, setHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    return (
        <group position={position}>
            <mesh
                castShadow
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => setShowPreview(!showPreview)}
                scale={hovered ? 1.1 : 1}
            >
                <boxGeometry args={[0.3, 0.8, 0.5]} />
                <meshStandardMaterial
                    color={color}
                    emissive={hovered ? color : '#000000'}
                    emissiveIntensity={hovered ? 0.3 : 0}
                />
            </mesh>

            {/* Título en el lomo */}
            <Text
                position={[0.16, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                fontSize={0.08}
                color="#ffffff"
                maxWidth={0.7}
                textAlign="center"
            >
                {title}
            </Text>

            {/* Preview HTML cuando se hace clic */}
            {showPreview && (
                <Html position={[0, 1.5, 0]} center>
                    <div className="book-preview">
                        <h3>{title}</h3>
                        {resourceUrl ? (
                            <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                                📖 Abrir Recurso
                            </a>
                        ) : (
                            <p>Recurso no disponible</p>
                        )}
                        <button onClick={() => setShowPreview(false)}>Cerrar</button>
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Estantería con libros */
function Bookshelf({ position }: { position: [number, number, number] }) {
    const books = [
        { title: 'Matemáticas I', color: '#E53935', resourceUrl: '/api/digital-library/1' },
        { title: 'Física', color: '#1E88E5', resourceUrl: '/api/digital-library/2' },
        { title: 'Historia', color: '#8D6E63', resourceUrl: '/api/digital-library/3' },
        { title: 'Química', color: '#43A047', resourceUrl: '/api/digital-library/4' },
        { title: 'Literatura', color: '#7B1FA2', resourceUrl: '/api/digital-library/5' },
    ];

    return (
        <group position={position}>
            {/* Estructura de la estantería */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[2.5, 3, 0.5]} />
                    <meshStandardMaterial color="#5D4037" />
                </mesh>
            </RigidBody>

            {/* Libros en fila */}
            {books.map((book, i) => (
                <InteractiveBook
                    key={i}
                    position={[-0.8 + i * 0.4, 0.5, 0.3]}
                    title={book.title}
                    color={book.color}
                    resourceUrl={book.resourceUrl}
                />
            ))}
        </group>
    );
}

/** Mesa de estudio */
function StudyTable({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Tablero */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.1, 1]} />
                <meshStandardMaterial color="#8D6E63" />
            </mesh>
            {/* Patas */}
            {[[-0.8, 0, -0.4], [0.8, 0, -0.4], [-0.8, 0, 0.4], [0.8, 0, 0.4]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
                    <meshStandardMaterial color="#4E342E" />
                </mesh>
            ))}
        </group>
    );
}

/** Edificio Biblioteca Completo */
export default function Library() {
    return (
        <group position={[60, 0, 0]} name="library-building">
            {/* Suelo interior */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[28, 23]} />
                <meshStandardMaterial color="#D7CCC8" />
            </mesh>

            {/* Paredes exteriores (ya definidas en CampusLayout como whitebox) */}
            {/* Aquí agregamos el interior detallado */}

            {/* Lobby de entrada */}
            <Text
                position={[0, 3, 11]}
                fontSize={1}
                color="#1565C0"
                anchorX="center"
            >
                📚 Biblioteca Digital BGE
            </Text>

            {/* Estanterías */}
            <Bookshelf position={[-10, 0, 5]} />
            <Bookshelf position={[-10, 0, 0]} />
            <Bookshelf position={[-10, 0, -5]} />
            <Bookshelf position={[10, 0, 5]} />
            <Bookshelf position={[10, 0, 0]} />
            <Bookshelf position={[10, 0, -5]} />

            {/* Mesas de estudio */}
            <StudyTable position={[-3, 0, 3]} />
            <StudyTable position={[3, 0, 3]} />
            <StudyTable position={[-3, 0, -3]} />
            <StudyTable position={[3, 0, -3]} />

            {/* Iluminación interior */}
            <pointLight position={[0, 5, 0]} intensity={0.8} color="#FFF9C4" castShadow />
            <pointLight position={[-8, 4, 0]} intensity={0.4} color="#FFECB3" />
            <pointLight position={[8, 4, 0]} intensity={0.4} color="#FFECB3" />
        </group>
    );
}
