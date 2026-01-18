/**
 * Semana 56-58: Sistema de Monitoreo de Rendimiento
 * Métricas, alertas y stress testing
 */

interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memoryUsed: number;
    memoryLimit: number;
    drawCalls: number;
    triangles: number;
    texturesMemory: number;
    networkLatency: number;
    activeConnections: number;
}

interface PerformanceThresholds {
    minFps: number;
    maxFrameTime: number;
    maxMemoryPercent: number;
    maxLatency: number;
}

type AlertLevel = 'info' | 'warning' | 'critical';

interface PerformanceAlert {
    level: AlertLevel;
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
    message: string;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        fps: 60,
        frameTime: 16.67,
        memoryUsed: 0,
        memoryLimit: 0,
        drawCalls: 0,
        triangles: 0,
        texturesMemory: 0,
        networkLatency: 0,
        activeConnections: 0
    };

    private thresholds: PerformanceThresholds = {
        minFps: 30,
        maxFrameTime: 33.33, // 30 fps
        maxMemoryPercent: 80,
        maxLatency: 200
    };

    private alerts: PerformanceAlert[] = [];
    private frameCount = 0;
    private lastFrameTime = performance.now();
    private fpsHistory: number[] = [];
    private isMonitoring = false;
    private monitorInterval: ReturnType<typeof setInterval> | null = null;

    // Callbacks
    private onAlert?: (alert: PerformanceAlert) => void;
    private onMetricsUpdate?: (metrics: PerformanceMetrics) => void;

    /**
     * Iniciar monitoreo
     */
    start(options?: {
        onAlert?: (alert: PerformanceAlert) => void;
        onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
        intervalMs?: number;
    }) {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.onAlert = options?.onAlert;
        this.onMetricsUpdate = options?.onMetricsUpdate;

        // Medir FPS con RAF
        const measureFrame = () => {
            if (!this.isMonitoring) return;

            const now = performance.now();
            const delta = now - this.lastFrameTime;
            this.lastFrameTime = now;

            // Calcular FPS
            this.metrics.frameTime = delta;
            this.metrics.fps = 1000 / delta;

            // Mantener historial
            this.fpsHistory.push(this.metrics.fps);
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }

            requestAnimationFrame(measureFrame);
        };

        requestAnimationFrame(measureFrame);

        // Monitoreo periódico de otras métricas
        this.monitorInterval = setInterval(() => {
            this.updateMetrics();
            this.checkThresholds();
            this.onMetricsUpdate?.(this.metrics);
        }, options?.intervalMs || 1000);

        console.log('[PerformanceMonitor] Started');
    }

    /**
     * Detener monitoreo
     */
    stop() {
        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        console.log('[PerformanceMonitor] Stopped');
    }

    /**
     * Actualizar métricas del sistema
     */
    private updateMetrics() {
        // Memoria
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            this.metrics.memoryUsed = memory.usedJSHeapSize / (1024 * 1024);
            this.metrics.memoryLimit = memory.jsHeapSizeLimit / (1024 * 1024);
        }

        // FPS promedio
        if (this.fpsHistory.length > 0) {
            this.metrics.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        }
    }

    /**
     * Verificar umbrales y generar alertas
     */
    private checkThresholds() {
        // FPS bajo
        if (this.metrics.fps < this.thresholds.minFps) {
            this.addAlert('warning', 'fps', this.metrics.fps, this.thresholds.minFps,
                `FPS bajo: ${this.metrics.fps.toFixed(1)} (mínimo: ${this.thresholds.minFps})`);
        }

        if (this.metrics.fps < 20) {
            this.addAlert('critical', 'fps', this.metrics.fps, 20,
                `FPS crítico: ${this.metrics.fps.toFixed(1)} - El juego puede ser injugable`);
        }

        // Memoria alta
        if (this.metrics.memoryLimit > 0) {
            const memPercent = (this.metrics.memoryUsed / this.metrics.memoryLimit) * 100;
            if (memPercent > this.thresholds.maxMemoryPercent) {
                this.addAlert('warning', 'memory', memPercent, this.thresholds.maxMemoryPercent,
                    `Uso de memoria alto: ${memPercent.toFixed(1)}%`);
            }
        }

        // Latencia
        if (this.metrics.networkLatency > this.thresholds.maxLatency) {
            this.addAlert('warning', 'latency', this.metrics.networkLatency, this.thresholds.maxLatency,
                `Latencia alta: ${this.metrics.networkLatency}ms`);
        }
    }

    /**
     * Agregar alerta
     */
    private addAlert(level: AlertLevel, metric: string, value: number, threshold: number, message: string) {
        const alert: PerformanceAlert = {
            level,
            metric,
            value,
            threshold,
            timestamp: new Date(),
            message
        };

        this.alerts.push(alert);
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }

        this.onAlert?.(alert);
    }

    /**
     * Actualizar métricas de red
     */
    updateNetworkMetrics(latency: number, connections: number) {
        this.metrics.networkLatency = latency;
        this.metrics.activeConnections = connections;
    }

    /**
     * Actualizar métricas de renderizado (desde Three.js)
     */
    updateRenderMetrics(info: { render: { calls: number; triangles: number } }) {
        this.metrics.drawCalls = info.render.calls;
        this.metrics.triangles = info.render.triangles;
    }

    /**
     * Obtener métricas actuales
     */
    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    /**
     * Obtener alertas recientes
     */
    getAlerts(): PerformanceAlert[] {
        return [...this.alerts];
    }

    /**
     * Obtener resumen de rendimiento
     */
    getSummary(): {
        status: 'good' | 'degraded' | 'critical';
        avgFps: number;
        memoryPercent: number;
        recentAlerts: number;
    } {
        const avgFps = this.fpsHistory.length > 0
            ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            : 60;

        const memoryPercent = this.metrics.memoryLimit > 0
            ? (this.metrics.memoryUsed / this.metrics.memoryLimit) * 100
            : 0;

        const recentAlerts = this.alerts.filter(
            a => Date.now() - a.timestamp.getTime() < 60000
        ).length;

        let status: 'good' | 'degraded' | 'critical' = 'good';
        if (avgFps < 30 || recentAlerts > 5) status = 'degraded';
        if (avgFps < 20 || recentAlerts > 10) status = 'critical';

        return { status, avgFps, memoryPercent, recentAlerts };
    }

    /**
     * Configurar umbrales personalizados
     */
    setThresholds(thresholds: Partial<PerformanceThresholds>) {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }
}

// Instancia singleton
export const performanceMonitor = new PerformanceMonitor();

// React Hook
import { useState, useEffect, useCallback } from 'react';

export function usePerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
    const [status, setStatus] = useState<'good' | 'degraded' | 'critical'>('good');

    useEffect(() => {
        performanceMonitor.start({
            onMetricsUpdate: (m) => {
                setMetrics(m);
                setStatus(performanceMonitor.getSummary().status);
            },
            onAlert: (a) => {
                setAlerts(prev => [...prev.slice(-9), a]);
            }
        });

        return () => performanceMonitor.stop();
    }, []);

    return { metrics, alerts, status };
}

export default performanceMonitor;
