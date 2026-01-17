import React, { createContext, useContext, useState, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface InteractableObject {
    id: string
    name: string
    type: 'lesson' | 'npc' | 'door' | 'item' | 'info'
    data?: any // Datos extra (ej: URL de lección)
}

interface InteractionContextType {
    hoveredObject: InteractableObject | null
    interact: () => void
    registerInteractable: (id: string, object: InteractableObject) => void
    unregisterInteractable: (id: string) => void
}

const InteractionContext = createContext<InteractionContextType | null>(null)

export function useInteraction() {
    const ctx = useContext(InteractionContext)
    if (!ctx) throw new Error('useInteraction must be used within InteractionProvider')
    return ctx
}

interface InteractionProviderProps {
    children: React.ReactNode
    onInteract?: (object: InteractableObject) => void
}

/**
 * Semana 7: Sistema de Interacción Central
 * Provee raycasting y gestión de objetos interactuables.
 */
export function InteractionProvider({ children, onInteract }: InteractionProviderProps) {
    const { camera, scene } = useThree()
    const [hoveredObject, setHoveredObject] = useState<InteractableObject | null>(null)
    const [interactables] = useState<Map<string, { object3D: THREE.Object3D, data: InteractableObject }>>(new Map())

    const raycaster = new THREE.Raycaster()
    raycaster.far = 5 // Distancia máxima de interacción

    // Registro de objetos interactuables
    const registerInteractable = useCallback((id: string, data: InteractableObject) => {
        // Se llamará desde los componentes 3D individuales
        const obj = scene.getObjectByName(id)
        if (obj) {
            interactables.set(id, { object3D: obj, data })
        }
    }, [scene])

    const unregisterInteractable = useCallback((id: string) => {
        interactables.delete(id)
    }, [])

    // Raycast cada frame para detectar hover
    useFrame(() => {
        // Raycast desde el centro de la pantalla (crosshair invisible)
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)

        const objectsToTest = Array.from(interactables.values()).map(i => i.object3D)
        const intersects = raycaster.intersectObjects(objectsToTest, true)

        if (intersects.length > 0) {
            const hitObject = intersects[0].object
            // Buscar en ancestros hasta encontrar el interactable registrado
            let current: THREE.Object3D | null = hitObject
            while (current) {
                const found = Array.from(interactables.entries()).find(([id]) => current?.name === id)
                if (found) {
                    setHoveredObject(found[1].data)
                    return
                }
                current = current.parent
            }
        }

        setHoveredObject(null)
    })

    const interact = useCallback(() => {
        if (hoveredObject && onInteract) {
            onInteract(hoveredObject)
        }
    }, [hoveredObject, onInteract])

    return (
        <InteractionContext.Provider value={{ hoveredObject, interact, registerInteractable, unregisterInteractable }}>
            {children}
        </InteractionContext.Provider>
    )
}
