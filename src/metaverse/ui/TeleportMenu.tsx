import React, { useState } from 'react';
import { TELEPORT_POINTS } from '../world/CampusLayout';
import './TeleportMenu.css';

interface TeleportMenuProps {
    onTeleport: (position: [number, number, number]) => void;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Semana 21: Menú de Teletransporte entre POIs del Campus
 */
export default function TeleportMenu({ onTeleport, isOpen, onClose }: TeleportMenuProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleTeleport = (point: typeof TELEPORT_POINTS[0]) => {
        // Elevar un poco el punto de destino para evitar colisiones
        const destination: [number, number, number] = [
            point.position[0],
            point.position[1] + 2,
            point.position[2]
        ];
        onTeleport(destination);
        onClose();
    };

    return (
        <div className="teleport-overlay" onClick={onClose}>
            <div className="teleport-menu" onClick={(e) => e.stopPropagation()}>
                <h2>🌀 Teletransporte</h2>
                <p className="subtitle">Selecciona un destino</p>

                <div className="teleport-grid">
                    {TELEPORT_POINTS.map((point) => (
                        <button
                            key={point.id}
                            className={`teleport-btn ${hoveredId === point.id ? 'hovered' : ''}`}
                            onMouseEnter={() => setHoveredId(point.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => handleTeleport(point)}
                        >
                            <span className="icon">
                                {point.id === 'PLAZA_CENTRAL' && '🏛️'}
                                {point.id === 'BIBLIOTECA' && '📚'}
                                {point.id === 'AULAS' && '🏫'}
                                {point.id === 'PATIO' && '⚽'}
                                {point.id === 'ADMIN' && '🔒'}
                            </span>
                            <span className="name">{point.name}</span>
                        </button>
                    ))}
                </div>

                <button className="close-btn" onClick={onClose}>✕ Cerrar</button>
            </div>
        </div>
    );
}
