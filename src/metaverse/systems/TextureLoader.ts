import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'

/**
 * Semana 1 Tarea #7: Loader de Texturas
 * Sistema centralizado para cargar y cachear texturas.
 */
class TextureLoader {
    private cache: Map<string, THREE.Texture> = new Map()
    private loader: THREE.TextureLoader

    constructor() {
        this.loader = new THREE.TextureLoader()
    }

    /**
     * Carga una textura con opciones de configuración
     */
    async load(url: string, options: {
        wrapS?: THREE.Wrapping
        wrapT?: THREE.Wrapping
        repeat?: [number, number]
        encoding?: THREE.TextureEncoding
    } = {}): Promise<THREE.Texture> {
        // Verificar cache
        if (this.cache.has(url)) {
            return this.cache.get(url)!
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (texture) => {
                    // Aplicar opciones
                    if (options.wrapS) texture.wrapS = options.wrapS
                    if (options.wrapT) texture.wrapT = options.wrapT
                    if (options.repeat) texture.repeat.set(...options.repeat)
                    if (options.encoding) texture.encoding = options.encoding

                    // Cachear
                    this.cache.set(url, texture)
                    resolve(texture)
                },
                undefined,
                (error) => reject(error)
            )
        })
    }

    /**
     * Precarga múltiples texturas
     */
    async preloadAll(urls: string[]): Promise<THREE.Texture[]> {
        return Promise.all(urls.map(url => this.load(url)))
    }

    /**
     * Libera una textura de memoria
     */
    dispose(url: string): void {
        const texture = this.cache.get(url)
        if (texture) {
            texture.dispose()
            this.cache.delete(url)
        }
    }

    /**
     * Libera todas las texturas
     */
    disposeAll(): void {
        this.cache.forEach(texture => texture.dispose())
        this.cache.clear()
    }

    /**
     * Obtiene estadísticas del cache
     */
    getStats(): { count: number; urls: string[] } {
        return {
            count: this.cache.size,
            urls: Array.from(this.cache.keys())
        }
    }
}

// Singleton
export const textureLoader = new TextureLoader()

/**
 * Hook de React para cargar texturas
 */
export function useTexture(url: string) {
    return useLoader(THREE.TextureLoader, url)
}

export default TextureLoader
