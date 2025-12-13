/**
 * @fileoverview Authentication System Interface
 * Wrapper for the new modular AuthManager to maintain compatibility
 * Updated: 13 Dec 2025
 */

import { authManager } from './auth/auth-manager';
import { User } from './auth/types';

export { authManager } from './auth/auth-manager';
export * from './auth/types';

class AuthInterface {
    private static instance: AuthInterface;

    constructor() {
        if (AuthInterface.instance) {
            return AuthInterface.instance;
        }
        AuthInterface.instance = this;
        this.init();
    }

    private init(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                authManager.init();
            });
        } else {
            authManager.init();
        }
    }

    // === Public API Wrappers ===

    public get currentUser(): User | null {
        return authManager.getCurrentUser();
    }

    public isAuthenticated(): boolean {
        return authManager.isAuthenticated();
    }

    public showLoginModal(): void {
        authManager.ui.showModal();
    }

    public logout(): void {
        authManager.logout();
    }

    public showToast(type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string): void {
        // Adapt old signature (type, title, message) to new simple (message, type)
        // Ignoring title for simple alert, or we could prepend it
        const msg = title ? `<strong>${title}</strong>: ${message}` : message;
        authManager.ui.showAlert(msg, type);
    }
}

export const authInterface = new AuthInterface();

// Expose globally for legacy scripts
if (typeof window !== 'undefined') {
    (window as any).authInterface = authInterface;
    (window as any).authManager = authManager;
    (window as any).UnifiedAuthSystem = authManager; // Para compatibilidad con legacy
}
