import { AuthConfig } from './types';

declare const google: any;

export class GoogleAuthManager {
    private isReady = false;
    private clientId: string | null = null;

    constructor(private config: AuthConfig) {
        this.clientId = config.googleClientId || null;
    }

    async init(): Promise<void> {
        if (!this.clientId) return;

        try {
            // Carga de librería de google si no existe
            if (typeof google === 'undefined') {
                // Aquí podríamos cargar el script dinámicamente si quisiéramos
                // await this.loadGoogleScript();
                return;
            }

            this.setupGoogleOneTap();
            this.isReady = true;
        } catch (e) {
            console.warn('Google Auth Init Failed', e);
        }
    }

    private setupGoogleOneTap(): void {
        if (!this.clientId || typeof google === 'undefined') return;

        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this)
        });

        // Opcional: mostrar One Tap
        // google.accounts.id.prompt(); 
    }

    private handleCredentialResponse(response: any): void {
        console.log('Google Credential Received', response);
        // Dispatch event para que el sistema principal lo maneje
        window.dispatchEvent(new CustomEvent('google-auth-success', { detail: response }));
    }

    renderButton(elementId: string): void {
        if (typeof google === 'undefined' || !this.isReady) return;

        const element = document.getElementById(elementId);
        if (element) {
            google.accounts.id.renderButton(element, {
                theme: 'outline',
                size: 'large',
                width: '100%'
            });
        }
    }
}
