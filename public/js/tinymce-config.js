/**
 * TINYMCE CONFIGURATION - Editor WYSIWYG para CMS
 * Configuración del editor de texto rico para Noticias y Comunicados
 * VERSIÓN MEJORADA: Combina arquitectura OOP + Fix readonly crítico
 * Fecha: 14 de Noviembre, 2025
 */

class TinyMCEManager {
    constructor() {
        this.editors = {};
        this.uploadEndpoint = '/api/upload/image';
        this.defaultConfig = {
            // 🔐 FIX CRÍTICO: Prevenir modo readonly
            readonly: false,
            disabled: false,

            // Configuración básica
            height: 400,
            menubar: true,
            language: 'es',
            language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.10.9/langs6/es.min.js',

            // 🔧 FIX CRÍTICO: Configurar base URL del CDN para TODOS los recursos
            base_url: 'https://cdn.tiny.cloud/1/9eomuls0jgbqziqkahugmesowt48tellxulfspshp9pa03bi/tinymce/6.8.3-131',

            // 🔧 FIX CRÍTICO: Forzar carga de tema y estilos desde CDN
            skin_url: 'https://cdn.tiny.cloud/1/9eomuls0jgbqziqkahugmesowt48tellxulfspshp9pa03bi/tinymce/6.8.3-131/skins/ui/oxide',
            content_css: 'https://cdn.tiny.cloud/1/9eomuls0jgbqziqkahugmesowt48tellxulfspshp9pa03bi/tinymce/6.8.3-131/skins/content/default/content.min.css',

            // Plugins
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],

            // Toolbar
            toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjust | bullist numlist outdent indent | ' +
                'removeformat | image media link | code | fullscreen | help',

            // Configuración de bloques
            block_formats: 'Párrafo=p; Título 1=h1; Título 2=h2; Título 3=h3; Título 4=h4; Título 5=h5; Título 6=h6',

            // Formatos de contenido
            content_style: `
                body {
                    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                }
                img {
                    max-width: 100%;
                    height: auto;
                }
            `,

            // Configuración de imágenes
            images_upload_handler: (blobInfo, progress) => this.handleImageUpload(blobInfo, progress),
            automatic_uploads: true,
            file_picker_types: 'image',
            image_advtab: true,
            image_caption: true,
            image_title: true,

            // Configuración de enlaces
            link_title: false,
            link_default_target: '_blank',
            link_assume_external_targets: true,
            link_target_list: [
                { title: 'Misma ventana', value: '' },
                { title: 'Nueva ventana', value: '_blank' }
            ],

            // Configuración de tabla
            table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
            table_default_styles: {
                width: '100%'
            },
            table_class_list: [
                { title: 'Tabla simple', value: 'table' },
                { title: 'Tabla rayada', value: 'table table-striped' },
                { title: 'Tabla bordeada', value: 'table table-bordered' },
                { title: 'Tabla hover', value: 'table table-hover' }
            ],

            // Configuración de limpieza HTML
            paste_data_images: true,
            paste_as_text: false,
            paste_preprocess: (plugin, args) => {
                console.log('📋 [TINYMCE] Pegando contenido:', args.content.substring(0, 100) + '...');
            },

            // Otros
            branding: false,
            promotion: false,
            statusbar: true,
            resize: true,
            contextmenu: 'link image table',
            convert_urls: false,

            // 🔐 FIX CRÍTICO: Callback cuando el editor está listo
            setup: (editor) => {
                editor.on('init', () => {
                    console.log(`✅ [TINYMCE] Editor inicializado: #${editor.id}`);

                    // VERIFICAR Y FORZAR MODO EDITABLE
                    if (editor.mode && editor.mode.get() === 'readonly') {
                        console.warn(`⚠️ [TINYMCE] Editor #${editor.id} está en readonly. Forzando design mode...`);
                        editor.mode.set('design');
                    }
                });

                editor.on('change', () => {
                    console.log(`📝 [TINYMCE] Contenido modificado en: #${editor.id}`);
                });

                editor.on('focus', () => {
                    console.log(`👁️ [TINYMCE] Editor #${editor.id} tiene foco`);
                });
            },

            // 🔐 FIX CRÍTICO: Callback de inicialización completa
            init_instance_callback: (editor) => {
                console.log(`🎉 [TINYMCE] Editor #${editor.id} completamente inicializado`);

                // FORZAR MODO EDITABLE EXPLÍCITAMENTE
                if (editor.mode) {
                    editor.mode.set('design');
                }
                if (editor.setMode) {
                    editor.setMode('design');
                }

                // Verificar estado final
                const mode = editor.mode ? editor.mode.get() : 'unknown';
                console.log(`📝 [TINYMCE] Modo final del editor #${editor.id}: ${mode}`);

                if (mode === 'readonly') {
                    console.error(`❌ [TINYMCE] ADVERTENCIA: Editor #${editor.id} sigue en readonly a pesar de los intentos de cambio.`);
                }
            }
        };
    }

    /**
     * Inicializar TinyMCE en un textarea específico
     */
    async init(selector, customConfig = {}) {
        try {
            // Verificar que TinyMCE esté cargado
            if (typeof tinymce === 'undefined') {
                console.error('❌ [TINYMCE] TinyMCE no está cargado');
                return null;
            }

            const config = {
                ...this.defaultConfig,
                ...customConfig,
                selector: selector
            };

            const editors = await tinymce.init(config);

            if (editors && editors.length > 0) {
                const editor = editors[0];
                this.editors[selector] = editor;
                console.log(`✅ [TINYMCE] Editor inicializado: ${selector}`);
                return editor;
            }

            return null;
        } catch (error) {
            console.error('❌ [TINYMCE] Error al inicializar TinyMCE:', error);
            return null;
        }
    }

    /**
     * Inicializar en múltiples campos
     */
    async initMultiple(selectors, customConfig = {}) {
        const promises = selectors.map(selector => this.init(selector, customConfig));
        return await Promise.all(promises);
    }

    /**
     * Obtener contenido del editor
     */
    getContent(selector) {
        const editor = this.editors[selector];
        if (editor) {
            return editor.getContent();
        }
        return null;
    }

    /**
     * Establecer contenido del editor
     */
    setContent(selector, content) {
        const editor = this.editors[selector];
        if (editor) {
            editor.setContent(content);
        }
    }

    /**
     * Limpiar contenido del editor
     */
    clearContent(selector) {
        this.setContent(selector, '');
    }

    /**
     * Remover editor
     */
    remove(selector) {
        const editor = this.editors[selector];
        if (editor) {
            editor.remove();
            delete this.editors[selector];
            console.log(`🗑️ [TINYMCE] Editor removido: ${selector}`);
        }
    }

    /**
     * Remover todos los editores
     */
    removeAll() {
        Object.keys(this.editors).forEach(selector => {
            this.remove(selector);
        });
        if (typeof tinymce !== 'undefined') {
            tinymce.remove();
        }
        console.log('🗑️ [TINYMCE] Todos los editores removidos');
    }

    /**
     * Manejar subida de imágenes
     */
    async handleImageUpload(blobInfo, progress) {
        try {
            const formData = new FormData();
            formData.append('file', blobInfo.blob(), blobInfo.filename());
            formData.append('type', 'tinymce-image');

            const response = await fetch(this.uploadEndpoint, {
                method: 'POST',
                body: formData,
                // No establecer Content-Type, FormData lo hace automáticamente
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            const result = await response.json();

            if (result.success && result.url) {
                console.log('✅ [TINYMCE] Imagen subida:', result.url);
                return result.url;
            } else {
                throw new Error(result.error || 'Error desconocido al subir imagen');
            }
        } catch (error) {
            console.error('❌ [TINYMCE] Error al subir imagen:', error);
            throw error;
        }
    }

    /**
     * Configuraciones predefinidas para diferentes usos
     */
    getConfigFor(type) {
        const configs = {
            'noticia': {
                height: 500,
                toolbar_mode: 'sliding',
                placeholder: 'Escribe el contenido de la noticia aquí...',
                readonly: false,
                disabled: false
            },
            'comunicado': {
                height: 400,
                menubar: 'file edit view insert format tools',
                placeholder: 'Escribe el comunicado aquí...',
                readonly: false,
                disabled: false
            },
            'simple': {
                height: 300,
                menubar: false,
                toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat',
                plugins: ['autolink', 'lists', 'link'],
                placeholder: 'Escribe aquí...',
                readonly: false,
                disabled: false
            },
            'minimal': {
                height: 200,
                menubar: false,
                toolbar: 'bold italic underline | removeformat',
                plugins: [],
                placeholder: 'Texto breve...',
                readonly: false,
                disabled: false
            }
        };

        return configs[type] || {};
    }
}

// Instancia global
const tinymceManager = new TinyMCEManager();

// 🔐 AUTO-INICIALIZACIÓN MEJORADA con verificación de carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔧 [TINYMCE] Esperando carga de TinyMCE desde CDN...');

        let retries = 0;
        const maxRetries = 20; // 20 intentos = 10 segundos
        const retryInterval = 500; // 500ms

        // Esperar a que TinyMCE se cargue
        const checkTinyMCE = setInterval(() => {
            retries++;

            if (typeof tinymce !== 'undefined') {
                clearInterval(checkTinyMCE);
                console.log('✅ [TINYMCE] TinyMCE cargado exitosamente desde CDN');

                // Inicializar editores automáticamente
                const autoInitSelectors = document.querySelectorAll('.tinymce-auto');
                if (autoInitSelectors.length > 0) {
                    console.log(`🎨 [TINYMCE] Auto-inicializando ${autoInitSelectors.length} editores...`);
                    autoInitSelectors.forEach(el => {
                        const selector = `#${el.id}`;
                        const type = el.dataset.tinymceType || 'noticia';
                        tinymceManager.init(selector, tinymceManager.getConfigFor(type));
                    });
                } else {
                    console.warn('⚠️ [TINYMCE] No se encontraron elementos con clase .tinymce-auto');
                }
            } else if (retries >= maxRetries) {
                clearInterval(checkTinyMCE);
                console.error('❌ [TINYMCE] TinyMCE no se cargó después de 10 segundos. Verifica la API key y la conexión a CDN.');
            } else {
                console.log(`⏳ [TINYMCE] Esperando TinyMCE... (intento ${retries}/${maxRetries})`);
            }
        }, retryInterval);
    });
} else {
    // Si ya está cargado el DOM, ejecutar inmediatamente
    console.log('🔧 [TINYMCE] DOM ya cargado, verificando TinyMCE...');
    if (typeof tinymce !== 'undefined') {
        const autoInitSelectors = document.querySelectorAll('.tinymce-auto');
        if (autoInitSelectors.length > 0) {
            console.log(`🎨 [TINYMCE] Auto-inicializando ${autoInitSelectors.length} editores...`);
            autoInitSelectors.forEach(el => {
                const selector = `#${el.id}`;
                const type = el.dataset.tinymceType || 'noticia';
                tinymceManager.init(selector, tinymceManager.getConfigFor(type));
            });
        }
    } else {
        console.warn('⚠️ [TINYMCE] TinyMCE aún no está disponible. Asegúrate de cargar el CDN antes de este script.');
    }
}

// Exponer globalmente para uso manual
window.tinymceManager = tinymceManager;
