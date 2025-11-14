/**
 * TINYMCE CONFIG - Inicialización Segura de Editores WYSIWYG
 * Espera a que TinyMCE se cargue desde CDN y luego inicializa los editores
 * CRÍTICO: Soluciona el problema "All editors configured to be read-only"
 */

(function initializeTinyMCE() {
    console.log('🔧 [TINYMCE-CONFIG] Esperando carga de TinyMCE desde CDN...');

    // Configuración de reintentos
    let retries = 0;
    const maxRetries = 20; // 20 intentos = 10 segundos
    const retryInterval = 500; // 500ms entre intentos

    /**
     * Verifica si TinyMCE está disponible y lo inicializa
     */
    function checkAndInitialize() {
        retries++;

        // Verificar si window.tinymce existe
        if (typeof window.tinymce !== 'undefined' && window.tinymce) {
            console.log('✅ [TINYMCE-CONFIG] TinyMCE cargado exitosamente desde CDN');
            initializeEditors();
        } else if (retries < maxRetries) {
            console.log(`⏳ [TINYMCE-CONFIG] Esperando TinyMCE... (intento ${retries}/${maxRetries})`);
            setTimeout(checkAndInitialize, retryInterval);
        } else {
            console.error('❌ [TINYMCE-CONFIG] TinyMCE no se cargó después de 10 segundos. Verifica la API key y la conexión a CDN.');
        }
    }

    /**
     * Inicializa los editores TinyMCE
     */
    function initializeEditors() {
        // Verificar si hay elementos para inicializar
        const editors = document.querySelectorAll('.tinymce-auto');
        if (editors.length === 0) {
            console.warn('⚠️ [TINYMCE-CONFIG] No se encontraron elementos con clase .tinymce-auto');
            return;
        }

        console.log(`🎨 [TINYMCE-CONFIG] Inicializando ${editors.length} editor(es)...`);

        // Configuración base de TinyMCE
        const config = {
            selector: '.tinymce-auto',

            // 🔐 CRÍTICO: Deshabilitar readonly explícitamente
            readonly: false,
            disabled: false,

            // 🎨 Apariencia
            height: 300,
            menubar: false,
            skin: 'oxide',
            content_css: 'default',

            // 🛠️ Toolbar
            toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | removeformat code',

            // 🔌 Plugins esenciales
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],

            // 📝 Configuración de contenido
            block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',

            // 🖼️ Configuración de imágenes
            image_advtab: true,
            image_caption: true,
            automatic_uploads: false,
            file_picker_types: 'image',

            // 🔗 Configuración de links
            link_default_target: '_blank',
            link_assume_external_targets: true,

            // 🌐 Idioma
            language: 'es',
            language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.10.9/langs6/es.min.js',

            // ⚙️ Configuración avanzada
            branding: false, // Oculta "Powered by TinyMCE"
            promotion: false, // Oculta promociones
            convert_urls: false, // No convierte URLs relativas a absolutas

            // 📊 Callbacks
            setup: function(editor) {
                editor.on('init', function() {
                    console.log(`✅ [TINYMCE-CONFIG] Editor inicializado: #${editor.id}`);

                    // Verificar que NO esté en readonly
                    if (editor.mode.get() === 'readonly') {
                        console.error(`❌ [TINYMCE-CONFIG] Editor #${editor.id} está en modo readonly. Cambiando a design mode...`);
                        editor.mode.set('design');
                    }
                });

                editor.on('focus', function() {
                    console.log(`👁️ [TINYMCE-CONFIG] Editor #${editor.id} tiene foco`);
                });
            },

            // 🔄 Callback de inicialización completa
            init_instance_callback: function(editor) {
                console.log(`🎉 [TINYMCE-CONFIG] Editor #${editor.id} completamente inicializado y listo`);

                // CRÍTICO: Forzar modo editable
                editor.mode.set('design');
                editor.setMode('design');

                // Verificar estado final
                const mode = editor.mode.get();
                console.log(`📝 [TINYMCE-CONFIG] Modo final del editor #${editor.id}: ${mode}`);
            }
        };

        // Inicializar TinyMCE
        try {
            window.tinymce.init(config);
            console.log('✅ [TINYMCE-CONFIG] Configuración de TinyMCE aplicada exitosamente');
        } catch (error) {
            console.error('❌ [TINYMCE-CONFIG] Error al inicializar TinyMCE:', error);
        }
    }

    // Iniciar verificación
    checkAndInitialize();
})();
