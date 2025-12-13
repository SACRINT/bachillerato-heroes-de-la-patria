import { SessionManager } from './session-manager';
import { UIManager } from './ui-manager';
import { GoogleAuthManager } from './google-auth';
import { AuthConfig, AuthState, User, AuthResponse } from './types';
import { apiClient } from '../api-client';

export class AuthManager {
    private static instance: AuthManager;

    public session: SessionManager;
    public ui: UIManager;
    public google: GoogleAuthManager;

    private state: AuthState = {
        currentUser: null,
        token: null,
        isAuthenticated: false,
        isInitialized: false,
        googleReady: false,
        lastActivityTime: Date.now()
    };

    private config: AuthConfig = {
        apiBaseUrl: '/api',
        sessionTimeout: 30 * 60 * 1000 // 30 min
    };

    private constructor() {
        this.session = new SessionManager();
        this.ui = new UIManager();
        this.google = new GoogleAuthManager(this.config);
    }

    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    async init(): Promise<void> {
        if (this.state.isInitialized) return;

        console.log('🔐 Initializing Auth Manager TS...');

        // 1. Load Session
        const sessionData = this.session.loadSession();
        if (sessionData) {
            this.state.currentUser = sessionData.user;
            this.state.token = sessionData.token;
            this.state.isAuthenticated = true;

            // Validar token en background
            this.validateToken().catch(() => this.logout());
        }

        // 2. Setup Google
        await this.google.init();

        // 3. Setup UI & Event Listeners
        this.setupEventListeners();
        this.ui.updateAuthUI(this.state.currentUser, this.state.isAuthenticated);

        // 4. Activity Monitor
        this.setupActivityMonitor();

        this.state.isInitialized = true;

        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('bge-auth-ready', { detail: this.state }));
    }

    private setupEventListeners(): void {
        // Global Listeners for Login Buttons
        document.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;

            // Login Buttons config
            if (target.matches('#loginBtn, #loginButton, .login-btn-trigger')) {
                e.preventDefault();
                this.ui.showModal();
            }

            // Logout
            if (target.matches('#logoutBtn, .logout-btn-trigger')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Form Submit
        document.addEventListener('submit', async (e: Event) => {
            const target = e.target as HTMLElement;
            if (target && target.id === 'unified-login-form') {
                e.preventDefault();
                await this.handleManualLogin();
            }
        });
    }

    private setupActivityMonitor(): void {
        const resetTimer = () => {
            this.state.lastActivityTime = Date.now();
        };

        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
            document.addEventListener(evt, resetTimer, { passive: true })
        );

        setInterval(() => {
            if (this.state.isAuthenticated) {
                const inactiveTime = Date.now() - this.state.lastActivityTime;
                if (inactiveTime > this.config.sessionTimeout) {
                    console.warn('Sesión expirada por inactividad');
                    this.logout();
                }
            }
        }, 60000);
    }

    async handleManualLogin(): Promise<void> {
        const emailInput = document.getElementById('loginEmail') as HTMLInputElement;
        const passInput = document.getElementById('loginPassword') as HTMLInputElement;
        const rememberCheck = document.getElementById('rememberMe') as HTMLInputElement;

        const btn = document.getElementById('manual-login-btn');
        const loading = btn?.querySelector('.loading-text');
        const normal = btn?.querySelector('.normal-text');

        if (!emailInput || !passInput) return;

        // UI Loading State
        if (btn) (btn as HTMLButtonElement).disabled = true;
        if (loading) loading.classList.remove('d-none');
        if (normal) normal.classList.add('d-none');

        try {
            const email = emailInput.value;
            const password = passInput.value;

            // Use apiClient to post
            const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });

            if (response.success && response.token && response.user) {
                await this.loginSuccess(response.user, response.token, rememberCheck?.checked || false);
            } else {
                this.ui.showAlert(response.message || 'Error de autenticación', 'danger');
            }

        } catch (error: any) {
            console.error('Login error', error);
            this.ui.showAlert(error.message || 'Error de conexión', 'danger');
        } finally {
            // Restore UI
            if (btn) (btn as HTMLButtonElement).disabled = false;
            if (loading) loading.classList.add('d-none');
            if (normal) normal.classList.remove('d-none');
        }
    }

    async loginSuccess(user: User, token: string, rememberMe: boolean): Promise<void> {
        this.state.currentUser = user;
        this.state.token = token;
        this.state.isAuthenticated = true;

        // Save Session
        this.session.saveSession(user, token, rememberMe);

        // Update API Client
        apiClient.setToken(token);

        // Update UI
        this.ui.hideModal();
        this.ui.updateAuthUI(user, true);
        this.ui.showAlert(`Bienvenido, ${user.nombre}`, 'success');

        // Dispatch Event
        window.dispatchEvent(new CustomEvent('bge-user-logged-in', { detail: { user } }));

        // Redirect if specific logic needed (e.g. admin)
        if (user.role === 'admin' && !location.pathname.includes('admin')) {
            // Optional: window.location.href = '/admin-dashboard.html';
        }
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout', {});
        } catch (e) {
            // Ignore api error on logout
        } finally {
            this.state.currentUser = null;
            this.state.token = null;
            this.state.isAuthenticated = false;

            this.session.clearSession();
            apiClient.removeToken();

            this.ui.updateAuthUI(null, false);

            window.dispatchEvent(new CustomEvent('bge-user-logged-out'));

            // Redirect if in protected details
            if (location.pathname.includes('admin') || location.pathname.includes('dashboard')) {
                window.location.href = '/index.html';
            }
        }
    }

    private async validateToken(): Promise<boolean> {
        if (!this.state.token) return false;
        try {
            const res = await apiClient.get<any>('/auth/profile');
            return res.success;
        } catch {
            return false;
        }
    }

    // Public Accessors

    public getCurrentUser(): User | null {
        return this.state.currentUser;
    }

    public isAuthenticated(): boolean {
        return this.state.isAuthenticated;
    }

    public getToken(): string | null {
        return this.state.token;
    }
}

export const authManager = AuthManager.getInstance();
