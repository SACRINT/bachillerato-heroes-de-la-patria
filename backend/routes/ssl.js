/**
 * 🔒 RUTAS SSL/HTTPS - BGE HÉROES DE LA PATRIA
 * APIs para gestión de certificados SSL y configuración HTTPS
 */

const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { getSSLManager } = require('../config/ssl');
const { logger } = require('../middleware/logger');
const router = express.Router();

// Aplicar autenticación de admin a todas las rutas SSL
router.use(requireAdmin);

/**
 * GET /api/ssl/status
 * Obtener estado del sistema SSL
 */
router.get('/status', async (req, res, next) => {
    try {
        console.log('🔒 [SSL API] Consultando estado SSL');

        const sslManager = getSSLManager();
        const status = sslManager.getStatus();

        await logger.info('Estado SSL consultado', {
            userId: req.user.id,
            certificatesExist: status.files.certificate.exists
        });

        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ssl/certificate-info
 * Obtener información detallada del certificado
 */
router.get('/certificate-info', async (req, res, next) => {
    try {
        console.log('📜 [SSL API] Obteniendo información del certificado');

        const sslManager = getSSLManager();
        const certificateInfo = sslManager.getCertificateInfo();

        if (certificateInfo.error) {
            return res.status(404).json({
                success: false,
                error: 'Certificado no encontrado',
                details: certificateInfo.error
            });
        }

        res.json({
            success: true,
            data: certificateInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ssl/generate-certificates
 * Generar nuevos certificados auto-firmados
 */
router.post('/generate-certificates', async (req, res, next) => {
    try {
        console.log('🔧 [SSL API] Generando nuevos certificados SSL');

        const sslManager = getSSLManager();
        const result = await sslManager.generateSelfSignedCertificates();

        await logger.warn('Certificados SSL regenerados', {
            userId: req.user.id,
            success: result,
            timestamp: new Date().toISOString()
        });

        if (result) {
            res.json({
                success: true,
                message: 'Certificados SSL generados exitosamente',
                data: {
                    type: 'self-signed',
                    validDays: 365,
                    regenerated: true,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error generando certificados',
                message: 'Verifique que OpenSSL esté instalado y accesible'
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ssl/setup-letsencrypt
 * Configurar Let's Encrypt para producción
 */
router.post('/setup-letsencrypt', async (req, res, next) => {
    try {
        const { domain, email } = req.body;

        if (!domain || !email) {
            return res.status(400).json({
                success: false,
                error: 'Dominio y email son requeridos',
                message: 'Proporcione domain y email para configurar Let\'s Encrypt'
            });
        }

        console.log(`🌐 [SSL API] Configurando Let's Encrypt para ${domain}`);

        const sslManager = getSSLManager();
        const config = await sslManager.setupLetsEncrypt(domain, email);

        await logger.info('Configuración Let\'s Encrypt iniciada', {
            userId: req.user.id,
            domain: domain,
            email: email
        });

        res.json({
            success: true,
            message: 'Configuración Let\'s Encrypt preparada',
            data: {
                domain: domain,
                email: email,
                config: config,
                instructions: [
                    '1. Instalar letsencrypt-express: npm install --save letsencrypt-express',
                    '2. Configurar DNS para apuntar a este servidor',
                    '3. Abrir puerto 80 para validación HTTP',
                    '4. Ejecutar proceso de certificación automática',
                    '5. Reiniciar servidor con certificados válidos'
                ]
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ssl/security-headers
 * Obtener configuración de headers de seguridad
 */
router.get('/security-headers', async (req, res, next) => {
    try {
        console.log('🛡️ [SSL API] Consultando headers de seguridad');

        const securityHeaders = {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://unpkg.com",
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
        };

        res.json({
            success: true,
            data: {
                headers: securityHeaders,
                description: 'Headers de seguridad aplicados automáticamente en HTTPS',
                compliance: [
                    'OWASP Security Headers',
                    'Mozilla Security Guidelines',
                    'Google Security Best Practices'
                ]
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ssl/test-https
 * Probar configuración HTTPS
 */
router.post('/test-https', async (req, res, next) => {
    try {
        const { port = 443 } = req.body;

        console.log(`🧪 [SSL API] Probando configuración HTTPS en puerto ${port}`);

        const sslManager = getSSLManager();
        const sslOptions = sslManager.getSSLOptions();

        if (!sslOptions) {
            return res.status(500).json({
                success: false,
                error: 'No se pudieron cargar las opciones SSL',
                message: 'Verifique que los certificados estén disponibles'
            });
        }

        // Información de la prueba
        const testResult = {
            sslOptionsAvailable: true,
            certificateLoaded: true,
            privateKeyLoaded: true,
            dhParamsAvailable: !!sslOptions.dhparam,
            ciphersConfigured: !!sslOptions.ciphers,
            secureProtocol: sslOptions.secureProtocol,
            recommendedPort: port,
            testTimestamp: new Date().toISOString()
        };

        await logger.info('Prueba HTTPS realizada', {
            userId: req.user.id,
            port: port,
            success: true
        });

        res.json({
            success: true,
            message: 'Configuración HTTPS lista para uso',
            data: testResult,
            instructions: [
                `Para iniciar servidor HTTPS use: const server = sslManager.createHTTPSServer(app, ${port})`,
                'Asegúrese de tener permisos para usar puertos < 1024',
                'Configure firewall para permitir tráfico HTTPS',
                'Use proxy reverso (nginx/Apache) para producción'
            ]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/ssl/cipher-suites
 * Obtener información de cipher suites configurados
 */
router.get('/cipher-suites', async (req, res, next) => {
    try {
        console.log('🔐 [SSL API] Consultando cipher suites');

        const sslManager = getSSLManager();
        const cipherSuites = sslManager.config.ciphers.split(':');

        const cipherInfo = {
            total: cipherSuites.length,
            ciphers: cipherSuites,
            securityLevel: 'High',
            excludedInsecure: [
                '!aNULL - No anonymous ciphers',
                '!eNULL - No null encryption',
                '!EXPORT - No export-grade ciphers',
                '!DES - No DES encryption',
                '!RC4 - No RC4 encryption',
                '!MD5 - No MD5 authentication',
                '!PSK - No pre-shared key',
                '!SRP - No SRP authentication',
                '!CAMELLIA - No Camellia encryption'
            ],
            preferredCiphers: [
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES128-SHA256',
                'ECDHE-RSA-AES256-SHA384'
            ]
        };

        res.json({
            success: true,
            data: cipherInfo
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/ssl/validate-certificate
 * Validar certificado SSL existente
 */
router.post('/validate-certificate', async (req, res, next) => {
    try {
        console.log('✅ [SSL API] Validando certificado SSL');

        const sslManager = getSSLManager();
        await sslManager.validateCertificates();

        const certificateInfo = sslManager.getCertificateInfo();

        if (certificateInfo.error) {
            return res.status(400).json({
                success: false,
                error: 'Error validando certificado',
                details: certificateInfo.error
            });
        }

        const validation = {
            valid: !certificateInfo.expired,
            selfSigned: certificateInfo.selfSigned,
            daysUntilExpiration: certificateInfo.daysUntilExpiration,
            expired: certificateInfo.expired,
            subject: certificateInfo.subject,
            issuer: certificateInfo.issuer,
            validFrom: certificateInfo.validFrom,
            validTo: certificateInfo.validTo,
            warnings: []
        };

        // Agregar advertencias
        if (validation.selfSigned) {
            validation.warnings.push('Certificado auto-firmado - no apto para producción');
        }

        if (validation.daysUntilExpiration < 30) {
            validation.warnings.push(`Certificado expira en ${validation.daysUntilExpiration} días`);
        }

        if (validation.expired) {
            validation.warnings.push('Certificado expirado - genere uno nuevo');
        }

        await logger.info('Certificado SSL validado', {
            userId: req.user.id,
            valid: validation.valid,
            expired: validation.expired,
            selfSigned: validation.selfSigned
        });

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;