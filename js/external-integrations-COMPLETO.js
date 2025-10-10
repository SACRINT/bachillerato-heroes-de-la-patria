/**
 * 🌐 EXTERNAL INTEGRATIONS - Integraciones con Servicios Externos
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de integración con APIs y servicios externos
 */

// Configuración de API URL para integraciones
const INTEGRATIONS_API_BASE = (() => {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:3000';  // Backend en desarrollo
    }
    return window.location.origin;  // En producción, mismo dominio
})();

class ExternalIntegrationsManager {
    constructor() {
        this.integrations = {
            sep: new SEPIntegration(),
            curp: new CURPValidator(),
            googleWorkspace: new GoogleWorkspaceIntegration(),
            microsoftEducation: new MicrosoftEducationIntegration(),
            socialMedia: new SocialMediaIntegration(),
            analytics: new AdvancedAnalytics()
        };

        this.config = {
            apiKeys: {
                googleMaps: 'YOUR_GOOGLE_MAPS_API_KEY',
                facebook: 'YOUR_FACEBOOK_APP_ID',
                twitter: 'YOUR_TWITTER_API_KEY'
            },
            endpoints: {
                sep: 'https://api.sep.gob.mx/v1/',
                curp: 'https://renapo.gob.mx/api/v1/',
                internal: '/api/'
            }
        };

        this.init();
    }

    async init() {
        //console.log('🔗 Initializing External Integrations...');
        
        // Initialize all integrations
        for (const [name, integration] of Object.entries(this.integrations)) {
            try {
                await integration.init();
                //console.log(`✅ ${name} integration initialized`);
            } catch (error) {
                console.warn(`⚠️ ${name} integration failed:`, error);
            }
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // CURP validation on forms
        document.addEventListener('input', (e) => {
            if (e.target.name === 'curp' || e.target.id === 'curp') {
                this.validateCURPField(e.target);
            }
        });

        // Social sharing
        document.addEventListener('click', (e) => {
            if (e.target.matches('.social-share') || e.target.closest('.social-share')) {
                this.handleSocialShare(e);
            }
        });

        // External calendar events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-to-calendar') || e.target.closest('.add-to-calendar')) {
                this.handleCalendarAdd(e);
            }
        });
    }

    async validateCURPField(field) {
        const curp = field.value.toUpperCase();
        
        if (curp.length === 18) {
            const isValid = await this.integrations.curp.validate(curp);
            
            this.updateFieldValidation(field, isValid, 
                isValid ? 'CURP válida' : 'CURP no válida');
        }
    }

    updateFieldValidation(field, isValid, message) {
        // Remove previous feedback
        const feedback = field.parentNode.querySelector('.validation-feedback');
        if (feedback) feedback.remove();

        // Add new feedback
        const feedbackEl = document.createElement('div');
        feedbackEl.className = `validation-feedback ${isValid ? 'valid' : 'invalid'}`;
        feedbackEl.textContent = message;
        
        field.classList.toggle('is-valid', isValid);
        field.classList.toggle('is-invalid', !isValid);
        field.parentNode.appendChild(feedbackEl);
    }

    handleSocialShare(e) {
        e.preventDefault();
        const platform = e.target.dataset.platform || e.target.closest('.social-share').dataset.platform;
        const content = this.getContentToShare(e.target);
        
        this.integrations.socialMedia.share(platform, content);
    }

    getContentToShare(element) {
        const container = element.closest('.card, .news-item, article');
        
        return {
            title: container?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || document.title,
            description: container?.querySelector('p, .description')?.textContent?.substring(0, 200) || '',
            image: container?.querySelector('img')?.src || '/images/logo-bachillerato-HDLP.webp',
            url: window.location.href
        };
    }

    handleCalendarAdd(e) {
        e.preventDefault();
        const eventData = this.getEventData(e.target);
        this.integrations.googleWorkspace.addToCalendar(eventData);
    }

    getEventData(element) {
        const container = element.closest('.event-card, .calendario-evento');
        
        return {
            title: container?.querySelector('.event-title, h5, h6')?.textContent || 'Evento Escolar',
            description: container?.querySelector('.event-description, p')?.textContent || '',
            startDate: container?.dataset.startDate || new Date().toISOString(),
            endDate: container?.dataset.endDate || new Date(Date.now() + 3600000).toISOString(),
            location: 'Bachillerato General Estatal "Héroes de la Patria"'
        };
    }
}

// SEP Integration
class SEPIntegration {
    constructor() {
        this.apiEndpoint = 'https://api.sep.gob.mx/v1/';
        this.authenticated = false;
    }

    async init() {
        // Initialize SEP integration
        //console.log('🏛️ Initializing SEP integration...');
        // In production, this would handle OAuth flow with SEP
    }

    async validateStudentData(studentData) {
        try {
            // Mock validation - in production would call actual SEP API
            const response = await this.mockSEPAPI('validate-student', studentData);
            return response.valid;
        } catch (error) {
            console.error('❌ SEP validation error:', error);
            return null;
        }
    }

    async submitAcademicReport(reportData) {
        try {
            const response = await this.mockSEPAPI('academic-report', reportData);
            return response.success;
        } catch (error) {
            console.error('❌ SEP report submission error:', error);
            return false;
        }
    }

    async mockSEPAPI(endpoint, data) {
        // Mock implementation - replace with actual SEP API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            valid: true,
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        };
    }
}

// CURP Validator
class CURPValidator {
    constructor() {
        this.apiEndpoint = 'https://renapo.gob.mx/api/v1/';
    }

    async init() {
        //console.log('🆔 Initializing CURP validator...');
    }

    validate(curp) {
        // Basic CURP format validation
        const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
        
        if (!curpPattern.test(curp)) {
            return false;
        }

        // Additional validation logic
        return this.validateCURPChecksum(curp);
    }

    validateCURPChecksum(curp) {
        // CURP checksum validation algorithm
        const weights = [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
        const chars = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
        
        let sum = 0;
        for (let i = 0; i < 17; i++) {
            const char = curp.charAt(i);
            const value = chars.indexOf(char);
            if (value === -1) return false;
            sum += value * weights[i];
        }
        
        const checksum = 10 - (sum % 10);
        const expectedChecksum = checksum === 10 ? 0 : checksum;
        const actualChecksum = parseInt(curp.charAt(17));
        
        return expectedChecksum === actualChecksum;
    }

    async validateWithRENAPO(curp) {
        try {
            // Mock RENAPO validation - in production would call actual API
            const response = await fetch('/api/validate-curp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ curp })
            });
            
            const result = await response.json();
            return result.valid;
        } catch (error) {
            console.error('❌ RENAPO validation error:', error);
            return null;
        }
    }
}

// Google Workspace Integration
class GoogleWorkspaceIntegration {
    constructor() {
        this.clientId = null; // Set your Google Client ID here
        this.apiKey = null; // Set your Google API Key here
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/calendar';
        this.initialized = false;
    }

    async init() {
        //console.log('📧 Initializing Google Workspace integration...');
        
        // Only load if API keys are configured
        if (!this.clientId || !this.apiKey) {
            //console.log('⚠️ Google API keys not configured, skipping initialization');
            return;
        }
        
        // Load Google APIs
        if (typeof gapi === 'undefined') {
            await this.loadGoogleAPI();
        }
        
        try {
            await gapi.load('client:auth2', () => {
                this.initializeGoogleClient();
            });
        } catch (error) {
            console.warn('⚠️ Google API not available:', error);
        }
    }

    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeGoogleClient() {
        try {
            await gapi.client.init({
                apiKey: this.apiKey,
                clientId: this.clientId,
                discoveryDocs: [this.discoveryDoc],
                scope: this.scopes
            });
            
            this.initialized = true;
            //console.log('✅ Google client initialized');
        } catch (error) {
            console.error('❌ Google client initialization failed:', error);
        }
    }

    async signIn() {
        if (!this.initialized) {
            throw new Error('Google client not initialized');
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        return await authInstance.signIn();
    }

    async addToCalendar(eventData) {
        if (!this.initialized) {
            // Fallback to Google Calendar URL
            this.addToCalendarURL(eventData);
            return;
        }

        try {
            const event = {
                summary: eventData.title,
                description: eventData.description,
                start: {
                    dateTime: eventData.startDate,
                    timeZone: 'America/Mexico_City'
                },
                end: {
                    dateTime: eventData.endDate,
                    timeZone: 'America/Mexico_City'
                },
                location: eventData.location
            };

            const request = gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            const response = await request.execute();
            //console.log('✅ Event added to calendar:', response);
            
            this.showAlert('✅ Evento agregado al calendario de Google', 'success');
        } catch (error) {
            console.error('❌ Calendar add failed:', error);
            this.addToCalendarURL(eventData);
        }
    }

    addToCalendarURL(eventData) {
        const start = new Date(eventData.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const end = new Date(eventData.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: eventData.title,
            dates: `${start}/${end}`,
            details: eventData.description,
            location: eventData.location
        });
        
        const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
        window.open(url, '_blank');
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 350px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
}

// Microsoft Education Integration
class MicrosoftEducationIntegration {
    constructor() {
        this.clientId = 'YOUR_MICROSOFT_CLIENT_ID';
        this.authority = 'https://login.microsoftonline.com/common';
        this.scopes = ['https://graph.microsoft.com/calendars.readwrite'];
    }

    async init() {
        //console.log('🏢 Initializing Microsoft Education integration...');
        // Initialize Microsoft Graph integration
    }

    async addToOutlookCalendar(eventData) {
        // Microsoft Graph API integration for Outlook calendar
        //console.log('📅 Adding event to Outlook calendar:', eventData);
        
        // Fallback to Outlook web URL
        const params = new URLSearchParams({
            subject: eventData.title,
            body: eventData.description,
            startdt: eventData.startDate,
            enddt: eventData.endDate,
            location: eventData.location
        });
        
        const url = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
        window.open(url, '_blank');
    }
}

// Social Media Integration
class SocialMediaIntegration {
    constructor() {
        this.platforms = {
            facebook: 'https://www.facebook.com/sharer/sharer.php',
            twitter: 'https://twitter.com/intent/tweet',
            whatsapp: 'https://wa.me/',
            telegram: 'https://t.me/share/url'
        };
    }

    async init() {
        //console.log('📱 Initializing Social Media integration...');
    }

    share(platform, content) {
        const shareUrl = this.generateShareURL(platform, content);
        
        if (shareUrl) {
            // Open in popup for better UX
            const popup = window.open(
                shareUrl,
                'share',
                'width=600,height=400,scrollbars=yes,resizable=yes'
            );
            
            // Track sharing
            this.trackShare(platform, content);
        }
    }

    generateShareURL(platform, content) {
        const encodedTitle = encodeURIComponent(content.title);
        const encodedDescription = encodeURIComponent(content.description);
        const encodedUrl = encodeURIComponent(content.url);
        
        switch (platform) {
            case 'facebook':
                return `${this.platforms.facebook}?u=${encodedUrl}`;
                
            case 'twitter':
                return `${this.platforms.twitter}?text=${encodedTitle}&url=${encodedUrl}`;
                
            case 'whatsapp':
                return `${this.platforms.whatsapp}?text=${encodedTitle}%20${encodedUrl}`;
                
            case 'telegram':
                return `${this.platforms.telegram}?url=${encodedUrl}&text=${encodedTitle}`;
                
            default:
                return null;
        }
    }

    trackShare(platform, content) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                method: platform,
                content_type: 'article',
                item_id: content.title
            });
        }
        
        // Custom analytics
        // TEMPORALLY DISABLED - Backend not implemented
        // fetch(`${INTEGRATIONS_API_BASE}/api/analytics/social-share`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         platform,
        //         content_title: content.title,
        //         timestamp: Date.now()
        //     })
        // }).catch(e => console.warn('Analytics failed:', e));
        //console.log('📊 Social share tracked (offline mode):', platform, content.title);
    }
}

// Advanced Analytics
class AdvancedAnalytics {
    constructor() {
        this.sessionData = {
            startTime: Date.now(),
            pageViews: [],
            interactions: [],
            deviceInfo: this.getDeviceInfo()
        };
    }

    async init() {
        //console.log('📊 Initializing Advanced Analytics...');
        
        this.setupTracking();
        this.trackPageView();
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    setupTracking() {
        // Track clicks
        document.addEventListener('click', (e) => {
            this.trackInteraction('click', {
                element: e.target.tagName,
                className: e.target.className,
                id: e.target.id,
                text: e.target.textContent?.substring(0, 50)
            });
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > maxScroll) {
                maxScroll = Math.round(scrollPercent);
                if (maxScroll % 25 === 0 && maxScroll > 0) {
                    this.trackInteraction('scroll', { depth: maxScroll });
                }
            }
        });

        // Track time on page
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage += 30;
            if (timeOnPage % 300 === 0) { // Every 5 minutes
                this.trackInteraction('time_on_page', { seconds: timeOnPage });
            }
        }, 30000);

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            this.trackInteraction('visibility_change', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now(),
            referrer: document.referrer,
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
        };
        
        this.sessionData.pageViews.push(pageData);
        this.sendAnalytics('page_view', pageData);
    }

    trackInteraction(type, data) {
        const interaction = {
            type,
            data,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        this.sessionData.interactions.push(interaction);
        
        // Send critical interactions immediately
        if (['error', 'form_submit', 'download'].includes(type)) {
            this.sendAnalytics('interaction', interaction);
        }
    }

    async sendAnalytics(event, data) {
        try {
            // TEMPORALLY DISABLED - Backend not implemented
            // await fetch(`${INTEGRATIONS_API_BASE}/api/analytics/track`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         event,
            //         data,
            //         session: this.sessionData,
            //         timestamp: Date.now()
            //     })
            // });
        } catch (error) {
            // Store for later if network fails
            this.storeOfflineAnalytics(event, data);
        }
    }

    storeOfflineAnalytics(event, data) {
        const offline = JSON.parse(localStorage.getItem('offlineAnalytics') || '[]');
        offline.push({ event, data, timestamp: Date.now() });
        localStorage.setItem('offlineAnalytics', JSON.stringify(offline));
    }

    // Send session data before page unload
    sendSessionData() {
        const sessionSummary = {
            ...this.sessionData,
            endTime: Date.now(),
            duration: Date.now() - this.sessionData.startTime
        };
        
        // Use sendBeacon for reliable delivery
        if (navigator.sendBeacon) {
            navigator.sendBeacon(
                '/api/analytics/session',
                JSON.stringify(sessionSummary)
            );
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.externalIntegrations = new ExternalIntegrationsManager();
});

// Send session data on page unload
window.addEventListener('beforeunload', () => {
    if (window.externalIntegrations?.integrations?.analytics) {
        window.externalIntegrations.integrations.analytics.sendSessionData();
    }
});

// Add social sharing buttons to content
function addSocialSharingButtons(container) {
    const shareContainer = document.createElement('div');
    shareContainer.className = 'social-sharing mt-3';
    shareContainer.innerHTML = `
        <div class="d-flex gap-2 align-items-center">
            <small class="text-muted me-2">Compartir:</small>
            <button class="btn btn-sm btn-outline-primary social-share" data-platform="facebook" title="Compartir en Facebook">
                <i class="fab fa-facebook-f"></i>
            </button>
            <button class="btn btn-sm btn-outline-info social-share" data-platform="twitter" title="Compartir en Twitter">
                <i class="fab fa-twitter"></i>
            </button>
            <button class="btn btn-sm btn-outline-success social-share" data-platform="whatsapp" title="Compartir en WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary social-share" data-platform="telegram" title="Compartir en Telegram">
                <i class="fab fa-telegram"></i>
            </button>
        </div>
    `;
    
    container.appendChild(shareContainer);
}

// Auto-add sharing buttons to news and events
document.addEventListener('DOMContentLoaded', () => {
    const newsItems = document.querySelectorAll('.news-item, .event-card, .card-body');
    newsItems.forEach(item => {
        if (!item.querySelector('.social-sharing')) {
            addSocialSharingButtons(item);
        }
    });
});