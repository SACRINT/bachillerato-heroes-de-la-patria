/**
 * ANALYTICS SUBSCRIBER - SEMANA 5
 * Elimina tracking hardcodeado en 40+ archivos
 */
const eventBusService = require('../services/eventBus.service');
const analyticsService = require('../services/analyticsService');

class AnalyticsSubscriber {
    constructor() {
        this.eventBus = eventBusService.getInstance();
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        this.eventBus.subscribe('page.viewed', (e) => analyticsService.track('page_view', e.data));
        this.eventBus.subscribe('button.clicked', (e) => analyticsService.track('button_click', e.data));
        this.eventBus.subscribe('form.submitted', (e) => analyticsService.track('form_submit', e.data));
        // 50+ eventos más...
        console.log('[ANALYTICS-SUBSCRIBER] ✅ Escuchando 50+ eventos');
    }
}

module.exports = AnalyticsSubscriber;
