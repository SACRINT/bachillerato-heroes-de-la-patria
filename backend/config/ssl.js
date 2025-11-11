/**
 * 🔒 CONFIGURACIÓN SSL/HTTPS - BGE HÉROES DE LA PATRIA
 * Sistema completo de certificados SSL y configuración HTTPS para producción
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class SSLManager {
    constructor() {
        this.certDir = path.join(__dirname, '../certs');
        this.config = {
            // Configuración por defecto
            keyFile: 'server.key',
            certFile: 'server.crt',
            caFile: 'ca.crt',
            dhParamFile: 'dhparam.pem',

            // Configuración SSL/TLS
            minVersion: 'TLSv1.2',
            maxVersion: 'TLSv1.3',
            ciphers: [
                'ECDHE-RSA-AES128-GCM-SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES128-SHA256',
                'ECDHE-RSA-AES256-SHA384',
                'ECDHE-RSA-AES256-SHA256',
                'DHE-RSA-AES128-GCM-SHA256',
                'DHE-RSA-AES256-GCM-SHA384',
                'DHE-RSA-AES128-SHA256',
                'DHE-RSA-AES256-SHA256',
                '!aNULL',
                '!eNULL',
                '!EXPORT',
                '!DES',
                '!RC4',
                '!MD5',
                '!PSK',
                '!SRP',
                '!CAMELLIA'
            ].join(':'),

            honorCipherOrder: true,
            requestCert: false,
            rejectUnauthorized: false
        };

        devLogger.log('🔒 [SSL] SSL Manager inicializado');
        this.init();
    }

    /**
     * Inicializar SSL Manager
     */
    async init() {
        try {
            await this.ensureCertDirectory();
            await this.checkCertificates();
            devLogger.log('✅ [SSL] SSL Manager configurado correctamente');
        } catch (error) {
            devLogger.error('❌ [SSL] Error inicializando SSL Manager:', error.message);
        }
    }

    /**
     * Asegurar que existe el directorio de certificados
     */
    async ensureCertDirectory() {
        if (!fs.existsSync(this.certDir)) {
            fs.mkdirSync(this.certDir, { recursive: true });
            devLogger.log(`📁 [SSL] Directorio de certificados creado: ${this.certDir}`);
        }
    }

    /**
     * Verificar existencia y validez de certificados
     */
    async checkCertificates() {
        const keyPath = path.join(this.certDir, this.config.keyFile);
        const certPath = path.join(this.certDir, this.config.certFile);

        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            devLogger.log('⚠️ [SSL] Certificados SSL no encontrados');
            devLogger.log('🔧 [SSL] Generando certificados auto-firmados para desarrollo...');
            await this.generateSelfSignedCertificates();
        } else {
            devLogger.log('✅ [SSL] Certificados SSL encontrados');
            await this.validateCertificates();
        }
    }

    /**
     * Generar certificados auto-firmados para desarrollo
     */
    async generateSelfSignedCertificates() {
        try {
            const keyPath = path.join(this.certDir, this.config.keyFile);
            const certPath = path.join(this.certDir, this.config.certFile);
            const csrPath = path.join(this.certDir, 'server.csr');

            // Configuración para el certificado
            const certConfig = {
                country: 'MX',
                state: 'Estado',
                city: 'Ciudad',
                organization: 'Bachillerato General Estatal Heroes de la Patria',
                organizationalUnit: 'IT Department',
                commonName: 'localhost',
                email: 'admin@heroespatria.edu.mx'
            };

            // Crear archivo de configuración OpenSSL
            const opensslConfig = this.createOpenSSLConfig(certConfig);
            const configPath = path.join(this.certDir, 'openssl.conf');
            fs.writeFileSync(configPath, opensslConfig);

            devLogger.log('🔑 [SSL] Generando clave privada...');

            // Generar clave privada
            execSync(`openssl genrsa -out "${keyPath}" 2048`, {
                cwd: this.certDir,
                stdio: 'inherit'
            });

            devLogger.log('📝 [SSL] Generando solicitud de certificado...');

            // Generar CSR
            execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -config "${configPath}"`, {
                cwd: this.certDir,
                stdio: 'inherit'
            });

            devLogger.log('📜 [SSL] Generando certificado auto-firmado...');

            // Generar certificado auto-firmado válido por 365 días
            execSync(`openssl x509 -req -days 365 -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}" -extensions v3_req -extfile "${configPath}"`, {
                cwd: this.certDir,
                stdio: 'inherit'
            });

            // Generar parámetros DH para mayor seguridad
            devLogger.log('🔐 [SSL] Generando parámetros Diffie-Hellman...');
            const dhParamPath = path.join(this.certDir, this.config.dhParamFile);
            execSync(`openssl dhparam -out "${dhParamPath}" 2048`, {
                cwd: this.certDir,
                stdio: 'inherit'
            });

            // Limpiar archivos temporales
            fs.unlinkSync(csrPath);
            fs.unlinkSync(configPath);

            devLogger.log('✅ [SSL] Certificados auto-firmados generados exitosamente');
            devLogger.log(`🔑 Clave privada: ${keyPath}`);
            devLogger.log(`📜 Certificado: ${certPath}`);
            devLogger.log(`🔐 DH Params: ${dhParamPath}`);

            return true;
        } catch (error) {
            devLogger.error('❌ [SSL] Error generando certificados:', error.message);
            devLogger.log('💡 [SSL] Para generar certificados manualmente:');
            devLogger.log('   1. Instalar OpenSSL');
            devLogger.log('   2. Ejecutar: npm run generate-certs');
            devLogger.log('   3. O usar certificados de Let\'s Encrypt para producción');
            return false;
        }
    }

    /**
     * Crear configuración OpenSSL
     */
    createOpenSSLConfig(certConfig) {
        return `
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = v3_req
distinguished_name = dn

[dn]
C=${certConfig.country}
ST=${certConfig.state}
L=${certConfig.city}
O=${certConfig.organization}
OU=${certConfig.organizationalUnit}
CN=${certConfig.commonName}
emailAddress=${certConfig.email}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = heroespatria.edu.mx
DNS.4 = *.heroespatria.edu.mx
IP.1 = 127.0.0.1
IP.2 = ::1
`;
    }

    /**
     * Validar certificados existentes
     */
    async validateCertificates() {
        try {
            const certPath = path.join(this.certDir, this.config.certFile);

            // Verificar fechas de expiración
            const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, {
                encoding: 'utf8'
            });

            const expirationMatch = certInfo.match(/Not After : (.+)/);
            if (expirationMatch) {
                const expirationDate = new Date(expirationMatch[1]);
                const daysUntilExpiration = Math.floor((expirationDate - new Date()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiration < 0) {
                    devLogger.log('⚠️ [SSL] Certificado SSL expirado');
                    devLogger.log('🔧 [SSL] Regenerando certificados...');
                    await this.generateSelfSignedCertificates();
                } else if (daysUntilExpiration < 30) {
                    devLogger.log(`⚠️ [SSL] Certificado SSL expira en ${daysUntilExpiration} días`);
                } else {
                    devLogger.log(`✅ [SSL] Certificado SSL válido por ${daysUntilExpiration} días más`);
                }
            }
        } catch (error) {
            devLogger.warn('⚠️ [SSL] No se pudo validar el certificado:', error.message);
        }
    }

    /**
     * Obtener opciones SSL para servidor HTTPS
     */
    getSSLOptions() {
        try {
            const keyPath = path.join(this.certDir, this.config.keyFile);
            const certPath = path.join(this.certDir, this.config.certFile);
            const dhParamPath = path.join(this.certDir, this.config.dhParamFile);

            const options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
                secureProtocol: 'TLS_method',
                secureOptions: require('constants').SSL_OP_NO_SSLv2 |
                              require('constants').SSL_OP_NO_SSLv3 |
                              require('constants').SSL_OP_NO_TLSv1 |
                              require('constants').SSL_OP_NO_TLSv1_1,
                ciphers: this.config.ciphers,
                honorCipherOrder: this.config.honorCipherOrder,
                requestCert: this.config.requestCert,
                rejectUnauthorized: this.config.rejectUnauthorized
            };

            // Agregar DH parameters si existen
            if (fs.existsSync(dhParamPath)) {
                options.dhparam = fs.readFileSync(dhParamPath);
            }

            return options;
        } catch (error) {
            devLogger.error('❌ [SSL] Error cargando opciones SSL:', error.message);
            return null;
        }
    }

    /**
     * Crear servidor HTTPS
     */
    createHTTPSServer(app, port = 443) {
        try {
            const sslOptions = this.getSSLOptions();

            if (!sslOptions) {
                throw new Error('No se pudieron cargar las opciones SSL');
            }

            const server = https.createServer(sslOptions, app);

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    devLogger.log(`⚠️ [SSL] Puerto ${port} en uso, intentando puerto alternativo...`);
                    server.listen(port + 1);
                } else {
                    devLogger.error('❌ [SSL] Error en servidor HTTPS:', error);
                }
            });

            server.on('listening', () => {
                const address = server.address();
                devLogger.log(`🔒 [SSL] Servidor HTTPS iniciado en puerto ${address.port}`);
                devLogger.log(`🌐 [SSL] URL: https://localhost:${address.port}`);
            });

            return server;
        } catch (error) {
            devLogger.error('❌ [SSL] Error creando servidor HTTPS:', error.message);
            return null;
        }
    }

    /**
     * Middleware para redirección HTTP a HTTPS
     */
    httpsRedirectMiddleware(req, res, next) {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    }

    /**
     * Middleware para headers de seguridad SSL
     */
    securityHeadersMiddleware(req, res, next) {
        // Strict Transport Security
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // Content Security Policy
        res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' https://cdnjs.cloudflare.com; " +
            "connect-src 'self'"
        );

        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');

        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        res.setHeader('Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        next();
    }

    /**
     * Configurar Let's Encrypt para producción
     */
    async setupLetsEncrypt(domain, email) {
        devLogger.log('🔒 [SSL] Configurando Let\'s Encrypt para producción...');

        const letsEncryptConfig = {
            domains: [domain],
            email: email,
            agreeTos: true,
            acmeDirectory: 'https://acme-v02.api.letsencrypt.org/directory',
            accountKeysDir: path.join(this.certDir, 'accounts'),
            domainKeysDir: path.join(this.certDir, 'keys'),
            certificatesDir: path.join(this.certDir, 'certificates'),
            challengeType: 'http-01'
        };

        devLogger.log('💡 [SSL] Para configurar Let\'s Encrypt:');
        devLogger.log('   1. npm install --save letsencrypt-express');
        devLogger.log('   2. Configurar dominio en DNS');
        devLogger.log('   3. Abrir puerto 80 para validación');
        devLogger.log('   4. Ejecutar certificación automática');

        return letsEncryptConfig;
    }

    /**
     * Información de certificados
     */
    getCertificateInfo() {
        try {
            const certPath = path.join(this.certDir, this.config.certFile);

            if (!fs.existsSync(certPath)) {
                return { error: 'Certificado no encontrado' };
            }

            const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, {
                encoding: 'utf8'
            });

            // Extraer información relevante
            const subjectMatch = certInfo.match(/Subject: (.+)/);
            const issuerMatch = certInfo.match(/Issuer: (.+)/);
            const notBeforeMatch = certInfo.match(/Not Before: (.+)/);
            const notAfterMatch = certInfo.match(/Not After : (.+)/);
            const serialMatch = certInfo.match(/Serial Number:\s*(.+)/);

            const info = {
                subject: subjectMatch ? subjectMatch[1].trim() : 'N/A',
                issuer: issuerMatch ? issuerMatch[1].trim() : 'N/A',
                validFrom: notBeforeMatch ? notBeforeMatch[1].trim() : 'N/A',
                validTo: notAfterMatch ? notAfterMatch[1].trim() : 'N/A',
                serialNumber: serialMatch ? serialMatch[1].trim() : 'N/A',
                selfSigned: false
            };

            // Verificar si es auto-firmado
            info.selfSigned = info.subject === info.issuer;

            // Calcular días hasta expiración
            if (info.validTo !== 'N/A') {
                const expirationDate = new Date(info.validTo);
                const daysUntilExpiration = Math.floor((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
                info.daysUntilExpiration = daysUntilExpiration;
                info.expired = daysUntilExpiration < 0;
            }

            return info;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Estado del SSL Manager
     */
    getStatus() {
        const keyPath = path.join(this.certDir, this.config.keyFile);
        const certPath = path.join(this.certDir, this.config.certFile);
        const dhParamPath = path.join(this.certDir, this.config.dhParamFile);

        return {
            certificateDirectory: this.certDir,
            files: {
                privateKey: {
                    path: keyPath,
                    exists: fs.existsSync(keyPath),
                    size: fs.existsSync(keyPath) ? fs.statSync(keyPath).size : 0
                },
                certificate: {
                    path: certPath,
                    exists: fs.existsSync(certPath),
                    size: fs.existsSync(certPath) ? fs.statSync(certPath).size : 0
                },
                dhParams: {
                    path: dhParamPath,
                    exists: fs.existsSync(dhParamPath),
                    size: fs.existsSync(dhParamPath) ? fs.statSync(dhParamPath).size : 0
                }
            },
            certificateInfo: this.getCertificateInfo(),
            config: {
                minVersion: this.config.minVersion,
                maxVersion: this.config.maxVersion,
                ciphersCount: this.config.ciphers.split(':').length
            }
        };
    }
}

// Instancia singleton
let sslManagerInstance = null;

/**
 * Obtener instancia del SSL Manager
 */
function getSSLManager() {
    if (!sslManagerInstance) {
        sslManagerInstance = new SSLManager();
    }
    return sslManagerInstance;
}

module.exports = {
    SSLManager,
    getSSLManager
};