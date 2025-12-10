export = deviceFingerprinting;
declare const deviceFingerprinting: DeviceFingerprinting;
declare class DeviceFingerprinting {
    userDevices: Map<any, any>;
    revokedDevices: Set<any>;
    config: {
        maxDevicesPerUser: number;
        trustNewDevice: boolean;
        alertOnNewDevice: boolean;
        fingerprintSimilarityThreshold: number;
        deviceExpirationDays: number;
        auditLogEnabled: boolean;
    };
    /**
     * MIDDLEWARE PRINCIPAL (opcional - solo para logging)
     */
    middleware(): (req: any, res: any, next: any) => Promise<void>;
    /**
     * REGISTRAR NUEVO DISPOSITIVO
     */
    registerDevice(userId: any, fingerprintData: any, metadata?: {}): Promise<{
        success: boolean;
        deviceId: any;
        isNew: boolean;
        trusted: any;
        requiresVerification?: undefined;
    } | {
        success: boolean;
        deviceId: string;
        isNew: boolean;
        trusted: boolean;
        requiresVerification: boolean;
    }>;
    /**
     * VALIDAR DISPOSITIVO
     */
    validateDevice(userId: any, fingerprintHash: any): Promise<{
        valid: boolean;
        trusted: boolean;
        isNew: boolean;
        reason: string;
        deviceId?: undefined;
        deviceName?: undefined;
    } | {
        valid: boolean;
        trusted: boolean;
        isNew: boolean;
        reason: string;
        deviceId: any;
        deviceName?: undefined;
    } | {
        valid: boolean;
        trusted: any;
        isNew: boolean;
        deviceId: any;
        deviceName: any;
        reason?: undefined;
    }>;
    /**
     * BUSCAR DISPOSITIVO SIMILAR
     */
    findSimilarDevice(userId: any, fingerprintHash: any, components: any): any;
    /**
     * CALCULAR SIMILITUD ENTRE DOS FINGERPRINTS
     */
    calculateSimilarity(components1: any, components2: any): number;
    /**
     * GENERAR NOMBRE DE DISPOSITIVO
     */
    generateDeviceName(components: any): "Dispositivo Desconocido" | "iPhone" | "iPad" | "Android Device" | "Mac" | "Windows PC" | "Linux Device";
    /**
     * OBTENER DISPOSITIVOS DE UN USUARIO
     */
    getUserDevices(userId: any): {
        deviceId: any;
        name: any;
        fingerprint: string;
        trusted: any;
        createdAt: string;
        lastSeen: string;
        loginCount: any;
        ip: any;
        userAgent: any;
    }[];
    /**
     * CONFIAR EN UN DISPOSITIVO
     */
    trustDevice(userId: any, deviceId: any): {
        success: boolean;
    };
    /**
     * REVOCAR DISPOSITIVO
     */
    revokeDevice(userId: any, deviceId: any): {
        success: boolean;
    };
    /**
     * ELIMINAR TODOS LOS DISPOSITIVOS DE UN USUARIO
     */
    revokeAllUserDevices(userId: any): number;
    /**
     * AUDIT LOGGING
     */
    auditLog(userId: any, eventType: any, details?: {}): void;
    /**
     * CLEANUP DE DISPOSITIVOS EXPIRADOS
     */
    cleanup(): void;
    /**
     * OBTENER ESTADÍSTICAS
     */
    getStats(): {
        totalUsers: number;
        totalDevices: number;
        revokedDevices: number;
        usersWithMultipleDevices: number;
        averageDevicesPerUser: number;
    };
}
//# sourceMappingURL=deviceFingerprinting.d.ts.map