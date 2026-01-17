import React from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Tarea #6: Pantalla de Carga 3D
 * Muestra el progreso de carga de assets del AssetManager
 */
export default function LoadingScreen() {
    const { progress, active, item } = useProgress();

    // Ocultar si terminó la carga
    if (!active && progress === 100) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#050505',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            transition: 'opacity 0.5s ease-out',
            pointerEvents: 'none'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{
                    color: '#ffffff',
                    fontSize: '2rem',
                    fontWeight: '300',
                    letterSpacing: '0.2em',
                    marginBottom: '2rem',
                    textTransform: 'uppercase'
                }}>
                    BGE Metaverse <span style={{ color: '#00ffff', fontSize: '1rem', verticalAlign: 'top' }}>ALPHA</span>
                </h1>

                <div style={{
                    width: '300px',
                    height: '2px',
                    background: '#333333',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '2px'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00ffff, #0088ff)',
                        boxShadow: '0 0 10px #00ffff',
                        transition: 'width 0.2s ease-out'
                    }} />
                </div>

                <p style={{
                    color: '#666',
                    fontSize: '0.8rem',
                    marginTop: '1rem',
                    fontFamily: 'monospace'
                }}>
                    {item || 'Inicializando entorno...'} ({Math.round(progress)}%)
                </p>
            </div>
        </div>
    );
}
