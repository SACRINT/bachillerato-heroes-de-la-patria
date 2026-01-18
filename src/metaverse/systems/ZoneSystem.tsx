import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CAMPUS_ZONES } from '../world/CampusLayout';

type ZoneId = keyof typeof CAMPUS_ZONES;

interface ZoneState {
    loaded: boolean;
    priority: 'high' | 'medium' | 'low';
}

interface ZoneContextType {
    currentZone: ZoneId;
    zoneStates: Record<ZoneId, ZoneState>;
    updatePlayerPosition: (x: number, z: number) => void;
    isZoneLoaded: (zoneId: ZoneId) => boolean;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

/**
 * Semana 21: Sistema de Sectorización para carga dinámica de zonas
 * Determina qué zona está activa basándose en la posición del jugador
 */
export function ZoneProvider({ children }: { children: ReactNode }) {
    const [currentZone, setCurrentZone] = useState<ZoneId>('PLAZA_CENTRAL');
    const [zoneStates, setZoneStates] = useState<Record<ZoneId, ZoneState>>(() => {
        const initial: Record<string, ZoneState> = {};
        Object.keys(CAMPUS_ZONES).forEach((key) => {
            initial[key] = { loaded: key === 'PLAZA_CENTRAL', priority: 'low' };
        });
        return initial as Record<ZoneId, ZoneState>;
    });

    const getZoneAtPosition = useCallback((x: number, z: number): ZoneId => {
        let closestZone: ZoneId = 'PLAZA_CENTRAL';
        let closestDistance = Infinity;

        (Object.entries(CAMPUS_ZONES) as [ZoneId, typeof CAMPUS_ZONES[ZoneId]][]).forEach(([id, zone]) => {
            const dx = x - zone.position[0];
            const dz = z - zone.position[2];
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestZone = id;
            }
        });

        return closestZone;
    }, []);

    const updatePlayerPosition = useCallback((x: number, z: number) => {
        const newZone = getZoneAtPosition(x, z);

        if (newZone !== currentZone) {
            setCurrentZone(newZone);

            // Actualizar prioridades de carga
            setZoneStates((prev) => {
                const updated = { ...prev };

                // La zona actual tiene alta prioridad y está cargada
                updated[newZone] = { loaded: true, priority: 'high' };

                // Zonas adyacentes tienen prioridad media
                Object.keys(CAMPUS_ZONES).forEach((key) => {
                    const zone = CAMPUS_ZONES[key as ZoneId];
                    const current = CAMPUS_ZONES[newZone];
                    const dx = zone.position[0] - current.position[0];
                    const dz = zone.position[2] - current.position[2];
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    if (key !== newZone) {
                        if (dist < 80) {
                            updated[key as ZoneId] = { loaded: true, priority: 'medium' };
                        } else {
                            updated[key as ZoneId] = { loaded: false, priority: 'low' };
                        }
                    }
                });

                return updated;
            });
        }
    }, [currentZone, getZoneAtPosition]);

    const isZoneLoaded = useCallback((zoneId: ZoneId): boolean => {
        return zoneStates[zoneId]?.loaded ?? false;
    }, [zoneStates]);

    return (
        <ZoneContext.Provider value={{ currentZone, zoneStates, updatePlayerPosition, isZoneLoaded }}>
            {children}
        </ZoneContext.Provider>
    );
}

export function useZone() {
    const context = useContext(ZoneContext);
    if (!context) {
        throw new Error('useZone must be used within ZoneProvider');
    }
    return context;
}
