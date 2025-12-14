/**
 * TINYMCE LOADER - Carga dinámica de TinyMCE desde CDN
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function loadTinyMCE() {
    'use strict';

    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 [TINYMCE-LOADER] INICIANDO CARGA DE TINYMCE...');
    console.log('═══════════════════════════════════════════════════');

    try {
        console.log('📡 [TINYMCE-LOADER] Fetching /api/config/public-keys...');
        const response = await fetch('/api/config/public-keys');

        console.log('📊 [TINYMCE-LOADER] Response status:', response.status);
        console.log('📊 [TINYMCE-LOADER] Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const config = await response.json();
        console.log('📦 [TINYMCE-LOADER] Config recibido:', JSON.stringify(config, null, 2));
        console.log('🔑 [TINYMCE-LOADER] config.success:', config.success);
        console.log('🔑 [TINYMCE-LOADER] config.keys:', config.keys);
        console.log('🔑 [TINYMCE-LOADER] config.keys.tinymce:', config.keys?.tinymce);
        console.log('🔑 [TINYMCE-LOADER] tinymce key type:', typeof config.keys?.tinymce);
        console.log('🔑 [TINYMCE-LOADER] tinymce key length:', config.keys?.tinymce?.length || 0);

        if (config.success && config.keys && config.keys.tinymce) {
            const apiKey = config.keys.tinymce;
            console.log('✅ [TINYMCE-LOADER] API Key obtenida (primeros 10 chars):', apiKey.substring(0, 10) + '...');

            // 🔑 CRÍTICO: Exponer API key globalmente para tinymce-config.js
            window.TINYMCE_API_KEY = apiKey;
            console.log('🌐 [TINYMCE-LOADER] API Key expuesta en window.TINYMCE_API_KEY');

            const script = document.createElement('script');
            script.referrerPolicy = 'origin';
            script.src = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6/tinymce.min.js`;

            console.log('🌐 [TINYMCE-LOADER] URL del script:', script.src);

            script.onload = () => {
                console.log('✅ [TINYMCE-LOADER] Script de TinyMCE cargado exitosamente desde CDN');
            };

            script.onerror = (error) => {
                console.error('❌ [TINYMCE-LOADER] Error al cargar script de TinyMCE desde CDN:', error);
            };

            document.head.appendChild(script);
            console.log('✅ [TINYMCE-LOADER] Script agregado al DOM');
        } else {
            console.error('❌ [TINYMCE-LOADER] Respuesta inválida del servidor:');
            console.error('   - success:', config.success);
            console.error('   - keys:', config.keys);
            console.error('   - keys.tinymce:', config.keys?.tinymce);
            throw new Error('No se pudo obtener la API key de TinyMCE del backend');
        }
    } catch (error) {
        console.error('❌ [TINYMCE-LOADER] Error crítico al cargar TinyMCE:', error);
        console.error('   - Error name:', error.name);
        console.error('   - Error message:', error.message);
        console.error('   - Error stack:', error.stack);

        // FALLBACK: Cargar TinyMCE con API key hardcodeada (solo para diagnóstico)
        console.warn('⚠️ [TINYMCE-LOADER] Intentando carga de fallback...');
        console.warn('⚠️ [TINYMCE-LOADER] Nota: Esto NO es seguro para producción');
    }

    console.log('═══════════════════════════════════════════════════');
})();
