import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'

/**
 * Semana 2: Asset Management System
 * Gestiona carga de modelos 3D con optimización y gestión de memoria.
 */

// Cache global de modelos
const modelCache = new Map<string, THREE.Group>()
const disposables: Set<{ dispose: () => void }> = new Set()

// Configurar loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Tarea #3: Script para optimizar modelos (utilidad)
 */
export function getModelOptimizationReport(model: THREE.Group): {
    triangles: number
    vertices: number
    materials: number
    textures: number
    recommendations: string[]
} {
    let triangles = 0
    let vertices = 0
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()
    const recommendations: string[] = []

    model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const geometry = child.geometry
            if (geometry.index) {
                triangles += geometry.index.count / 3
            } else if (geometry.attributes.position) {
                triangles += geometry.attributes.position.count / 3
            }
            vertices += geometry.attributes.position?.count || 0

            const mats = Array.isArray(child.material) ? child.material : [child.material]
            mats.forEach(mat => {
                materials.add(mat)
                // Buscar texturas
                Object.values(mat).forEach(value => {
                    if (value instanceof THREE.Texture) {
                        textures.add(value)
                    }
                })
            })
        }
    })

    // Generar recomendaciones
    if (triangles > 50000) {
        recommendations.push(`Alto número de triángulos (${triangles}). Considerar decimation.`)
    }
    if (materials.size > 5) {
        recommendations.push(`Muchos materiales (${materials.size}). Usar texture atlas.`)
    }
    if (textures.size > 0) {
        textures.forEach(tex => {
            if (tex.image && (tex.image.width > 2048 || tex.image.height > 2048)) {
                recommendations.push(`Textura muy grande. Reducir a 1024 o 2048.`)
            }
        })
    }

    return { triangles, vertices, materials: materials.size, textures: textures.size, recommendations }
}

/**
 * Tarea #7: Gestión de errores en carga de modelos
 */
export async function loadModel(url: string, options: {
    onProgress?: (progress: number) => void
    useCache?: boolean
    clone?: boolean
} = {}): Promise<THREE.Group> {
    const { onProgress, useCache = true, clone = false } = options

    // Verificar cache
    if (useCache && modelCache.has(url)) {
        const cached = modelCache.get(url)!
        return clone ? cached.clone() : cached
    }

    return new Promise((resolve, reject) => {
        gltfLoader.load(
            url,
            (gltf) => {
                const model = gltf.scene

                // Cachear si está habilitado
                if (useCache) {
                    modelCache.set(url, model)
                }

                // Registrar para dispose
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        disposables.add(child.geometry)
                        const mats = Array.isArray(child.material) ? child.material : [child.material]
                        mats.forEach(mat => disposables.add(mat))
                    }
                })

                resolve(clone ? model.clone() : model)
            },
            (event) => {
                if (onProgress && event.total > 0) {
                    onProgress(event.loaded / event.total)
                }
            },
            (error) => {
                console.error(`[AssetManager] Error loading model: ${url}`, error)
                reject(new Error(`Failed to load model: ${url}. ${error.message || 'Unknown error'}`))
            }
        )
    })
}

/**
 * Tarea #9: InstancedMesh helper para objetos repetitivos
 */
export function createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
    positions: THREE.Vector3[]
): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, count)
    const matrix = new THREE.Matrix4()

    positions.forEach((pos, i) => {
        if (i >= count) return
        matrix.setPosition(pos)
        mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    disposables.add(mesh.geometry)
    disposables.add(mesh.material as THREE.Material)

    return mesh
}

/**
 * Tarea #10: Sistema de LOD básico
 */
export function createLOD(levels: { mesh: THREE.Mesh; distance: number }[]): THREE.LOD {
    const lod = new THREE.LOD()
    levels.forEach(({ mesh, distance }) => {
        lod.addLevel(mesh, distance)
    })
    return lod
}

/**
 * Tarea #11: Banco de materiales compartidos
 */
export const SharedMaterials = {
    // Materiales básicos reutilizables
    grass: new THREE.MeshStandardMaterial({
        color: 0x4a7c59,
        roughness: 0.9,
        metalness: 0.1
    }),
    concrete: new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.2
    }),
    metal: new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.9
    }),
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.9,
        transmission: 0.9
    }),
    hologram: new THREE.MeshBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.7,
        wireframe: true
    })
}

/**
 * Tarea #12: Dispose pattern para liberar memoria
 */
export function disposeModel(url: string): void {
    const model = modelCache.get(url)
    if (model) {
        model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()
                const mats = Array.isArray(child.material) ? child.material : [child.material]
                mats.forEach(mat => mat.dispose())
            }
        })
        modelCache.delete(url)
    }
}

export function disposeAll(): void {
    disposables.forEach(item => item.dispose())
    disposables.clear()
    modelCache.clear()
    console.log('[AssetManager] All assets disposed')
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats() {
    return {
        modelCount: modelCache.size,
        disposableCount: disposables.size,
        models: Array.from(modelCache.keys())
    }
}

export { gltfLoader, dracoLoader }
