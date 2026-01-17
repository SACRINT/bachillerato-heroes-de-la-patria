import { useGLTF } from '@react-three/drei'

/**
 * Metaverse Asset Pipeline Configuration
 * Semana 2: Tareas #1, #4 (Draco & Preloading)
 */
export function initAssetPipeline() {
    console.log('🏗️ Inicializando Pipeline de Assets 3D...');

    // Configurar decodificadores Draco locales (copiados a public/draco)
    // Esto permite cargar modelos comprimidos (.glb) mucho más rápido.
    useGLTF.setDecoderPath('/draco/');

    // Aquí podemos precargar assets globales en el futuro
    // useGLTF.preload('/3d/assets/world_base.glb');

    console.log('✅ Pipeline de Assets listo (Draco Enabled)');
}
