/**
 * Semana 54: Sistema de Retroalimentación Háptica
 * Vibración para gamepad, móvil y mandos VR
 */

type HapticPattern = number[];
type HapticIntensity = 'light' | 'medium' | 'strong';

interface HapticOptions {
    intensity: HapticIntensity;
    duration?: number;
}

// Patrones predefinidos
const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
    // UI
    click: [10],
    hover: [5],
    success: [50, 50, 50],
    error: [100, 50, 100, 50, 100],
    warning: [80, 30, 80],

    // Gameplay
    collision: [100, 30, 50],
    damage: [150, 50, 100, 50, 50],
    pickup: [30, 20, 30],
    achievement: [50, 50, 100, 100, 150],
    heartbeat: [100, 100, 200, 800],

    // Notifications
    message: [30, 50, 30],
    alert: [100, 100, 100],
    reminder: [50, 100, 50, 100]
};

// Multiplicadores de intensidad
const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
    light: 0.5,
    medium: 1,
    strong: 1.5
};

class HapticSystem {
    private enabled: boolean = true;
    private gamepad: Gamepad | null = null;
    private vrControllers: any[] = [];

    constructor() {
        this.initGamepadListener();
        this.checkVibrationSupport();
    }

    /**
     * Habilitar/deshabilitar hápticos (accesibilidad)
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    /**
     * Vibración móvil (navigator.vibrate)
     */
    vibrateMobile(pattern: HapticPattern, options: Partial<HapticOptions> = {}) {
        if (!this.enabled || !('vibrate' in navigator)) return;

        const multiplier = INTENSITY_MULTIPLIERS[options.intensity || 'medium'];
        const adjustedPattern = pattern.map(v => Math.round(v * multiplier));

        try {
            navigator.vibrate(adjustedPattern);
        } catch (e) {
            console.warn('Vibración no disponible:', e);
        }
    }

    /**
     * Vibración de gamepad
     */
    vibrateGamepad(
        intensity: number = 0.5,
        duration: number = 100,
        hand: 'left' | 'right' | 'both' = 'both'
    ) {
        if (!this.enabled) return;

        const gamepads = navigator.getGamepads();

        for (const gamepad of gamepads) {
            if (!gamepad?.vibrationActuator) continue;

            try {
                (gamepad.vibrationActuator as any).playEffect?.('dual-rumble', {
                    startDelay: 0,
                    duration,
                    weakMagnitude: hand === 'right' ? intensity : 0,
                    strongMagnitude: hand === 'left' ? intensity : intensity
                });
            } catch (e) {
                // Fallback para gamepads sin vibrationActuator moderno
            }
        }
    }

    /**
     * Vibración de controladores VR
     */
    vibrateVRController(
        controller: any,
        intensity: number = 0.5,
        duration: number = 100
    ) {
        if (!this.enabled || !controller) return;

        try {
            const source = controller.inputSource;
            if (source?.gamepad?.hapticActuators?.[0]) {
                source.gamepad.hapticActuators[0].pulse(intensity, duration);
            }
        } catch (e) {
            console.warn('Vibración VR no disponible:', e);
        }
    }

    /**
     * Método unificado: vibra en todos los dispositivos disponibles
     */
    trigger(patternName: keyof typeof HAPTIC_PATTERNS, options: Partial<HapticOptions> = {}) {
        if (!this.enabled) return;

        const pattern = HAPTIC_PATTERNS[patternName] || HAPTIC_PATTERNS.click;

        // Móvil
        this.vibrateMobile(pattern, options);

        // Gamepad
        const totalDuration = pattern.reduce((a, b) => a + b, 0);
        const avgIntensity = INTENSITY_MULTIPLIERS[options.intensity || 'medium'] * 0.5;
        this.vibrateGamepad(avgIntensity, totalDuration);

        // VR Controllers
        this.vrControllers.forEach(controller => {
            this.vibrateVRController(controller, avgIntensity, totalDuration);
        });
    }

    /**
     * Métodos de conveniencia
     */
    click() { this.trigger('click', { intensity: 'light' }); }
    hover() { this.trigger('hover', { intensity: 'light' }); }
    success() { this.trigger('success', { intensity: 'medium' }); }
    error() { this.trigger('error', { intensity: 'strong' }); }
    collision() { this.trigger('collision', { intensity: 'medium' }); }
    damage() { this.trigger('damage', { intensity: 'strong' }); }
    pickup() { this.trigger('pickup', { intensity: 'light' }); }
    achievement() { this.trigger('achievement', { intensity: 'strong' }); }
    heartbeat() { this.trigger('heartbeat', { intensity: 'medium' }); }
    notification() { this.trigger('message', { intensity: 'light' }); }

    /**
     * Vibración continua (para tensión)
     */
    startContinuous(intensity: HapticIntensity = 'light') {
        if (!this.enabled) return null;

        const intervalId = setInterval(() => {
            this.trigger('heartbeat', { intensity });
        }, 1000);

        return intervalId;
    }

    stopContinuous(intervalId: ReturnType<typeof setInterval>) {
        clearInterval(intervalId);
        navigator.vibrate?.(0); // Detener vibración
    }

    /**
     * Listeners de gamepad
     */
    private initGamepadListener() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepad = e.gamepad;
            console.log(`[Haptics] Gamepad conectado: ${e.gamepad.id}`);
        });

        window.addEventListener('gamepaddisconnected', () => {
            this.gamepad = null;
        });
    }

    /**
     * Registrar controladores VR
     */
    registerVRController(controller: any) {
        if (!this.vrControllers.includes(controller)) {
            this.vrControllers.push(controller);
        }
    }

    unregisterVRController(controller: any) {
        this.vrControllers = this.vrControllers.filter(c => c !== controller);
    }

    /**
     * Verificar soporte
     */
    private checkVibrationSupport() {
        const features = {
            mobileVibration: 'vibrate' in navigator,
            gamepadVibration: 'getGamepads' in navigator,
            vrHaptics: 'xr' in navigator
        };

        console.log('[Haptics] Soporte:', features);
        return features;
    }
}

// Instancia singleton
export const haptics = new HapticSystem();

// Hook React
import { useCallback, useEffect } from 'react';

export function useHaptics() {
    const trigger = useCallback((pattern: keyof typeof HAPTIC_PATTERNS, options?: Partial<HapticOptions>) => {
        haptics.trigger(pattern, options);
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        haptics.setEnabled(enabled);
    }, []);

    return {
        trigger,
        click: haptics.click.bind(haptics),
        success: haptics.success.bind(haptics),
        error: haptics.error.bind(haptics),
        collision: haptics.collision.bind(haptics),
        achievement: haptics.achievement.bind(haptics),
        notification: haptics.notification.bind(haptics),
        setEnabled,
        isEnabled: haptics.isEnabled()
    };
}

export default haptics;
