/**
 * PAYMENT SYSTEM INTEGRATION - FASE 4
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema de pagos avanzado para materiales especiales y servicios adicionales
 */

class PaymentSystemManager {
    constructor() {
        this.providers = {
            stripe: new StripeIntegration(),
            paypal: new PayPalIntegration(),
            oxxoPay: new OXXOPayIntegration(),
            spei: new SPEIIntegration()
        };

        this.supportedMethods = [
            'credit_card',
            'debit_card',
            'oxxo',
            'seven_eleven',
            'spei',
            'paypal'
        ];

        this.currentTransaction = null;
        this.paymentHistory = [];
        this.currentSession = null;
        this.isLoggedIn = false;
        
        // Datos demo mejorados
        this.studentData = {
            studentId: '20230001',
            name: 'Ana María González Pérez',
            email: 'padre@demo.com',
            password: 'demo123',
            balance: 0.00,
            pendingPayments: [
                {
                    id: 'PAGO001',
                    concept: 'Credencial estudiantil',
                    period: 'Enero 2025',
                    dueDate: '2025-02-15',
                    amount: 50.00,
                    status: 'pending',
                    type: 'credencial'
                },
                {
                    id: 'PAGO002',
                    concept: 'Constancia de estudios',
                    period: 'Enero 2025',
                    dueDate: '2025-01-31',
                    amount: 30.00,
                    status: 'pending',
                    type: 'certificado'
                },
                {
                    id: 'PAGO003',
                    concept: 'Material de laboratorio',
                    period: 'Semestre 2025-1',
                    dueDate: '2025-02-28',
                    amount: 150.00,
                    status: 'pending',
                    type: 'materiales'
                }
            ],
            paymentHistory: [
                {
                    id: 'HIST001',
                    concept: 'Curso de regularización',
                    amount: 200.00,
                    paymentDate: '2024-12-15',
                    method: 'Tarjeta de Crédito',
                    reference: 'TXN123456789',
                    status: 'completed'
                }
            ]
        };
        
        this.init();
    }

    async init() {
        console.log('💳 Initializing Advanced Payment System...');
        
        // Initialize payment providers
        for (const [name, provider] of Object.entries(this.providers)) {
            try {
                await provider.init();
                console.log(`✅ ${name} payment provider initialized`);
            } catch (error) {
                console.warn(`⚠️ ${name} provider failed:`, error);
            }
        }

        this.setupEventListeners();
        this.loadPaymentHistory();
        this.initializeSystem();
    }

    setupEventListeners() {
        // Payment form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.advanced-payment-form')) {
                e.preventDefault();
                this.handlePaymentForm(e.target);
            }
        });

        // Payment method selection
        document.addEventListener('change', (e) => {
            if (e.target.matches('.payment-method-selector')) {
                this.handlePaymentMethodChange(e.target.value);
            }
        });

        // Quick payment buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-pay-btn') || e.target.closest('.quick-pay-btn')) {
                this.handleQuickPayment(e.target);
            }
        });

        // Legacy compatibility
        document.addEventListener('change', (e) => {
            if (e.target.name === 'paymentMethod') {
                this.updatePaymentForm(e.target.value);
            }
        });
    }

    loadPaymentHistory() {
        const stored = localStorage.getItem('advancedPaymentHistory');
        if (stored) {
            this.paymentHistory = JSON.parse(stored);
        }
    }

    // Método básico para manejar formularios (se extenderá más abajo)
    handlePaymentForm(form) {
        console.log('💳 Payment form submitted:', form);
    }

    // Método básico para cambio de método de pago (se extenderá más abajo)
    handlePaymentMethodChange(method) {
        console.log('💳 Payment method changed:', method);
    }

    // Método básico para pagos rápidos
    handleQuickPayment(element) {
        console.log('💳 Quick payment clicked:', element);
    }

    // Método de compatibilidad
    updatePaymentForm(method) {
        console.log('💳 Update payment form:', method);
    }

    initializeSystem() {
        // Verificar si hay una sesión activa
        const savedSession = localStorage.getItem('paymentSession');
        if (savedSession) {
            this.currentSession = JSON.parse(savedSession);
            if (this.currentSession.expires > Date.now()) {
                this.isLoggedIn = true;
                this.showPaymentPanel();
            } else {
                localStorage.removeItem('paymentSession');
            }
        }

        // Inicializar formularios de pago
        this.initializePaymentForms();
    }

    bindEvents() {
        // Event listeners para métodos de pago
        document.addEventListener('change', (e) => {
            if (e.target.name === 'paymentMethod') {
                this.updatePaymentForm(e.target.value);
            }
        });

        // Auto-resize para modales
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                this.adjustModalHeight(modal);
            });
        });
    }

    initializePaymentForms() {
        // Configurar formularios según método de pago
        this.paymentForms = {
            credit: `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label">Número de Tarjeta</label>
                        <input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Fecha de Vencimiento</label>
                        <input type="text" class="form-control" id="cardExpiry" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">CVV</label>
                        <input type="text" class="form-control" id="cardCvv" placeholder="123" maxlength="4">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Nombre del Tarjetahabiente</label>
                        <input type="text" class="form-control" id="cardName" placeholder="Como aparece en la tarjeta">
                    </div>
                </div>
            `,
            transfer: `
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle me-2"></i>Información para Transferencia</h6>
                    <p><strong>Banco:</strong> Bancomer BBVA</p>
                    <p><strong>Cuenta:</strong> 0112180012345678</p>
                    <p><strong>CLABE:</strong> 012180001234567890</p>
                    <p><strong>Beneficiario:</strong> BGE Héroes de la Patria</p>
                    <p class="mb-0"><strong>Referencia:</strong> <span id="transferReference"></span></p>
                </div>
                <div class="mb-3">
                    <label class="form-label">Número de Referencia de la Transferencia</label>
                    <input type="text" class="form-control" id="transferNumber" placeholder="Ingresa el número de referencia">
                </div>
            `,
            convenience: `
                <div class="alert alert-warning">
                    <h6><i class="fas fa-store me-2"></i>Pago en Tienda de Conveniencia</h6>
                    <p>Se generará un código de barras para pagar en:</p>
                    <ul>
                        <li>OXXO</li>
                        <li>7-Eleven</li>
                        <li>Circle K</li>
                        <li>Extra</li>
                    </ul>
                    <p class="mb-0"><strong>Vigencia del código:</strong> 3 días</p>
                </div>
                <div class="text-center">
                    <div id="barcodeDisplay" class="p-4 bg-light rounded">
                        <div class="mb-2">
                            <i class="fas fa-barcode fa-4x text-dark"></i>
                        </div>
                        <h5 id="barcodeNumber">9876543210987654</h5>
                        <p class="text-muted">Presenta este código en tienda</p>
                    </div>
                </div>
            `
        };
    }

    // Funciones de autenticación
    loginPaymentSystem() {
        const email = document.getElementById('paymentEmail').value;
        const studentId = document.getElementById('studentIdPayment').value;
        const password = document.getElementById('paymentPassword').value;

        // Validación simple (en producción sería más robusta)
        if (email === this.studentData.email && 
            studentId === this.studentData.studentId && 
            password === this.studentData.password) {
            
            // Crear sesión
            this.currentSession = {
                studentId: studentId,
                loginTime: Date.now(),
                expires: Date.now() + (2 * 60 * 60 * 1000) // 2 horas
            };

            localStorage.setItem('paymentSession', JSON.stringify(this.currentSession));
            this.isLoggedIn = true;

            // Cerrar modal y mostrar panel
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            this.showPaymentPanel();
            this.showSuccessToast('Sesión iniciada correctamente');
        } else {
            this.showErrorToast('Credenciales incorrectas');
        }
    }

    logoutPaymentSystem() {
        localStorage.removeItem('paymentSession');
        this.currentSession = null;
        this.isLoggedIn = false;
        this.hidePaymentPanel();
        this.showSuccessToast('Sesión cerrada');
    }

    showPaymentPanel() {
        // Ocultar hero section
        document.getElementById('hero').style.display = 'none';
        
        // Mostrar panel de pagos
        const paymentPanel = document.getElementById('paymentPanel');
        paymentPanel.classList.remove('d-none');
        
        // Cargar datos del estudiante
        document.getElementById('studentName').textContent = this.studentData.name;
        
        // Cargar tabla de pagos pendientes
        this.loadPendingPayments();
        
        // Scroll al panel
        paymentPanel.scrollIntoView({ behavior: 'smooth' });
    }

    hidePaymentPanel() {
        // Mostrar hero section
        document.getElementById('hero').style.display = 'block';
        
        // Ocultar panel de pagos
        document.getElementById('paymentPanel').classList.add('d-none');
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    loadPendingPayments() {
        const tbody = document.getElementById('pendingPaymentsTable');
        tbody.innerHTML = '';

        this.studentData.pendingPayments.forEach(payment => {
            const row = document.createElement('tr');
            const statusBadge = payment.status === 'pending' ? 
                '<span class="badge bg-warning">Pendiente</span>' : 
                '<span class="badge bg-success">Pagado</span>';
            
            const dueDate = new Date(payment.dueDate);
            const isOverdue = dueDate < new Date();
            const dueDateClass = isOverdue ? 'text-danger fw-bold' : '';

            row.innerHTML = `
                <td>${payment.concept}</td>
                <td>${payment.period}</td>
                <td class="${dueDateClass}">${this.formatDate(payment.dueDate)}</td>
                <td class="fw-bold">$${payment.amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="paymentSystem.startPaymentProcess('${payment.id}')">
                        <i class="fas fa-credit-card me-1"></i>Pagar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    startPaymentProcess(paymentId) {
        const payment = this.studentData.pendingPayments.find(p => p.id === paymentId);
        if (!payment) return;

        this.currentPayment = payment;
        
        // Llenar detalles del pago
        const paymentDetails = document.getElementById('paymentDetails');
        paymentDetails.innerHTML = `
            <div class="card border-primary">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">Detalles del Pago</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Concepto:</strong> ${payment.concept}</p>
                            <p><strong>Periodo:</strong> ${payment.period}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Vencimiento:</strong> ${this.formatDate(payment.dueDate)}</p>
                            <p><strong>Monto:</strong> <span class="h4 text-success">$${payment.amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inicializar formulario de pago
        this.updatePaymentForm('credit');

        // Mostrar modal
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    }

    updatePaymentForm(method) {
        const paymentForm = document.getElementById('paymentForm');
        paymentForm.innerHTML = this.paymentForms[method];

        // Configurar eventos específicos para cada método
        if (method === 'credit') {
            this.setupCreditCardForm();
        } else if (method === 'transfer') {
            document.getElementById('transferReference').textContent = 
                `${this.currentPayment.id}-${this.studentData.studentId}`;
        }
    }

    setupCreditCardForm() {
        // Formatear número de tarjeta
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = value;
            });
        }

        // Formatear fecha de vencimiento
        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
    }

    processPayment() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Validar formulario según método
        if (!this.validatePaymentForm(selectedMethod)) {
            return;
        }

        // Simular procesamiento de pago
        this.showLoadingState();
        
        setTimeout(() => {
            this.completePayment();
        }, 2000);
    }

    validatePaymentForm(method) {
        switch (method) {
            case 'credit':
                const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
                const cardExpiry = document.getElementById('cardExpiry').value;
                const cardCvv = document.getElementById('cardCvv').value;
                const cardName = document.getElementById('cardName').value;

                if (cardNumber.length < 15 || cardExpiry.length < 5 || cardCvv.length < 3 || !cardName.trim()) {
                    this.showErrorToast('Por favor completa todos los campos de la tarjeta');
                    return false;
                }
                break;
            
            case 'transfer':
                const transferNumber = document.getElementById('transferNumber').value;
                if (!transferNumber.trim()) {
                    this.showErrorToast('Ingresa el número de referencia de la transferencia');
                    return false;
                }
                break;
        }
        return true;
    }

    showLoadingState() {
        const paymentModal = document.querySelector('#paymentModal .modal-footer');
        paymentModal.innerHTML = `
            <button class="btn btn-primary" disabled>
                <i class="fas fa-spinner fa-spin me-2"></i>Procesando pago...
            </button>
        `;
    }

    completePayment() {
        // Mover pago de pendientes a historial
        const paymentIndex = this.studentData.pendingPayments.findIndex(p => p.id === this.currentPayment.id);
        if (paymentIndex !== -1) {
            const completedPayment = this.studentData.pendingPayments[paymentIndex];
            completedPayment.status = 'completed';
            completedPayment.paymentDate = new Date().toISOString().split('T')[0];
            completedPayment.reference = this.generateTransactionReference();
            
            // Mover a historial
            this.studentData.paymentHistory.unshift(completedPayment);
            this.studentData.pendingPayments.splice(paymentIndex, 1);
        }

        // Cerrar modal
        const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        paymentModal.hide();

        // Recargar tabla
        this.loadPendingPayments();

        // Mostrar confirmación
        this.showPaymentConfirmation();
    }

    showPaymentConfirmation() {
        const confirmationHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <h5><i class="fas fa-check-circle me-2"></i>¡Pago Exitoso!</h5>
                <p><strong>Concepto:</strong> ${this.currentPayment.concept}</p>
                <p><strong>Monto:</strong> $${this.currentPayment.amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                <p><strong>Referencia:</strong> ${this.generateTransactionReference()}</p>
                <p class="mb-0">Tu comprobante ha sido enviado por email.</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        const paymentPanel = document.getElementById('paymentPanel');
        paymentPanel.insertAdjacentHTML('afterbegin', confirmationHTML);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            const alert = paymentPanel.querySelector('.alert-success');
            if (alert) {
                alert.remove();
            }
        }, 10000);
    }

    consultPaymentStatus() {
        const studentId = document.getElementById('consultStudentId').value;
        const month = document.getElementById('consultMonth').value;

        if (!studentId || !month) {
            this.showErrorToast('Por favor completa todos los campos');
            return;
        }

        // Simular consulta
        setTimeout(() => {
            this.showConsultationResults(studentId, month);
        }, 1000);
    }

    showConsultationResults(studentId, month) {
        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
            '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
            '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };

        const resultsHTML = `
            <hr>
            <h6>Resultado de la Consulta</h6>
            <div class="alert alert-info">
                <p><strong>Estudiante:</strong> ${studentId}</p>
                <p><strong>Mes:</strong> ${monthNames[month]} 2024</p>
                <p><strong>Estado:</strong> <span class="badge bg-warning">Pago Pendiente</span></p>
                <p class="mb-0"><strong>Monto:</strong> $2,500.00</p>
            </div>
        `;

        document.getElementById('consultForm').insertAdjacentHTML('afterend', resultsHTML);
    }

    // Funciones auxiliares
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            timeZone: 'America/Mexico_City'
        };
        return date.toLocaleDateString('es-MX', options);
    }

    generateTransactionReference() {
        return 'TXN' + Date.now().toString().substr(-10);
    }

    adjustModalHeight(modal) {
        const modalDialog = modal.querySelector('.modal-dialog');
        const maxHeight = window.innerHeight * 0.9;
        modalDialog.style.maxHeight = maxHeight + 'px';
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'danger');
    }

    showToast(message, type = 'info') {
        // Crear contenedor de toasts si no existe
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Crear toast
        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-bg-${type} border-0`;
        toastElement.setAttribute('role', 'alert');
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastElement);
        
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();

        // Limpiar después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Funciones globales para los event handlers
let paymentSystem;

function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

function showConsultModal() {
    const consultModal = new bootstrap.Modal(document.getElementById('consultModal'));
    consultModal.show();
}

function loginPaymentSystem() {
    paymentSystem.loginPaymentSystem();
}

function consultPaymentStatus() {
    paymentSystem.consultPaymentStatus();
}

function processPayment() {
    paymentSystem.processPayment();
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Mantener compatibilidad con el sistema original
    if (typeof PaymentSystem !== 'undefined') {
        window.paymentSystem = new PaymentSystem();
    }
});

// Estilos adicionales para el sistema de pagos
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
    .payment-service-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .payment-service-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    .price-tag {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        display: inline-block;
        margin-top: 10px;
    }
    
    .payment-method-card {
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }
    
    .payment-method-card.selected {
        border-color: var(--bs-primary);
        background-color: rgba(13, 110, 253, 0.1);
    }
    
    .btn-check:checked + .btn-outline-primary {
        background-color: var(--bs-primary);
        color: white;
    }
    
    .btn-check:checked + .btn-outline-success {
        background-color: var(--bs-success);
        color: white;
    }
    
    .btn-check:checked + .btn-outline-warning {
        background-color: var(--bs-warning);
        color: white;
    }
    
    /* Dark mode support */
    .dark-mode .card {
        background-color: #2d3748;
        border-color: #4a5568;
    }
    
    .dark-mode .table {
        color: #f7fafc;
    }
    
    .dark-mode .table-light th {
        background-color: #4a5568;
        color: #f7fafc;
        border-color: #718096;
    }
    
    .dark-mode .modal-content {
        background-color: #2d3748;
        color: #f7fafc;
    }
    
    .dark-mode .form-control {
        background-color: #4a5568;
        border-color: #718096;
        color: #f7fafc;
    }
    
    .dark-mode .form-control:focus {
        background-color: #4a5568;
        border-color: var(--bs-primary);
        color: #f7fafc;
    }
`;
document.head.appendChild(paymentStyles);

// ===== ADVANCED PAYMENT SYSTEM EXTENSIONS - FASE 4 =====

// Advanced payment integrations for Phase 4
class StripeIntegration {
    constructor() {
        this.publishableKey = 'pk_test_YOUR_STRIPE_KEY'; // Replace with actual key
        this.stripe = null;
    }

    async init() {
        // Mock initialization for demo
        console.log('💳 Stripe integration initialized');
    }

    async processCardPayment(paymentData) {
        // Mock Stripe processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            reference: 'STRIPE_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            type: 'immediate'
        };
    }
}

class PayPalIntegration {
    constructor() {
        this.clientId = 'YOUR_PAYPAL_CLIENT_ID';
    }

    async init() {
        console.log('🟡 PayPal integration initialized');
    }

    async processPayment(paymentData) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            success: true,
            reference: 'PAYPAL_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            type: 'immediate'
        };
    }
}

class OXXOPayIntegration {
    async init() {
        console.log('🏪 OXXO Pay integration initialized');
    }

    async generatePaymentCode(paymentData) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            reference: 'OXXO' + Math.random().toString().substring(2, 12),
            type: 'pending',
            method: 'oxxo'
        };
    }
}

class SPEIIntegration {
    async init() {
        console.log('🏦 SPEI integration initialized');
    }

    async generateReference(paymentData) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            success: true,
            reference: 'SPEI' + Math.random().toString().substring(2, 12),
            clabe: '012180001234567890',
            bank: 'BBVA Bancomer',
            type: 'pending',
            method: 'spei'
        };
    }
}

// Advanced Payment Methods Handler
PaymentSystemManager.prototype.handleAdvancedPayment = function(paymentData) {
    const method = paymentData.payment_method;
    
    // Create advanced transaction
    this.currentTransaction = {
        id: this.generateAdvancedTransactionId(),
        amount: parseFloat(paymentData.amount),
        concept: paymentData.concept || 'Pago de servicios escolares',
        method: method,
        timestamp: Date.now(),
        status: 'processing',
        studentId: paymentData.student_id,
        email: paymentData.email
    };

    return this.processAdvancedPayment(paymentData);
};

PaymentSystemManager.prototype.processAdvancedPayment = async function(paymentData) {
    const method = paymentData.payment_method;
    
    try {
        switch (method) {
            case 'credit_card':
            case 'debit_card':
                return await this.providers.stripe.processCardPayment(paymentData);
            
            case 'paypal':
                return await this.providers.paypal.processPayment(paymentData);
            
            case 'oxxo':
            case 'seven_eleven':
                return await this.providers.oxxoPay.generatePaymentCode(paymentData);
            
            case 'spei':
                return await this.providers.spei.generateReference(paymentData);
            
            default:
                throw new Error('Método de pago no soportado');
        }
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        throw error;
    }
};

PaymentSystemManager.prototype.generateAdvancedTransactionId = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `HDP_${timestamp}_${random}`.toUpperCase();
};

PaymentSystemManager.prototype.showAdvancedPaymentModal = function(paymentId) {
    const payment = this.studentData.pendingPayments.find(p => p.id === paymentId);
    if (!payment) return;

    this.currentPayment = payment;
    
    const modalHTML = `
        <div class="modal fade" id="advancedPaymentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">💳 Pagar: ${payment.concept}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card border-primary mb-3">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0">📋 Detalles del Pago</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>Concepto:</strong> ${payment.concept}</p>
                                        <p><strong>Periodo:</strong> ${payment.period}</p>
                                        <p><strong>Vencimiento:</strong> ${this.formatDate(payment.dueDate)}</p>
                                        <p class="mb-0"><strong>Monto:</strong> <span class="h4 text-success">$${payment.amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span></p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <form class="advanced-payment-form">
                                    <input type="hidden" name="payment_id" value="${payment.id}">
                                    <input type="hidden" name="amount" value="${payment.amount}">
                                    <input type="hidden" name="concept" value="${payment.concept}">
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Método de pago</label>
                                        <select class="form-select payment-method-selector" name="payment_method" required>
                                            <option value="">Selecciona método</option>
                                            <option value="credit_card">💳 Tarjeta de crédito</option>
                                            <option value="oxxo">🏪 OXXO</option>
                                            <option value="spei">🏦 Transferencia SPEI</option>
                                            <option value="paypal">🟡 PayPal</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" name="email" value="${this.studentData.email}" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">ID de estudiante</label>
                                        <input type="text" class="form-control" name="student_id" value="${this.studentData.studentId}" readonly>
                                    </div>
                                    
                                    <div id="advanced-payment-fields"></div>
                                    
                                    <button type="submit" class="btn btn-primary btn-lg w-100">
                                        <i class="fas fa-credit-card me-2"></i>Procesar Pago
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('advancedPaymentModal');
    if (existingModal) existingModal.remove();
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('advancedPaymentModal'));
    modal.show();
};

// Update payment method fields for advanced forms
PaymentSystemManager.prototype.handlePaymentMethodChange = function(method) {
    const fieldsContainer = document.getElementById('advanced-payment-fields');
    if (!fieldsContainer) return;

    fieldsContainer.innerHTML = '';

    switch (method) {
        case 'credit_card':
        case 'debit_card':
            fieldsContainer.innerHTML = `
                <div class="row g-3 mb-3">
                    <div class="col-12">
                        <label class="form-label">Número de tarjeta</label>
                        <input type="text" class="form-control card-number" name="card_number" 
                               placeholder="1234 5678 9012 3456" maxlength="19" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label">MM/AA</label>
                        <input type="text" class="form-control expiry-date" name="expiry" 
                               placeholder="12/25" maxlength="5" required>
                    </div>
                    <div class="col-6">
                        <label class="form-label">CVV</label>
                        <input type="text" class="form-control cvv" name="cvv" 
                               placeholder="123" maxlength="4" required>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Nombre en la tarjeta</label>
                        <input type="text" class="form-control" name="cardholder_name" required>
                    </div>
                </div>
            `;
            this.setupCardFormatting(fieldsContainer);
            break;

        case 'oxxo':
            fieldsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-store me-2"></i>
                    Se generará un código de barras para pagar en cualquier tienda OXXO.
                    <br><small>El código será válido por 3 días.</small>
                </div>
            `;
            break;

        case 'spei':
            fieldsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-university me-2"></i>
                    Se generará una referencia SPEI para transferencia bancaria.
                    <br><small>Transferencia disponible 24/7 desde tu banco en línea.</small>
                </div>
            `;
            break;

        case 'paypal':
            fieldsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fab fa-paypal me-2"></i>
                    Serás redirigido a PayPal para completar el pago de forma segura.
                </div>
            `;
            break;
    }
};

// Setup card formatting
PaymentSystemManager.prototype.setupCardFormatting = function(container) {
    const cardNumber = container.querySelector('.card-number');
    const expiryDate = container.querySelector('.expiry-date');
    const cvv = container.querySelector('.cvv');

    // Format card number
    cardNumber?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
    });

    // Format expiry date
    expiryDate?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });

    // CVV numeric only
    cvv?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
};

// Handle advanced payment form submission
PaymentSystemManager.prototype.handlePaymentForm = async function(form) {
    const formData = new FormData(form);
    const paymentData = Object.fromEntries(formData.entries());
    
    try {
        this.showPaymentLoader(true);
        
        const result = await this.handleAdvancedPayment(paymentData);
        
        if (result.success) {
            this.handlePaymentSuccess(result);
        } else {
            this.handlePaymentError(result.error);
        }
    } catch (error) {
        this.handlePaymentError(error.message);
    } finally {
        this.showPaymentLoader(false);
    }
};

PaymentSystemManager.prototype.showPaymentLoader = function(show) {
    const loader = document.querySelector('.advanced-payment-loader');
    
    if (show) {
        if (!loader) {
            const loaderEl = document.createElement('div');
            loaderEl.className = 'advanced-payment-loader position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            loaderEl.style.cssText = 'background: rgba(0,0,0,0.7); z-index: 2000;';
            loaderEl.innerHTML = `
                <div class="text-center text-white">
                    <div class="spinner-border mb-3" role="status">
                        <span class="visually-hidden">Procesando...</span>
                    </div>
                    <p>💳 Procesando tu pago...</p>
                </div>
            `;
            document.body.appendChild(loaderEl);
        }
    } else {
        loader?.remove();
    }
};

PaymentSystemManager.prototype.handlePaymentSuccess = function(result) {
    this.currentTransaction.status = 'completed';
    this.currentTransaction.reference = result.reference;
    this.currentTransaction.completedAt = Date.now();

    // Save to history
    this.paymentHistory.push({ ...this.currentTransaction });
    this.savePaymentHistory();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('advancedPaymentModal'));
    modal?.hide();

    // Show success message
    this.showAdvancedPaymentResult(true, result);

    // Update payment list if exists
    this.loadPendingPayments?.();
};

PaymentSystemManager.prototype.handlePaymentError = function(error) {
    if (this.currentTransaction) {
        this.currentTransaction.status = 'failed';
        this.currentTransaction.error = error;
    }

    this.showAdvancedPaymentResult(false, { error });
};

PaymentSystemManager.prototype.showAdvancedPaymentResult = function(success, result) {
    const modal = document.createElement('div');
    modal.className = 'modal fade show d-block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    
    const iconClass = success ? 'fa-check-circle text-success' : 'fa-times-circle text-danger';
    const title = success ? '¡Pago Exitoso!' : 'Error en el Pago';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 text-center">
                    <div class="w-100">
                        <i class="fas ${iconClass} fa-3x mb-3"></i>
                        <h4 class="modal-title">${title}</h4>
                    </div>
                    <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    ${success ? this.getSuccessContent(result) : this.getErrorContent(result)}
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                    ${success ? '<button type="button" class="btn btn-primary" onclick="window.paymentSystem.downloadReceipt?.()">📄 Descargar Comprobante</button>' : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

PaymentSystemManager.prototype.getSuccessContent = function(result) {
    if (result.type === 'immediate') {
        return `
            <div class="text-center">
                <p class="mb-3">Tu pago se ha procesado exitosamente.</p>
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>📋 Detalles del pago</h6>
                        <p class="mb-1"><strong>Referencia:</strong> ${result.reference}</p>
                        <p class="mb-1"><strong>Monto:</strong> $${this.currentTransaction.amount}</p>
                        <p class="mb-0"><strong>Concepto:</strong> ${this.currentTransaction.concept}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="text-center">
                <p class="mb-3">Tu referencia de pago ha sido generada.</p>
                <div class="card bg-light">
                    <div class="card-body">
                        <h6>📋 Instrucciones de pago</h6>
                        ${this.getPaymentInstructions(result)}
                    </div>
                </div>
            </div>
        `;
    }
};

PaymentSystemManager.prototype.getErrorContent = function(result) {
    return `
        <div class="text-center">
            <p class="text-danger mb-3">No se pudo procesar el pago.</p>
            <div class="alert alert-danger">
                <strong>Error:</strong> ${result.error}
            </div>
            <p><small class="text-muted">Por favor, verifica tus datos e intenta nuevamente.</small></p>
        </div>
    `;
};

PaymentSystemManager.prototype.getPaymentInstructions = function(result) {
    switch (result.method) {
        case 'oxxo':
            return `
                <div class="text-center">
                    <div class="mb-3 p-3 bg-white rounded border">
                        <i class="fas fa-barcode fa-3x"></i>
                        <p class="mt-2 mb-0">Código de barras</p>
                    </div>
                    <p><strong>Referencia:</strong> ${result.reference}</p>
                    <p><strong>Monto:</strong> $${this.currentTransaction.amount}</p>
                    <p class="small">Presenta este código en cualquier tienda OXXO para completar tu pago.</p>
                </div>
            `;
            
        case 'spei':
            return `
                <p><strong>Banco:</strong> ${result.bank}</p>
                <p><strong>CLABE:</strong> ${result.clabe}</p>
                <p><strong>Referencia:</strong> ${result.reference}</p>
                <p><strong>Monto:</strong> $${this.currentTransaction.amount}</p>
                <p class="small">Realiza la transferencia SPEI con estos datos desde tu banco.</p>
            `;
            
        default:
            return `<p>Sigue las instrucciones proporcionadas para completar tu pago.</p>`;
    }
};

PaymentSystemManager.prototype.loadPaymentHistory = function() {
    const stored = localStorage.getItem('advancedPaymentHistory');
    if (stored) {
        this.paymentHistory = JSON.parse(stored);
    }
};

PaymentSystemManager.prototype.savePaymentHistory = function() {
    localStorage.setItem('advancedPaymentHistory', JSON.stringify(this.paymentHistory));
};

// Create global advanced payment system instance
window.addEventListener('DOMContentLoaded', () => {
    if (!window.paymentSystem || typeof window.paymentSystem.handleAdvancedPayment !== 'function') {
        window.advancedPaymentSystem = new PaymentSystemManager();
    }
});

// Helper function to show advanced payment modal
function showAdvancedPayment(paymentId) {
    if (window.advancedPaymentSystem) {
        window.advancedPaymentSystem.showAdvancedPaymentModal(paymentId);
    } else if (window.paymentSystem) {
        // Fallback to existing system
        window.paymentSystem.startPaymentProcess(paymentId);
    }
}

// Add payment system integration to existing cards
document.addEventListener('DOMContentLoaded', () => {
    // Add advanced payment buttons to existing payment cards
    const paymentCards = document.querySelectorAll('.payment-service-card');
    paymentCards.forEach((card, index) => {
        const payButton = card.querySelector('.btn-primary');
        if (payButton && !payButton.onclick) {
            const concepts = ['Credencial estudiantil', 'Constancia de estudios', 'Certificado parcial'];
            const amounts = [50, 30, 80];
            
            payButton.onclick = (e) => {
                e.preventDefault();
                if (window.advancedPaymentSystem) {
                    // Create mock payment for demo
                    const mockPayment = {
                        id: 'DEMO_' + (index + 1),
                        concept: concepts[index] || 'Servicio educativo',
                        period: 'Enero 2025',
                        dueDate: '2025-02-15',
                        amount: amounts[index] || 50,
                        status: 'pending',
                        type: 'servicio'
                    };
                    
                    // Add to pending payments temporarily
                    window.advancedPaymentSystem.studentData.pendingPayments.push(mockPayment);
                    window.advancedPaymentSystem.showAdvancedPaymentModal(mockPayment.id);
                } else {
                    showLoginModal();
                }
            };
        }
    });
});