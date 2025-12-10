export class SSLManager {
    certDir: string;
    config: {
        keyFile: string;
        certFile: string;
        caFile: string;
        dhParamFile: string;
        minVersion: string;
        maxVersion: string;
        ciphers: string;
        honorCipherOrder: boolean;
        requestCert: boolean;
        rejectUnauthorized: boolean;
    };
    /**
     * Inicializar SSL Manager
     */
    init(): Promise<void>;
    /**
     * Asegurar que existe el directorio de certificados
     */
    ensureCertDirectory(): Promise<void>;
    /**
     * Verificar existencia y validez de certificados
     */
    checkCertificates(): Promise<void>;
    /**
     * Generar certificados auto-firmados para desarrollo
     */
    generateSelfSignedCertificates(): Promise<boolean>;
    /**
     * Crear configuración OpenSSL
     */
    createOpenSSLConfig(certConfig: any): string;
    /**
     * Validar certificados existentes
     */
    validateCertificates(): Promise<void>;
    /**
     * Obtener opciones SSL para servidor HTTPS
     */
    getSSLOptions(): {
        key: NonSharedBuffer;
        cert: NonSharedBuffer;
        secureProtocol: string;
        secureOptions: number;
        ciphers: string;
        honorCipherOrder: boolean;
        requestCert: boolean;
        rejectUnauthorized: boolean;
    };
    /**
     * Crear servidor HTTPS
     */
    createHTTPSServer(app: any, port?: number): https.Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    /**
     * Middleware para redirección HTTP a HTTPS
     */
    httpsRedirectMiddleware(req: any, res: any, next: any): void;
    /**
     * Middleware para headers de seguridad SSL
     */
    securityHeadersMiddleware(req: any, res: any, next: any): void;
    /**
     * Configurar Let's Encrypt para producción
     */
    setupLetsEncrypt(domain: any, email: any): Promise<{
        domains: any[];
        email: any;
        agreeTos: boolean;
        acmeDirectory: string;
        accountKeysDir: string;
        domainKeysDir: string;
        certificatesDir: string;
        challengeType: string;
    }>;
    /**
     * Información de certificados
     */
    getCertificateInfo(): {
        subject: string;
        issuer: string;
        validFrom: string;
        validTo: string;
        serialNumber: string;
        selfSigned: boolean;
    } | {
        error: any;
    };
    /**
     * Estado del SSL Manager
     */
    getStatus(): {
        certificateDirectory: string;
        files: {
            privateKey: {
                path: string;
                exists: boolean;
                size: number;
            };
            certificate: {
                path: string;
                exists: boolean;
                size: number;
            };
            dhParams: {
                path: string;
                exists: boolean;
                size: number;
            };
        };
        certificateInfo: {
            subject: string;
            issuer: string;
            validFrom: string;
            validTo: string;
            serialNumber: string;
            selfSigned: boolean;
        } | {
            error: any;
        };
        config: {
            minVersion: string;
            maxVersion: string;
            ciphersCount: number;
        };
    };
}
/**
 * Obtener instancia del SSL Manager
 */
export function getSSLManager(): any;
import https = require("https");
//# sourceMappingURL=ssl.d.ts.map