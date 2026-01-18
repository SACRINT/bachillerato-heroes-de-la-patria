import React, { useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Text, Html } from '@react-three/drei';

interface ClassroomProps {
    id: string;
    subject: string;
    teacherName: string;
    maxStudents?: number;
    position?: [number, number, number];
}

interface SeatProps {
    position: [number, number, number];
    seatNumber: number;
    isOccupied?: boolean;
}

/** Asiento individual */
function StudentSeat({ position, seatNumber, isOccupied }: SeatProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            {/* Escritorio */}
            <mesh position={[0, 0.4, 0]} castShadow>
                <boxGeometry args={[0.8, 0.05, 0.6]} />
                <meshStandardMaterial color="#8D6E63" />
            </mesh>

            {/* Silla */}
            <mesh
                position={[0, 0.25, 0.4]}
                castShadow
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[0.4, 0.5, 0.4]} />
                <meshStandardMaterial
                    color={isOccupied ? '#E57373' : hovered ? '#81C784' : '#2196F3'}
                />
            </mesh>

            {/* Número de asiento */}
            <Text
                position={[0, 0.5, 0]}
                fontSize={0.15}
                color="#000"
            >
                {seatNumber}
            </Text>
        </group>
    );
}

/** Podio del profesor */
function TeacherPodium() {
    return (
        <group position={[0, 0, -5]}>
            {/* Plataforma elevada */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4, 0.3, 2]} />
                    <meshStandardMaterial color="#5D4037" />
                </mesh>
            </RigidBody>

            {/* Escritorio del profesor */}
            <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[2, 0.8, 0.8]} />
                <meshStandardMaterial color="#4E342E" />
            </mesh>

            {/* Pizarra */}
            <mesh position={[0, 2.5, -0.9]} receiveShadow>
                <boxGeometry args={[6, 3, 0.1]} />
                <meshStandardMaterial color="#263238" />
            </mesh>

            <Text
                position={[0, 2.5, -0.8]}
                fontSize={0.3}
                color="#FFFFFF"
                maxWidth={5.5}
                textAlign="center"
            >
                Bienvenidos a clase
            </Text>
        </group>
    );
}

/** Aula Completa */
export default function Classroom({ id, subject, teacherName, maxStudents = 30, position = [0, 0, 0] }: ClassroomProps) {
    const [isInSession, setIsInSession] = useState(false);
    const rows = 5;
    const seatsPerRow = 6;

    // Generar asientos en grid
    const seats: { position: [number, number, number]; number: number }[] = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < seatsPerRow; col++) {
            seats.push({
                position: [
                    (col - seatsPerRow / 2 + 0.5) * 1.5,
                    0,
                    row * 1.5 + 2
                ],
                number: row * seatsPerRow + col + 1
            });
        }
    }

    return (
        <group position={position} name={`classroom-${id}`}>
            {/* Suelo del aula */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[12, 14]} />
                <meshStandardMaterial color="#ECEFF1" />
            </mesh>

            {/* Paredes */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[-6, 2, 0]}>
                    <boxGeometry args={[0.2, 4, 14]} />
                    <meshStandardMaterial color="#BDBDBD" />
                </mesh>
            </RigidBody>
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[6, 2, 0]}>
                    <boxGeometry args={[0.2, 4, 14]} />
                    <meshStandardMaterial color="#BDBDBD" />
                </mesh>
            </RigidBody>

            {/* Podio del profesor */}
            <TeacherPodium />

            {/* Asientos de estudiantes */}
            {seats.map((seat, i) => (
                <StudentSeat
                    key={i}
                    position={seat.position}
                    seatNumber={seat.number}
                    isOccupied={false}
                />
            ))}

            {/* Cartel de la materia */}
            <Text
                position={[0, 3.8, -6]}
                fontSize={0.5}
                color="#1565C0"
                anchorX="center"
            >
                {subject}
            </Text>
            <Text
                position={[0, 3.3, -6]}
                fontSize={0.25}
                color="#666"
                anchorX="center"
            >
                Prof. {teacherName}
            </Text>

            {/* Indicador de estado */}
            <mesh position={[5.5, 3.5, -6]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                    color={isInSession ? '#4CAF50' : '#9E9E9E'}
                    emissive={isInSession ? '#4CAF50' : '#000'}
                    emissiveIntensity={isInSession ? 0.5 : 0}
                />
            </mesh>

            {/* Iluminación */}
            <pointLight position={[0, 3.5, 0]} intensity={0.6} color="#FFF" castShadow />
        </group>
    );
}
