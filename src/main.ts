console.log('🚀 Phase 5: Frontend Migration Initialized');

import { appConfig, loadRemoteConfig } from './core/config';
import { apiClient } from './core/api-client';
import { authInterface } from './core/auth';
import { formValidator } from './core/utils/validation';
import { floatingToolbar } from './components/ui/FloatingToolbar';
import { adminDashboard } from './modules/admin/dashboard';

// ✅ Módulos migrados a TypeScript (13 Dic 2025)
import { bgeContext, BGEContextManager } from './core/context-manager';
import { eventBus, EventBus } from './core/event-bus';
import { debugLog } from './core/debug-logger';
import { themeManager, ThemeManager } from './core/theme-manager';
import { loaderSystem, LoaderSystem } from './core/loader';
import { socketClient, SocketClient } from './core/socket-client';
import { mobileUXManager, MobileUXManager } from './core/mobile-ux-manager'; // ✅ NEW
import { notificationManager, NotificationManager } from './core/notification-manager'; // ✅ NEW

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

// ✅ Exponer módulos TypeScript globalmente para legacy
(window as any).BGEContext = bgeContext;
(window as any).contextManager = bgeContext;
(window as any).eventBus = eventBus;
(window as any).BGEContextManager = BGEContextManager;
(window as any).EventBus = EventBus;
(window as any).debugLog = debugLog;
(window as any).themeManager = themeManager;
(window as any).integratedThemeManager = themeManager;
(window as any).ThemeManager = ThemeManager;
(window as any).loaderSystem = loaderSystem;
(window as any).LoaderSystem = LoaderSystem;
(window as any).showLoader = () => loaderSystem.show();
(window as any).hideLoader = () => loaderSystem.hide();
if (socketClient) {
    (window as any).socketClient = socketClient;
}
(window as any).SocketClient = SocketClient;

console.log('✅ Frontend TypeScript modules initialized (15 modules)');
