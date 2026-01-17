import React from 'react'
import { Sky, Stars, Environment as EnvironmentMap } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useControls } from 'leva'
import * as THREE from 'three'

/**
 * WorldEnvironment - Semana 3
 * Maneja Atmósfera (Cielo, Niebla), Iluminación Global y Post-Procesado.
 */
export default function WorldEnvironment() {
    // Controles de Atmósfera (Tareas #1, #3)
    const { sunPos, fogColor, fogDensity, bloomIntensity } = useControls('Atmosphere', {
        sunPos: { value: [10, 40, 20], label: 'Sun Position' },
        fogColor: { value: '#121212', label: 'Fog Color' },
        fogDensity: { value: 0.02, min: 0, max: 0.1, step: 0.001, label: 'Fog Density' },
        bloomIntensity: { value: 0.8, min: 0, max: 2, label: 'Bloom Power' }
    })

    return (
        <>
            {/* Tarea #1: Skybox & Stars */}
            <Sky
                distance={450000}
                sunPosition={sunPos}
                inclination={0}
                azimuth={0.25}
            />
            <Stars
                radius={100}
                depth={50}
                count={2000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />

            {/* Tarea #3: Niebla (Fog) para profundidad */}
            <fogExp2 attach="fog" args={[fogColor, fogDensity]} />
            <color attach="background" args={[fogColor]} />

            {/* Tarea #10: Iluminación Ambiental y Reflejos */}
            <EnvironmentMap preset="city" blur={0.8} />
            <ambientLight intensity={0.3} color="#bdefff" />
            <directionalLight
                position={sunPos}
                intensity={2.0}
                castShadow
                shadow-bias={-0.0004}
                shadow-mapSize={[2048, 2048]}
            />

            {/* Tarea #5: Post-Processing (Cinematic Look) */}
            <EffectComposer disableNormalPass>
                <Bloom
                    luminanceThreshold={0.9} // Solo brilla lo muy brillante
                    mipmapBlur
                    intensity={bloomIntensity}
                    radius={0.4}
                />
                <Vignette eskil={false} offset={0.05} darkness={0.6} />
            </EffectComposer>
        </>
    )
}
