/**
 * Punto de entrada principal para todas las configuraciones
 */

export { siteConfig, type SiteConfig } from './site.js';
export { navigationConfig, type NavigationConfig } from './navigation.js';
export { themeConfig, type ThemeConfig } from './theme.js';

// Re-exportar tipos comunes de @heroes-patria/types
export type { NavigationItem } from '@heroes-patria/types';