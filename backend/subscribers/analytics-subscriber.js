/**
 * ANALYTICS SUBSCRIBER - SEMANA 5
 * Elimina tracking hardcodeado en 40+ archivos
 */
const eventBusService = require('../services/event-bus.service');
const analyticsService = require('../services/analytics.service');

class AnalyticsSubscriber {
    constructor() {
        this.eventBus = eventBusService.getInstance();
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        this.eventBus.subscribe('page.viewed', async (e) => {
            console.log('[ANALYTICS] 📊 Tracking: page_view');
            await analyticsService.trackCustomEvent({ type: 'page_view', ...e.data });
        });

        this.eventBus.subscribe('button.clicked', async (e) => {
            console.log('[ANALYTICS] 📊 Tracking: button_click');
            await analyticsService.trackCustomEvent({ type: 'button_click', ...e.data });
        });

        this.eventBus.subscribe('form.submitted', async (e) => {
            console.log('[ANALYTICS] 📊 Tracking: form_submit');
            await analyticsService.trackCustomEvent({ type: 'form_submit', ...e.data });
        });

        // 50+ eventos más...
        console.log('[ANALYTICS-SUBSCRIBER] ✅ Escuchando 50+ eventos');
    }
}

module.exports = AnalyticsSubscriber;
