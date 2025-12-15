/**
 * GET /api/config/public-keys
 * Retorna las claves públicas para servicios externos (TinyMCE, Google OAuth, etc)
 */

module.exports = function handler(req, res) {
    try {
        // Solo GET permitido
        if (req.method !== 'GET') {
            return res.status(405).json({
                success: false,
                error: 'Método no permitido'
            });
        }

        console.log('[PUBLIC-KEYS] Request recibida');

        const isDevelopment = process.env.NODE_ENV === 'development';

        // Safe key retrieval - solo log que existen, no los valores
        const tinymceKeyExists = !!process.env.TINYMCE_API_KEY;
        const googleOAuthIdExists = isDevelopment
            ? !!process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
            : !!process.env.GOOGLE_OAUTH_CLIENT_ID_PROD;

        console.log('[PUBLIC-KEYS] Keys status - NODE_ENV:', process.env.NODE_ENV, {
            tinymce: tinymceKeyExists ? 'EXISTS' : 'MISSING',
            googleOAuth: googleOAuthIdExists ? 'EXISTS' : 'MISSING'
        });

        const response = {
            success: true,
            environment: isDevelopment ? 'development' : 'production',
            keys: {
                tinymce: process.env.TINYMCE_API_KEY || null,
                google_oauth_client_id: isDevelopment
                    ? (process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || '')
                    : (process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '')
            }
        };

        console.log('[PUBLIC-KEYS] Retornando response satisfactoriamente');
        return res.status(200).json(response);
    } catch (error) {
        console.error('[PUBLIC-KEYS] Error:', error.message);
        console.error('[PUBLIC-KEYS] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener keys',
            message: error.message
        });
    }
};
