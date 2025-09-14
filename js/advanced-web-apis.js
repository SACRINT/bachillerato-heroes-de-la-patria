/**
 * 🔮 ADVANCED WEB APIs - FASE 4
 * Implementación de las APIs más modernas para funcionalidades avanzadas
 */

class AdvancedWebAPIs {
    constructor() {
        this.supportedAPIs = this.checkAPISupport();
        this.badgeCount = 0;
        this.fileHandlers = new Map();
        this.contactManager = null;
        this.paymentProcessor = null;
        
        this.features = {
            badging: 'setAppBadge' in navigator,
            fileSystemAccess: 'showOpenFilePicker' in window,
            contactPicker: 'contacts' in navigator && 'ContactsManager' in window,
            paymentRequest: 'PaymentRequest' in window,
            webBluetooth: 'bluetooth' in navigator,
            webRTC: 'RTCPeerConnection' in window,
            webShare: 'share' in navigator,
            webLocks: 'locks' in navigator,
            backgroundFetch: 'serviceWorker' in navigator && 'BackgroundFetch' in window,
            webAssembly: 'WebAssembly' in window
        };
        
        this.init();
    }

    init() {
        //console.log('🔮 Inicializando Advanced Web APIs...');
        
        this.setupBadging();
        this.setupFileSystemAccess();
        this.setupContactPicker();
        this.setupPaymentAPI();
        this.setupWebLocks();
        this.addAPIButtons();
        
        //console.log('✅ Advanced Web APIs inicializadas');
        //console.log('🔧 APIs soportadas:', this.getSupportedFeatures());
    }

    checkAPISupport() {
        const support = {};
        
        // Check each API individually
        Object.keys(this.features).forEach(api => {
            support[api] = this.features[api];
        });
        
        return support;
    }

    getSupportedFeatures() {
        return Object.entries(this.features)
            .filter(([api, supported]) => supported)
            .map(([api]) => api);
    }

    // === BADGING API ===
    setupBadging() {
        if (!this.features.badging) {
            console.warn('Badging API not supported');
            return;
        }

        //console.log('🔔 Badging API available');
        
        // Listen for notifications to update badge
        if (window.pwaNotifications) {
            // Hook into notification system
            const originalShow = window.pwaNotifications.showLocalNotification;
            window.pwaNotifications.showLocalNotification = async (...args) => {
                const result = await originalShow.apply(window.pwaNotifications, args);
                this.incrementBadge();
                return result;
            };
        }

        // Clear badge when app becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.clearBadge();
            }
        });
    }

    async setBadge(count = null) {
        if (!this.features.badging) return false;

        try {
            if (count === null || count === 0) {
                await navigator.clearAppBadge();
                this.badgeCount = 0;
                //console.log('🔔 Badge cleared');
            } else {
                await navigator.setAppBadge(count);
                this.badgeCount = count;
                //console.log(`🔔 Badge set to: ${count}`);
            }
            return true;
        } catch (error) {
            console.warn('Error setting badge:', error);
            return false;
        }
    }

    async incrementBadge() {
        return this.setBadge(this.badgeCount + 1);
    }

    async clearBadge() {
        return this.setBadge(0);
    }

    // === FILE SYSTEM ACCESS API ===
    setupFileSystemAccess() {
        if (!this.features.fileSystemAccess) {
            console.warn('File System Access API not supported');
            this.setupFallbackFileHandling();
            return;
        }

        //console.log('📁 File System Access API available');
        
        // Register file type handlers
        this.registerFileHandler('pdf', {
            description: 'PDF Documents',
            accept: { 'application/pdf': ['.pdf'] }
        });

        this.registerFileHandler('image', {
            description: 'Images',
            accept: { 
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/webp': ['.webp']
            }
        });

        this.registerFileHandler('document', {
            description: 'Documents',
            accept: {
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'text/plain': ['.txt']
            }
        });
    }

    registerFileHandler(type, options) {
        this.fileHandlers.set(type, options);
    }

    async openFile(type = 'all') {
        if (!this.features.fileSystemAccess) {
            return this.openFileFallback();
        }

        try {
            const options = type === 'all' ? 
                { multiple: true } : 
                this.fileHandlers.get(type) || {};

            const fileHandles = await window.showOpenFilePicker(options);
            const files = await Promise.all(
                fileHandles.map(async handle => {
                    const file = await handle.getFile();
                    return { handle, file };
                })
            );

            //console.log('📁 Files opened:', files);
            this.processFiles(files);
            return files;

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Error opening files:', error);
            }
            return null;
        }
    }

    async saveFile(data, filename, type = 'text/plain') {
        if (!this.features.fileSystemAccess) {
            return this.saveFileFallback(data, filename, type);
        }

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Files',
                    accept: { [type]: ['.txt', '.json', '.csv'] }
                }]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();

            //console.log('💾 File saved:', filename);
            return true;

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Error saving file:', error);
            }
            return false;
        }
    }

    openFileFallback() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';
        
        return new Promise((resolve) => {
            input.onchange = (e) => {
                const files = Array.from(e.target.files).map(file => ({ file }));
                this.processFiles(files);
                resolve(files);
            };
            input.click();
        });
    }

    saveFileFallback(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
        return true;
    }

    setupFallbackFileHandling() {
        //console.log('📁 Using fallback file handling');
    }

    processFiles(files) {
        files.forEach(({ file, handle }) => {
            //console.log(`📄 Processing file: ${file.name} (${file.size} bytes)`);
            
            // Dispatch custom event for file processing
            const event = new CustomEvent('file-opened', {
                detail: { file, handle }
            });
            document.dispatchEvent(event);
        });
    }

    // === CONTACT PICKER API ===
    setupContactPicker() {
        if (!this.features.contactPicker) {
            console.warn('Contact Picker API not supported');
            return;
        }

        //console.log('📱 Contact Picker API available');
        this.contactManager = navigator.contacts;
    }

    async selectContacts(options = {}) {
        if (!this.features.contactPicker) {
            this.showContactPickerFallback();
            return null;
        }

        try {
            const defaultOptions = {
                multiple: true,
                properties: ['name', 'email', 'tel']
            };

            const finalOptions = { ...defaultOptions, ...options };
            const contacts = await navigator.contacts.select(finalOptions.properties, {
                multiple: finalOptions.multiple
            });

            //console.log('📱 Contacts selected:', contacts);
            this.processContacts(contacts);
            return contacts;

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('Error selecting contacts:', error);
            }
            return null;
        }
    }

    processContacts(contacts) {
        // Process selected contacts
        contacts.forEach(contact => {
            //console.log('👤 Contact:', contact.name, contact.email, contact.tel);
        });

        // Dispatch event for contact processing
        const event = new CustomEvent('contacts-selected', {
            detail: { contacts }
        });
        document.dispatchEvent(event);
    }

    showContactPickerFallback() {
        const modal = this.createModal('Selector de Contactos', `
            <p>Para añadir contactos, ingresa la información manualmente:</p>
            <form id="contact-form">
                <input type="text" placeholder="Nombre" id="contact-name" required>
                <input type="email" placeholder="Email" id="contact-email">
                <input type="tel" placeholder="Teléfono" id="contact-phone">
                <button type="submit">Añadir Contacto</button>
            </form>
        `);

        const form = modal.querySelector('#contact-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const contact = {
                name: [form.querySelector('#contact-name').value],
                email: [form.querySelector('#contact-email').value],
                tel: [form.querySelector('#contact-phone').value]
            };
            this.processContacts([contact]);
            modal.remove();
        });
    }

    // === PAYMENT REQUEST API ===
    setupPaymentAPI() {
        if (!this.features.paymentRequest) {
            console.warn('Payment Request API not supported');
            return;
        }

        //console.log('💳 Payment Request API available');
        
        this.paymentMethods = [
            {
                supportedMethods: 'basic-card',
                data: {
                    supportedNetworks: ['visa', 'mastercard', 'amex'],
                    supportedTypes: ['debit', 'credit']
                }
            }
        ];
    }

    async processPayment(details) {
        if (!this.features.paymentRequest) {
            return this.showPaymentFallback(details);
        }

        try {
            const paymentDetails = {
                total: {
                    label: details.label || 'Total',
                    amount: {
                        currency: details.currency || 'MXN',
                        value: details.amount.toString()
                    }
                },
                displayItems: details.items || []
            };

            const paymentOptions = {
                requestPayerName: true,
                requestPayerEmail: true,
                requestPayerPhone: false
            };

            const request = new PaymentRequest(
                this.paymentMethods,
                paymentDetails,
                paymentOptions
            );

            // Check if payment can be made
            const canMakePayment = await request.canMakePayment();
            if (!canMakePayment) {
                throw new Error('No payment method available');
            }

            const response = await request.show();
            
            // Process payment response
            await this.handlePaymentResponse(response, details);
            
            return response;

        } catch (error) {
            console.warn('Payment error:', error);
            return this.showPaymentFallback(details);
        }
    }

    async handlePaymentResponse(response, originalDetails) {
        try {
            // Simulate payment processing
            //console.log('💳 Processing payment...');
            
            // In real implementation, send to payment processor
            const result = await this.sendPaymentToProcessor(response, originalDetails);
            
            if (result.success) {
                await response.complete('success');
                //console.log('✅ Payment successful');
                
                // Show success message
                this.showPaymentSuccess(result);
            } else {
                await response.complete('fail');
                console.error('❌ Payment failed');
                
                // Show error message
                this.showPaymentError(result.error);
            }

        } catch (error) {
            await response.complete('fail');
            console.error('Payment processing error:', error);
        }
    }

    async sendPaymentToProcessor(response, details) {
        // Simulate API call to payment processor
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate success (in real app, this would be actual API call)
                resolve({
                    success: true,
                    transactionId: 'tx_' + Date.now(),
                    amount: details.amount
                });
            }, 2000);
        });
    }

    showPaymentFallback(details) {
        const modal = this.createModal('Proceso de Pago', `
            <div class="payment-fallback">
                <h4>${details.label || 'Total a pagar'}</h4>
                <p class="amount">$${details.amount} ${details.currency || 'MXN'}</p>
                <p>Para completar el pago, utiliza una de las siguientes opciones:</p>
                <div class="payment-options">
                    <button onclick="window.open('https://www.paypal.com', '_blank')">
                        PayPal
                    </button>
                    <button onclick="window.open('mailto:pagos@heroespatria.edu.mx?subject=Pago pendiente')">
                        Email
                    </button>
                    <button onclick="advancedAPIs.copyToClipboard('Transferencia: CLABE 123456789')">
                        Transferencia
                    </button>
                </div>
            </div>
        `);
    }

    showPaymentSuccess(result) {
        const modal = this.createModal('Pago Exitoso', `
            <div class="payment-success">
                <i class="fas fa-check-circle" style="color: green; font-size: 48px;"></i>
                <h4>¡Pago completado!</h4>
                <p>ID de transacción: ${result.transactionId}</p>
                <p>Monto: $${result.amount}</p>
                <button onclick="this.closest('.modal').remove()">Cerrar</button>
            </div>
        `);
    }

    showPaymentError(error) {
        const modal = this.createModal('Error de Pago', `
            <div class="payment-error">
                <i class="fas fa-times-circle" style="color: red; font-size: 48px;"></i>
                <h4>Error en el pago</h4>
                <p>${error || 'Ocurrió un error procesando el pago'}</p>
                <button onclick="this.closest('.modal').remove()">Cerrar</button>
            </div>
        `);
    }

    // === WEB LOCKS API ===
    setupWebLocks() {
        if (!this.features.webLocks) {
            console.warn('Web Locks API not supported');
            return;
        }

        //console.log('🔒 Web Locks API available');
    }

    async acquireLock(name, callback, options = {}) {
        if (!this.features.webLocks) {
            // Fallback: just execute the callback
            return callback();
        }

        try {
            return await navigator.locks.request(name, options, callback);
        } catch (error) {
            console.warn('Lock error:', error);
            throw error;
        }
    }

    async getLockInfo() {
        if (!this.features.webLocks) return null;

        try {
            const lockInfo = await navigator.locks.query();
            //console.log('🔒 Current locks:', lockInfo);
            return lockInfo;
        } catch (error) {
            console.warn('Error querying locks:', error);
            return null;
        }
    }

    // === UI HELPERS ===
    addAPIButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'advanced-apis-panel';
        buttonContainer.innerHTML = `
            <div class="api-buttons">
                <h4>🔮 APIs Avanzadas</h4>
                <div class="button-grid">
                    ${this.features.fileSystemAccess ? 
                        '<button onclick="advancedAPIs.openFile()" class="api-btn">📁 Abrir Archivo</button>' : 
                        '<button onclick="advancedAPIs.openFileFallback()" class="api-btn disabled">📁 Abrir (Fallback)</button>'}
                    
                    ${this.features.contactPicker ? 
                        '<button onclick="advancedAPIs.selectContacts()" class="api-btn">📱 Contactos</button>' : 
                        '<button onclick="advancedAPIs.showContactPickerFallback()" class="api-btn disabled">📱 Contactos (Manual)</button>'}
                    
                    ${this.features.paymentRequest ? 
                        '<button onclick="advancedAPIs.showPaymentDemo()" class="api-btn">💳 Pago</button>' : 
                        '<button onclick="advancedAPIs.showPaymentFallback({amount: 100, label: \'Demo\'})" class="api-btn disabled">💳 Pago (Fallback)</button>'}
                    
                    ${this.features.badging ? 
                        '<button onclick="advancedAPIs.incrementBadge()" class="api-btn">🔔 Badge +1</button>' : 
                        '<button class="api-btn disabled">🔔 Badge (No soportado)</button>'}
                    
                    <button onclick="advancedAPIs.showAPISupport()" class="api-btn">🔧 Soporte APIs</button>
                </div>
            </div>
        `;

        // Add styles
        this.injectAPIStyles();
        
        // Add to page
        document.body.appendChild(buttonContainer);
    }

    showPaymentDemo() {
        this.processPayment({
            amount: 100,
            currency: 'MXN',
            label: 'Pago de demostración',
            items: [
                {
                    label: 'Colegiatura',
                    amount: { currency: 'MXN', value: '100.00' }
                }
            ]
        });
    }

    showAPISupport() {
        const supported = this.getSupportedFeatures();
        const unsupported = Object.keys(this.features).filter(api => !this.features[api]);
        
        const modal = this.createModal('Soporte de APIs', `
            <div class="api-support">
                <h4>✅ APIs Soportadas (${supported.length})</h4>
                <ul>
                    ${supported.map(api => `<li class="supported">✅ ${api}</li>`).join('')}
                </ul>
                
                <h4>❌ APIs No Soportadas (${unsupported.length})</h4>
                <ul>
                    ${unsupported.map(api => `<li class="unsupported">❌ ${api}</li>`).join('')}
                </ul>
            </div>
        `);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal advanced-api-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            //console.log('📋 Copied to clipboard:', text);
            
            // Show feedback
            const feedback = document.createElement('div');
            feedback.className = 'copy-feedback';
            feedback.textContent = '✅ Copiado: ' + text;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.remove(), 3000);
        } catch (error) {
            console.warn('Error copying to clipboard:', error);
        }
    }

    injectAPIStyles() {
        if (document.querySelector('#advanced-api-styles')) return;

        const style = document.createElement('style');
        style.id = 'advanced-api-styles';
        style.textContent = `
            .advanced-apis-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 9999;
                max-width: 250px;
            }
            
            .advanced-apis-panel h4 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #333;
            }
            
            .button-grid {
                display: grid;
                gap: 8px;
            }
            
            .api-btn {
                padding: 8px 12px;
                border: 1px solid #007bff;
                background: #007bff;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
                text-align: left;
            }
            
            .api-btn:hover {
                background: #0056b3;
            }
            
            .api-btn.disabled {
                background: #6c757d;
                border-color: #6c757d;
                cursor: not-allowed;
                opacity: 0.6;
            }
            
            .advanced-api-modal .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
            }
            
            .advanced-api-modal .modal-content {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                max-width: 500px;
                width: 90vw;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 10001;
            }
            
            .modal-header {
                background: #f8f9fa;
                padding: 15px 20px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #6c757d;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .api-support ul {
                list-style: none;
                padding: 0;
            }
            
            .api-support li {
                padding: 5px 0;
                font-family: monospace;
            }
            
            .api-support .supported {
                color: #28a745;
            }
            
            .api-support .unsupported {
                color: #dc3545;
            }
            
            .payment-fallback, .payment-success, .payment-error {
                text-align: center;
            }
            
            .payment-fallback .amount {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin: 10px 0;
            }
            
            .payment-options {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 15px;
            }
            
            .payment-options button {
                padding: 10px 15px;
                border: 1px solid #007bff;
                background: #007bff;
                color: white;
                border-radius: 6px;
                cursor: pointer;
            }
            
            .copy-feedback {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #28a745;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                font-size: 14px;
                z-index: 10000;
                animation: fadeInOut 3s ease;
            }
            
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    // === PUBLIC API ===
    getStatus() {
        return {
            supportedAPIs: this.getSupportedFeatures(),
            badgeCount: this.badgeCount,
            fileHandlers: Array.from(this.fileHandlers.keys()),
            paymentMethods: this.paymentMethods?.length || 0
        };
    }
}

// Initialize
let advancedAPIs;

document.addEventListener('DOMContentLoaded', () => {
    advancedAPIs = new AdvancedWebAPIs();
    
    // Make globally accessible
    window.advancedAPIs = advancedAPIs;
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedWebAPIs;
}