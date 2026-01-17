import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

const tempObj = new THREE.Object3D()

/**
 * Tarea #4 + #9: Vegetación Instanciada
 * Renderea cientos de árboles con un solo draw call.
 */
export default function Vegetacion({ count = 100 }) {
    const meshRef = useRef<THREE.InstancedMesh>(null!)

    useLayoutEffect(() => {
        if (!meshRef.current) return

        let index = 0
        // Llenar las instancias
        for (let i = 0; i < count; i++) {
            // Posición polar aleatoria (evitando el centro de spawn r=25)
            const angle = Math.random() * Math.PI * 2
            const radius = 35 + Math.random() * 80 // Entre 35 y 115 distancia

            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius

            // Altura Y aproximada (para simplificar sin recalcular ruido complejo hoy)
            // Ajustamos un poco hacia arriba para que no queden enterrados si hay montaña
            // En la Fase de pulido usaremos Raycaster para "plantarlos" en el suelo exacto.
            const y = -1 + Math.random() * 3

            tempObj.position.set(x, y, z)

            // Escala variable
            const scale = 0.8 + Math.random() * 0.8
            tempObj.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale)

            tempObj.rotation.y = Math.random() * Math.PI // Rotación random

            tempObj.updateMatrix()
            meshRef.current.setMatrixAt(i, tempObj.matrix)
            index++
        }
        meshRef.current.instanceMatrix.needsUpdate = true
    }, [count])

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
            {/* Geometría: Un Pino Low Poly (Cono de 8 lados) */}
            <coneGeometry args={[2, 7, 8]} />
            <meshStandardMaterial color="#1a472a" roughness={0.8} flatShading />
        </instancedMesh>
    )
}
