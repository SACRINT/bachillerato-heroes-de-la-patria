
/**
 * src/core/legacy-loader.ts
 * Carga de scripts legacy que aún no han sido migrados.
 * Reemplaza la carga dinámica de scripts de main.js legacy.
 */

export class LegacyLoader {
    // Listado de scripts que se cargaban como "bridges"
    private readonly BRIDGES = [
        'js/data-event-emitter.js',
        'js/auth-api-bridge.js', // TODO: Migrar a TS
        // 'js/auth-context-bridge.js', // Migrado a TS (auth.ts wrapper)
        // 'js/unified-auth-system-v2.js', // Migrado a TS (src/core/auth/*)
        // 'js/tenant-auto-updater.js' // Migrado a TS
    ];

    // Listado de scripts de eventos
    private readonly EVENT_HANDLERS = [
        'js/bolsa-trabajo-events.js',
        'js/calificaciones-events.js',
        'js/citas-events.js',
        'js/inscriptions-handler.js',
        'js/orphan-handlers.js'
    ];

    constructor() { }

    public init(): void {
        

        // 1. Cargar Logger primero (aunque idealmente deberíamos tener uno en TS)
        this.loadLogger();

        // 2. Cargar Bridges en paralelo/secuencial
        this.loadBridges();

        // 3. Cargar Event Handlers secuencialmente
        // Esto es importante porque event-handler-registry depende de ellos
        this.loadEventHandlersSequentially(0);
    }

    private loadLogger(): void {
        const script = document.createElement('script');
        script.src = 'js/logger-manager.js';
        script.async = false;
        document.head.appendChild(script);
    }

    private loadBridges(): void {
        this.BRIDGES.forEach(bridgePath => {
            const script = document.createElement('script');
            script.src = bridgePath;
            script.async = false;
            document.head.appendChild(script);
        });
        
    }

    private loadEventHandlersSequentially(index: number): void {
        if (index < this.EVENT_HANDLERS.length) {
            const script = document.createElement('script');
            script.src = this.EVENT_HANDLERS[index];
            script.onload = () => {
                
                this.loadEventHandlersSequentially(index + 1);
            };
            script.onerror = () => {
                console.error(`[LegacyLoader] ❌ Failed to load ${this.EVENT_HANDLERS[index]}`);
                // Continue despite error
                this.loadEventHandlersSequentially(index + 1);
            };
            document.head.appendChild(script);
        } else {
            // All handlers loaded, now load registry
            
            const registryScript = document.createElement('script');
            registryScript.src = 'js/event-handler-registry.js';
            registryScript.async = false;
            document.head.appendChild(registryScript);
        }
    }
}
