/**
 * TINYMCE CONFIGURATION - Editor WYSIWYG para CMS
 * Configuración del editor de texto rico para Noticias y Comunicados
 * Fecha: 18 de Octubre, 2025
 */

class TinyMCEManager {
    constructor() {
        this.editors = {};
        this.uploadEndpoint = '/api/upload/image';
        this.defaultConfig = {
            // Configuración básica
            api_key: '9eomuls0jgbqziqkahugmesowt48tellxulfspshp9pa03bi',
            height: 400,
            menubar: true,
            language: 'es',

            // Plugins
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
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
                console.log('Pegando contenido:', args.content);
            },

            // Otros
            branding: false,
            promotion: false,
            statusbar: true,
            resize: true,
            contextmenu: 'link image table',

            // Callback cuando el editor está listo
            setup: (editor) => {
                editor.on('init', () => {
                    console.log(`✅ TinyMCE inicializado en: ${editor.id}`);
                });

                editor.on('change', () => {
                    console.log(`📝 Contenido modificado en: ${editor.id}`);
                });
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
                console.error('❌ TinyMCE no está cargado');
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
                console.log(`✅ Editor inicializado: ${selector}`);
                return editor;
            }

            return null;
        } catch (error) {
            console.error('❌ Error al inicializar TinyMCE:', error);
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
            console.log(`🗑️ Editor removido: ${selector}`);
        }
    }

    /**
     * Remover todos los editores
     */
    removeAll() {
        Object.keys(this.editors).forEach(selector => {
            this.remove(selector);
        });
        tinymce.remove();
        console.log('🗑️ Todos los editores removidos');
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
                console.log('✅ Imagen subida:', result.url);
                return result.url;
            } else {
                throw new Error(result.error || 'Error desconocido al subir imagen');
            }
        } catch (error) {
            console.error('❌ Error al subir imagen:', error);
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
                placeholder: 'Escribe el contenido de la noticia aquí...'
            },
            'comunicado': {
                height: 400,
                menubar: 'file edit view insert format tools',
                placeholder: 'Escribe el comunicado aquí...'
            },
            'simple': {
                height: 300,
                menubar: false,
                toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat',
                plugins: ['autolink', 'lists', 'link'],
                placeholder: 'Escribe aquí...'
            },
            'minimal': {
                height: 200,
                menubar: false,
                toolbar: 'bold italic underline | removeformat',
                plugins: [],
                placeholder: 'Texto breve...'
            }
        };

        return configs[type] || {};
    }
}

// Instancia global
const tinymceManager = new TinyMCEManager();

// Auto-inicializar en textareas con clase .tinymce
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar a que TinyMCE se cargue
        const checkTinyMCE = setInterval(() => {
            if (typeof tinymce !== 'undefined') {
                clearInterval(checkTinyMCE);

                // Inicializar editores automáticamente
                const autoInitSelectors = document.querySelectorAll('.tinymce-auto');
                if (autoInitSelectors.length > 0) {
                    console.log(`🎨 Auto-inicializando ${autoInitSelectors.length} editores TinyMCE...`);
                    autoInitSelectors.forEach(el => {
                        const selector = `#${el.id}`;
                        const type = el.dataset.tinymceType || 'noticia';
                        tinymceManager.init(selector, tinymceManager.getConfigFor(type));
                    });
                }
            }
        }, 100);

        // Timeout de 10 segundos
        setTimeout(() => clearInterval(checkTinyMCE), 10000);
    });
}
