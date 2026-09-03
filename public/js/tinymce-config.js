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

            // FIX: Si hay API key válida usar Tiny Cloud; de lo contrario usar CDNJS libre de restricciones readonly
            base_url: (window.TINYMCE_API_KEY && window.TINYMCE_API_KEY !== 'no-api-key')
                ? `https://cdn.tiny.cloud/1/${window.TINYMCE_API_KEY}/tinymce/6`
                : 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2',
            suffix: '.min',

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
                void 0;
            },

            // Otros
            branding: false,
            promotion: false,
            statusbar: true,
            resize: true,
            contextmenu: 'link image table',
            convert_urls: false,

            // FIX CRÍTICO: Callback cuando el editor está listo
            setup: (editor) => {
                editor.on('init', () => {
                    // Forzar modo editable al iniciar
                    try {
                        if (editor.mode && editor.mode.get() === 'readonly') {
                            editor.mode.set('design');
                        }
                        if (editor.setMode) editor.setMode('design');
                    } catch (e) {
                        // Ignorar - init_instance_callback también lo intenta
                    }
                });

                editor.on('change', () => {
                    void 0;
                });

                editor.on('focus', () => {
                    void 0;
                });
            },

            // FIX CRÍTICO: Callback de inicialización completa - forzar modo editable
            init_instance_callback: (editor) => {
                // SOLUCIÓN ROBUSTA: Forzar modo editable después de que TinyMCE carga todo
                try {
                    // Método 1: setMode (más confiable)
                    if (editor.setMode) editor.setMode('design');
                    // Método 2: mode.set
                    if (editor.mode && editor.mode.set) editor.mode.set('design');
                    // Método 3: Quitar readonly attribute del DOM
                    const iframe = editor.iframeElement;
                    if (iframe) iframe.removeAttribute('data-mce-readonly');
                    // Método 4: onInit event
                    editor.on('init', () => {
                        if (editor.setMode) editor.setMode('design');
                    });
                } catch (e) {
                    console.warn('[TINYMCE] No se pudo forzar design mode:', e.message);
                }

                let mode = editor.mode ? editor.mode.get() : 'unknown';
                if (mode === 'readonly') {
                    try {
                        if (editor.mode && typeof editor.mode.set === 'function') {
                            editor.mode.set('design');
                            mode = editor.mode.get();
                        }
                    } catch (e) {
                        // ignore
                    }
                    if (mode === 'readonly') {
                        console.warn(`[TINYMCE] Editor #${editor.id} en modo solo lectura`);
                    }
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

            // 🔍 DEBUG: Verificar base_url construido
            
            

            const editors = await tinymce.init(config);

            if (editors && editors.length > 0) {
                const editor = editors[0];
                this.editors[selector] = editor;
                
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
            void 0;
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
        void 0;
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
                void 0;
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
        let retries = 0;
        const maxRetries = 40;
        const retryInterval = 500;

        const checkTinyMCE = setInterval(() => {
            retries++;

            if (typeof tinymce !== 'undefined') {
                clearInterval(checkTinyMCE);
                const autoInitSelectors = document.querySelectorAll('.tinymce-auto');
                if (autoInitSelectors.length > 0) {
                    autoInitSelectors.forEach(el => {
                        const selector = `#${el.id}`;
                        const type = el.dataset.tinymceType || 'noticia';
                        tinymceManager.init(selector, tinymceManager.getConfigFor(type));
                    });
                }
            } else if (retries >= maxRetries) {
                clearInterval(checkTinyMCE);
            }
        }, retryInterval);
    });
} else {
    if (typeof tinymce !== 'undefined') {
        const autoInitSelectors = document.querySelectorAll('.tinymce-auto');
        if (autoInitSelectors.length > 0) {
            autoInitSelectors.forEach(el => {
                const selector = `#${el.id}`;
                const type = el.dataset.tinymceType || 'noticia';
                tinymceManager.init(selector, tinymceManager.getConfigFor(type));
            });
        }
    }
}

// Exponer globalmente para uso manual
window.tinymceManager = tinymceManager;
