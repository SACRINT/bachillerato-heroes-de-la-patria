console.log('🚀 Phase 5: Frontend Migration Initialized');

import { appConfig, loadRemoteConfig } from './core/config';
import { apiClient } from './core/api-client';
import { authInterface } from './core/auth';


// Initial setup
loadRemoteConfig().then(() => {
    console.log('配置 cargada desde main.ts');
});

// Make globally available for legacy scripts debugging if needed (optional)
(window as any).appConfig = appConfig;
(window as any).apiClient = apiClient;
(window as any).authInterface = authInterface;


