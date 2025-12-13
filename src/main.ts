console.log('🚀 Phase 5: Frontend Migration Initialized');

import { appConfig, loadRemoteConfig } from './core/config';
import { apiClient } from './core/api-client';
import { authInterface } from './core/auth';
import { formValidator } from './core/utils/validation';
import { floatingToolbar } from './components/ui/FloatingToolbar';
import { adminDashboard } from './modules/admin/dashboard';

// ✅ Nuevos módulos migrados a TypeScript (13 Dic 2025)
import { bgeContext, BGEContextManager } from './core/context-manager';
import { eventBus, EventBus } from './core/event-bus';
import { debugLog } from './core/debug-logger';

import { HeroesPatriaApp, MOUNT_CONFIG } from './core/heroes-app';
import { TenantUpdater } from './core/tenant-updater';
import { LegacyLoader } from './core/legacy-loader';
import { installPolyfills } from './core/polyfills';
import './styles/legacy-overrides.css';

// Initial setup
loadRemoteConfig().then(() => {
    console.log('⚙️ Configuración cargada desde main.ts');

    // 0. Instalar Polyfills
    installPolyfills();

    // 1. Inicializar Legacy Loader (Bridges y Event Handlers críticos)
    const legacyLoader = new LegacyLoader();
    legacyLoader.init();

    // 2. Inicializar Tenant Updater (Escuchar configs)
    const tenantUpdater = new TenantUpdater();
    tenantUpdater.init();

    // 3. Inicializar App Principal
    const app = new HeroesPatriaApp();
    app.init();

    // Exponer globales para compatibilidad legacy
    (window as any).APP_CONFIG = MOUNT_CONFIG;
    (window as any).HeroesPatria = {
        showNotification: (msg: string, type: string, dur: number) => app.showNotification(msg, type, dur),
        updatePageTitle: (title: string) => app.updatePageTitle(title)
    };
});

// Make globally available for legacy scripts debugging if needed (optional)
(window as any).appConfig = appConfig;
(window as any).apiClient = apiClient;
(window as any).authInterface = authInterface;
(window as any).formValidator = formValidator;
(window as any).floatingToolbar = floatingToolbar;
(window as any).adminDashboard = adminDashboard;

// ✅ Exponer nuevos módulos TypeScript globalmente para legacy
(window as any).BGEContext = bgeContext;
(window as any).contextManager = bgeContext;
(window as any).eventBus = eventBus;
(window as any).BGEContextManager = BGEContextManager;
(window as any).EventBus = EventBus;
(window as any).debugLog = debugLog;

console.log('✅ Frontend TypeScript modules initialized');
