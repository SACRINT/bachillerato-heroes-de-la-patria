/**
 * 💳 PAYMENT SYSTEM ADVANCED - Sistema de Pagos Avanzado
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de pagos en línea con múltiples proveedores
 */

class PaymentSystemAdvanced {
    constructor() {
        this.providers = {
            stripe: new StripeProvider(),
            paypal: new PayPalProvider(),
            mercadopago: new MercadoPagoProvider(),
            oxxo: new OXXOProvider(),
            spei: new SPEIProvider()
        };
        
        this.config = {
            currency: 'MXN',
            locale: 'es-MX',
            enabledProviders: ['stripe', 'paypal', 'oxxo', 'spei'],
            fees: {
                stripe: 0.036, // 3.6% + $3 MXN
                paypal: 0.045, // 4.5% + $5 MXN
                mercadopago: 0.041, // 4.1% + $4 MXN
                oxxo: 10, // $10 MXN fijo
                spei: 5 // $5 MXN fijo
            },
            limits: {
                min: 50, // $50 MXN
                max: 50000, // $50,000 MXN
                daily: 100000 // $100,000 MXN por día
            }
        };
        
        this.transactions = new Map();
        this.receipts = new Map();
        
        this.metrics = {
            totalTransactions: 0,
            successfulPayments: 0,
            failedPayments: 0,
            totalAmount: 0,
            averageAmount: 0,
            conversionRate: 0,
            refunds: 0
        };
        
        this.paymentItems = {
            inscripcion: { name: 'Inscripción', price: 2500, description: 'Inscripción al ciclo escolar' },
            colegiatura: { name: 'Colegiatura mensual', price: 1800, description: 'Pago mensual de colegiatura' },
            examen: { name: 'Examen de admisión', price: 300, description: 'Cuota de examen de admisión' },
            constancia: { name: 'Constancia de estudios', price: 150, description: 'Constancia oficial de estudios' },
            certificado: { name: 'Certificado de bachillerato', price: 500, description: 'Certificado oficial de bachillerato' },
            credencial: { name: 'Credencial estudiantil', price: 100, description: 'Credencial de estudiante' },
            seguro: { name: 'Seguro escolar', price: 400, description: 'Seguro estudiantil anual' }
        };
        
        this.init();
    }

    async init() {
        //console.log('💳 Iniciando Payment System Advanced...');
        
        // Inicializar proveedores de pago
        for (const [name, provider] of Object.entries(this.providers)) {
            if (this.config.enabledProviders.includes(name)) {
                try {
                    await provider.init();
                    //console.log(`✅ ${name} provider inicializado`);
                } catch (error) {
                    console.warn(`⚠️ Error inicializando ${name}:`, error);
                }
            }
        }
        
        // Setup de interfaz de usuario
        this.setupPaymentUI();
        this.setupEventListeners();
        this.loadSavedTransactions();
        
        //console.log('✅ Payment System Advanced inicializado');
    }

    setupPaymentUI() {
        // Crear elementos de UI para pagos
        this.createPaymentModal();
        this.createReceiptModal();
        this.setupPaymentButtons();
    }

    createPaymentModal() {
        const modal = document.createElement('div');
        modal.id = 'payment-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">💳 Realizar Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${this.getPaymentModalHTML()}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    getPaymentModalHTML() {
        return `
            <div class="payment-wizard">
                <!-- Step 1: Selección de servicio -->
                <div class="payment-step active" data-step="1">
                    <h6>1. Selecciona el servicio a pagar</h6>
                    <div class="payment-services">
                        ${Object.entries(this.paymentItems).map(([key, item]) => `
                            <div class="service-card" data-service="${key}">
                                <div class="service-info">
                                    <h6>${item.name}</h6>
                                    <p class="text-muted">${item.description}</p>
                                    <div class="service-price">$${item.price.toLocaleString('es-MX')} MXN</div>
                                </div>
                                <div class="service-select">
                                    <input type="radio" name="service" value="${key}" id="service-${key}">
                                    <label for="service-${key}"></label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="step-buttons">
                        <button class="btn btn-primary next-step" disabled>Continuar</button>
                    </div>
                </div>

                <!-- Step 2: Información del estudiante -->
                <div class="payment-step" data-step="2">
                    <h6>2. Información del estudiante</h6>
                    <form class="student-info-form">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Nombre completo *</label>
                                <input type="text" class="form-control" name="studentName" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Matrícula</label>
                                <input type="text" class="form-control" name="studentId" placeholder="Opcional">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Email *</label>
                                <input type="email" class="form-control" name="email" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Teléfono *</label>
                                <input type="tel" class="form-control" name="phone" required>
                            </div>
                            <div class="col-12 mb-3">
                                <label class="form-label">Dirección</label>
                                <textarea class="form-control" name="address" rows="2"></textarea>
                            </div>
                        </div>
                    </form>
                    <div class="step-buttons">
                        <button class="btn btn-outline-secondary prev-step">Anterior</button>
                        <button class="btn btn-primary next-step">Continuar</button>
                    </div>
                </div>

                <!-- Step 3: Método de pago -->
                <div class="payment-step" data-step="3">
                    <h6>3. Método de pago</h6>
                    <div class="payment-methods">
                        <div class="payment-method" data-method="stripe">
                            <div class="method-info">
                                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stripe/stripe-original.svg" width="40" alt="Stripe">
                                <div>
                                    <h6>Tarjeta de Crédito/Débito</h6>
                                    <p class="text-muted">Visa, MasterCard, American Express</p>
                                </div>
                            </div>
                            <div class="method-fee">+ 3.6%</div>
                        </div>
                        <div class="payment-method" data-method="paypal">
                            <div class="method-info">
                                <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" width="40" alt="PayPal">
                                <div>
                                    <h6>PayPal</h6>
                                    <p class="text-muted">Paga con tu cuenta PayPal</p>
                                </div>
                            </div>
                            <div class="method-fee">+ 4.5%</div>
                        </div>
                        <div class="payment-method" data-method="oxxo">
                            <div class="method-info">
                                <div class="oxxo-logo">OXXO</div>
                                <div>
                                    <h6>OXXO</h6>
                                    <p class="text-muted">Paga en efectivo en cualquier OXXO</p>
                                </div>
                            </div>
                            <div class="method-fee">+ $10</div>
                        </div>
                        <div class="payment-method" data-method="spei">
                            <div class="method-info">
                                <div class="spei-logo">🏦</div>
                                <div>
                                    <h6>Transferencia SPEI</h6>
                                    <p class="text-muted">Transferencia bancaria electrónica</p>
                                </div>
                            </div>
                            <div class="method-fee">+ $5</div>
                        </div>
                    </div>
                    <div class="step-buttons">
                        <button class="btn btn-outline-secondary prev-step">Anterior</button>
                        <button class="btn btn-primary next-step" disabled>Continuar</button>
                    </div>
                </div>

                <!-- Step 4: Confirmación y pago -->
                <div class="payment-step" data-step="4">
                    <h6>4. Confirmación de pago</h6>
                    <div class="payment-summary">
                        <div class="summary-card">
                            <div class="summary-item">
                                <span>Servicio:</span>
                                <span class="service-name">-</span>
                            </div>
                            <div class="summary-item">
                                <span>Estudiante:</span>
                                <span class="student-name">-</span>
                            </div>
                            <div class="summary-item">
                                <span>Método:</span>
                                <span class="payment-method-name">-</span>
                            </div>
                            <div class="summary-item">
                                <span>Subtotal:</span>
                                <span class="subtotal">$0</span>
                            </div>
                            <div class="summary-item">
                                <span>Comisión:</span>
                                <span class="fee">$0</span>
                            </div>
                            <div class="summary-item total">
                                <span>Total:</span>
                                <span class="total-amount">$0</span>
                            </div>
                        </div>
                        <div class="payment-form-container">
                            <!-- Aquí se insertará el formulario específico del proveedor -->
                        </div>
                    </div>
                    <div class="step-buttons">
                        <button class="btn btn-outline-secondary prev-step">Anterior</button>
                        <button class="btn btn-success process-payment" disabled>
                            <i class="fas fa-lock"></i> Procesar Pago
                        </button>
                    </div>
                </div>

                <!-- Loading state -->
                <div class="payment-loading" style="display: none;">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary mb-3" role="status"></div>
                        <h6>Procesando pago...</h6>
                        <p class="text-muted">Por favor espera, no cierres esta ventana</p>
                    </div>
                </div>

                <!-- Success state -->
                <div class="payment-success" style="display: none;">
                    <div class="text-center py-5">
                        <div class="success-icon mb-3">✅</div>
                        <h4 class="text-success">¡Pago exitoso!</h4>
                        <p>Tu pago ha sido procesado correctamente.</p>
                        <div class="receipt-info mt-3">
                            <p><strong>ID de transacción:</strong> <span class="transaction-id">-</span></p>
                            <p><strong>Referencia:</strong> <span class="reference">-</span></p>
                        </div>
                        <div class="success-buttons mt-4">
                            <button class="btn btn-primary download-receipt">Descargar comprobante</button>
                            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>

                <!-- Error state -->
                <div class="payment-error" style="display: none;">
                    <div class="text-center py-5">
                        <div class="error-icon mb-3">❌</div>
                        <h4 class="text-danger">Error en el pago</h4>
                        <p class="error-message">Hubo un problema procesando tu pago.</p>
                        <div class="error-buttons mt-4">
                            <button class="btn btn-primary retry-payment">Reintentar</button>
                            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createReceiptModal() {
        const modal = document.createElement('div');
        modal.id = 'receipt-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">🧾 Comprobante de Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="receipt-content">
                            <!-- El comprobante se generará dinámicamente -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary print-receipt">Imprimir</button>
                        <button class="btn btn-outline-secondary download-receipt-pdf">Descargar PDF</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupPaymentButtons() {
        // Agregar botones de pago en elementos con data-payment
        document.querySelectorAll('[data-payment]').forEach(element => {
            const service = element.dataset.payment;
            const button = document.createElement('button');
            button.className = 'btn btn-success payment-trigger';
            button.innerHTML = '<i class="fas fa-credit-card"></i> Pagar ahora';
            button.onclick = () => this.showPaymentModal(service);
            
            element.appendChild(button);
        });
    }

    setupEventListeners() {
        // Event listeners para el wizard de pagos
        document.addEventListener('click', (e) => {
            // Navegación del wizard
            if (e.target.matches('.next-step')) {
                this.nextStep();
            } else if (e.target.matches('.prev-step')) {
                this.prevStep();
            }
            
            // Selección de servicio
            else if (e.target.matches('.service-card')) {
                this.selectService(e.target);
            }
            
            // Selección de método de pago
            else if (e.target.matches('.payment-method')) {
                this.selectPaymentMethod(e.target);
            }
            
            // Procesamiento del pago
            else if (e.target.matches('.process-payment')) {
                this.processPayment();
            }
            
            // Botones de resultado
            else if (e.target.matches('.retry-payment')) {
                this.retryPayment();
            } else if (e.target.matches('.download-receipt')) {
                this.downloadReceipt();
            }
        });

        // Validación de formularios
        document.addEventListener('input', (e) => {
            if (e.target.closest('.student-info-form')) {
                this.validateStudentForm();
            }
        });

        // Selección de servicio con radio buttons
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[name="service"]')) {
                this.updateServiceSelection();
            }
        });
    }

    // ============================================
    // WIZARD NAVIGATION
    // ============================================

    nextStep() {
        const currentStep = document.querySelector('.payment-step.active');
        const stepNumber = parseInt(currentStep.dataset.step);
        
        // Validar paso actual
        if (!this.validateCurrentStep(stepNumber)) {
            return;
        }
        
        // Ocultar paso actual
        currentStep.classList.remove('active');
        
        // Mostrar siguiente paso
        const nextStep = document.querySelector(`[data-step="${stepNumber + 1}"]`);
        if (nextStep) {
            nextStep.classList.add('active');
            
            // Actualizar resumen si estamos en el paso final
            if (stepNumber + 1 === 4) {
                this.updatePaymentSummary();
            }
        }
    }

    prevStep() {
        const currentStep = document.querySelector('.payment-step.active');
        const stepNumber = parseInt(currentStep.dataset.step);
        
        // Ocultar paso actual
        currentStep.classList.remove('active');
        
        // Mostrar paso anterior
        const prevStep = document.querySelector(`[data-step="${stepNumber - 1}"]`);
        if (prevStep) {
            prevStep.classList.add('active');
        }
    }

    validateCurrentStep(stepNumber) {
        switch (stepNumber) {
            case 1:
                return document.querySelector('input[name="service"]:checked') !== null;
            case 2:
                return this.validateStudentForm();
            case 3:
                return document.querySelector('.payment-method.selected') !== null;
            default:
                return true;
        }
    }

    validateStudentForm() {
        const form = document.querySelector('.student-info-form');
        const required = form.querySelectorAll('[required]');
        let valid = true;
        
        required.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        // Habilitar/deshabilitar botón next
        const nextButton = document.querySelector('[data-step="2"] .next-step');
        nextButton.disabled = !valid;
        
        return valid;
    }

    // ============================================
    // SELECTION METHODS
    // ============================================

    selectService(serviceCard) {
        // Remover selección previa
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nueva tarjeta
        serviceCard.classList.add('selected');
        const radio = serviceCard.querySelector('input[type="radio"]');
        radio.checked = true;
        
        // Habilitar botón next
        document.querySelector('[data-step="1"] .next-step').disabled = false;
    }

    updateServiceSelection() {
        const selected = document.querySelector('input[name="service"]:checked');
        document.querySelector('[data-step="1"] .next-step').disabled = !selected;
    }

    selectPaymentMethod(methodCard) {
        // Remover selección previa
        document.querySelectorAll('.payment-method').forEach(method => {
            method.classList.remove('selected');
        });
        
        // Seleccionar nuevo método
        methodCard.classList.add('selected');
        
        // Habilitar botón next
        document.querySelector('[data-step="3"] .next-step').disabled = false;
    }

    updatePaymentSummary() {
        const selectedService = document.querySelector('input[name="service"]:checked').value;
        const selectedMethod = document.querySelector('.payment-method.selected').dataset.method;
        const studentName = document.querySelector('input[name="studentName"]').value;
        
        const service = this.paymentItems[selectedService];
        const fee = this.calculateFee(service.price, selectedMethod);
        const total = service.price + fee;
        
        // Actualizar elementos del resumen
        document.querySelector('.service-name').textContent = service.name;
        document.querySelector('.student-name').textContent = studentName;
        document.querySelector('.payment-method-name').textContent = 
            document.querySelector('.payment-method.selected h6').textContent;
        document.querySelector('.subtotal').textContent = `$${service.price.toLocaleString('es-MX')}`;
        document.querySelector('.fee').textContent = `$${fee.toLocaleString('es-MX')}`;
        document.querySelector('.total-amount').textContent = `$${total.toLocaleString('es-MX')}`;
        
        // Cargar formulario específico del proveedor
        this.loadProviderForm(selectedMethod, total);
    }

    calculateFee(amount, method) {
        const fees = this.config.fees;
        
        if (fees[method] < 1) {
            // Porcentaje
            return Math.round(amount * fees[method]);
        } else {
            // Cantidad fija
            return fees[method];
        }
    }

    async loadProviderForm(method, amount) {
        const container = document.querySelector('.payment-form-container');
        const provider = this.providers[method];
        
        try {
            const form = await provider.createPaymentForm(amount);
            container.innerHTML = form;
            
            // Habilitar botón de pago
            document.querySelector('.process-payment').disabled = false;
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Error cargando formulario de pago</div>';
        }
    }

    // ============================================
    // PAYMENT PROCESSING
    // ============================================

    async processPayment() {
        const selectedService = document.querySelector('input[name="service"]:checked').value;
        const selectedMethod = document.querySelector('.payment-method.selected').dataset.method;
        const formData = new FormData(document.querySelector('.student-info-form'));
        
        const paymentData = {
            service: selectedService,
            method: selectedMethod,
            amount: this.paymentItems[selectedService].price,
            fee: this.calculateFee(this.paymentItems[selectedService].price, selectedMethod),
            student: Object.fromEntries(formData.entries()),
            timestamp: Date.now()
        };
        
        paymentData.total = paymentData.amount + paymentData.fee;
        
        // Mostrar estado de carga
        this.showPaymentLoading();
        
        try {
            const result = await this.providers[selectedMethod].processPayment(paymentData);
            
            if (result.success) {
                this.handlePaymentSuccess(result, paymentData);
            } else {
                this.handlePaymentError(result.error);
            }
            
        } catch (error) {
            this.handlePaymentError(error.message);
        }
    }

    showPaymentLoading() {
        document.querySelectorAll('.payment-step').forEach(step => step.style.display = 'none');
        document.querySelector('.payment-loading').style.display = 'block';
    }

    handlePaymentSuccess(result, paymentData) {
        // Ocultar loading
        document.querySelector('.payment-loading').style.display = 'none';
        
        // Mostrar éxito
        document.querySelector('.payment-success').style.display = 'block';
        
        // Actualizar información de la transacción
        document.querySelector('.transaction-id').textContent = result.transactionId;
        document.querySelector('.reference').textContent = result.reference || result.transactionId;
        
        // Guardar transacción
        this.saveTransaction(result.transactionId, {
            ...paymentData,
            ...result,
            status: 'completed'
        });
        
        // Actualizar métricas
        this.updateMetrics(paymentData.total, true);
        
        // Generar recibo
        this.generateReceipt(result.transactionId, paymentData, result);
    }

    handlePaymentError(errorMessage) {
        // Ocultar loading
        document.querySelector('.payment-loading').style.display = 'none';
        
        // Mostrar error
        document.querySelector('.payment-error').style.display = 'block';
        document.querySelector('.error-message').textContent = errorMessage;
        
        // Actualizar métricas
        this.updateMetrics(0, false);
    }

    retryPayment() {
        // Ocultar estados de resultado
        document.querySelector('.payment-success').style.display = 'none';
        document.querySelector('.payment-error').style.display = 'none';
        
        // Volver al paso de confirmación
        document.querySelector('[data-step="4"]').style.display = 'block';
    }

    // ============================================
    // TRANSACTION MANAGEMENT
    // ============================================

    saveTransaction(transactionId, data) {
        this.transactions.set(transactionId, data);
        
        // Guardar en localStorage como backup
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        transactions.push({ id: transactionId, ...data });
        localStorage.setItem('payment_transactions', JSON.stringify(transactions));
    }

    loadSavedTransactions() {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        transactions.forEach(tx => {
            this.transactions.set(tx.id, tx);
        });
    }

    generateReceipt(transactionId, paymentData, result) {
        const receipt = {
            id: transactionId,
            date: new Date().toLocaleString('es-MX'),
            service: this.paymentItems[paymentData.service],
            student: paymentData.student,
            amount: paymentData.amount,
            fee: paymentData.fee,
            total: paymentData.total,
            method: paymentData.method,
            reference: result.reference || transactionId,
            status: 'Pagado'
        };
        
        this.receipts.set(transactionId, receipt);
    }

    downloadReceipt() {
        const transactionId = document.querySelector('.transaction-id').textContent;
        const receipt = this.receipts.get(transactionId);
        
        if (receipt) {
            this.generateReceiptPDF(receipt);
        }
    }

    generateReceiptPDF(receipt) {
        // Crear contenido HTML del recibo
        const receiptHTML = this.getReceiptHTML(receipt);
        
        // Crear ventana para imprimir
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
    }

    getReceiptHTML(receipt) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comprobante de Pago - ${receipt.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
                    .receipt-info { margin: 20px 0; }
                    .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    .receipt-table th { background-color: #f8f9fa; }
                    .total { font-weight: bold; font-size: 1.2em; }
                    .footer { margin-top: 40px; text-align: center; color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Bachillerato General Estatal "Héroes de la Patria"</h2>
                    <h3>Comprobante de Pago</h3>
                </div>
                
                <div class="receipt-info">
                    <p><strong>Fecha:</strong> ${receipt.date}</p>
                    <p><strong>ID de Transacción:</strong> ${receipt.id}</p>
                    <p><strong>Referencia:</strong> ${receipt.reference}</p>
                    <p><strong>Estado:</strong> ${receipt.status}</p>
                </div>
                
                <h4>Información del Estudiante</h4>
                <p><strong>Nombre:</strong> ${receipt.student.studentName}</p>
                <p><strong>Email:</strong> ${receipt.student.email}</p>
                <p><strong>Teléfono:</strong> ${receipt.student.phone}</p>
                ${receipt.student.studentId ? `<p><strong>Matrícula:</strong> ${receipt.student.studentId}</p>` : ''}
                
                <h4>Detalles del Pago</h4>
                <table class="receipt-table">
                    <tr>
                        <th>Concepto</th>
                        <th>Descripción</th>
                        <th>Monto</th>
                    </tr>
                    <tr>
                        <td>${receipt.service.name}</td>
                        <td>${receipt.service.description}</td>
                        <td>$${receipt.amount.toLocaleString('es-MX')} MXN</td>
                    </tr>
                    <tr>
                        <td>Comisión</td>
                        <td>Comisión por método de pago</td>
                        <td>$${receipt.fee.toLocaleString('es-MX')} MXN</td>
                    </tr>
                    <tr class="total">
                        <td colspan="2">Total</td>
                        <td>$${receipt.total.toLocaleString('es-MX')} MXN</td>
                    </tr>
                </table>
                
                <div class="footer">
                    <p>Este comprobante es válido para efectos de pago.</p>
                    <p>Generado el ${new Date().toLocaleString('es-MX')}</p>
                </div>
            </body>
            </html>
        `;
    }

    updateMetrics(amount, success) {
        this.metrics.totalTransactions++;
        
        if (success) {
            this.metrics.successfulPayments++;
            this.metrics.totalAmount += amount;
            this.metrics.averageAmount = this.metrics.totalAmount / this.metrics.successfulPayments;
        } else {
            this.metrics.failedPayments++;
        }
        
        this.metrics.conversionRate = (this.metrics.successfulPayments / this.metrics.totalTransactions) * 100;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    showPaymentModal(serviceKey = null) {
        const modal = new bootstrap.Modal(document.getElementById('payment-modal'));
        
        // Pre-seleccionar servicio si se especifica
        if (serviceKey && this.paymentItems[serviceKey]) {
            setTimeout(() => {
                const serviceCard = document.querySelector(`[data-service="${serviceKey}"]`);
                if (serviceCard) {
                    this.selectService(serviceCard);
                }
            }, 100);
        }
        
        modal.show();
    }

    getTransactionHistory() {
        return Array.from(this.transactions.entries()).map(([id, data]) => ({ id, ...data }));
    }

    getMetrics() {
        return { ...this.metrics };
    }

    async refundTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transacción no encontrada');
        }
        
        const provider = this.providers[transaction.method];
        const result = await provider.refund(transactionId, transaction.total);
        
        if (result.success) {
            transaction.status = 'refunded';
            this.metrics.refunds++;
        }
        
        return result;
    }
}

// ============================================
// PAYMENT PROVIDERS
// ============================================

class StripeProvider {
    constructor() {
        this.stripe = null;
        this.elements = null;
    }

    async init() {
        // En producción, cargar Stripe.js dinámicamente
        //console.log('💳 Stripe Provider inicializado (simulado)');
    }

    async createPaymentForm(amount) {
        return `
            <div class="stripe-form">
                <div class="mb-3">
                    <label class="form-label">Número de tarjeta</label>
                    <input type="text" class="form-control" placeholder="4242 4242 4242 4242" maxlength="19">
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Fecha de vencimiento</label>
                        <input type="text" class="form-control" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">CVC</label>
                        <input type="text" class="form-control" placeholder="123" maxlength="4">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Nombre en la tarjeta</label>
                    <input type="text" class="form-control" placeholder="Juan Pérez">
                </div>
            </div>
        `;
    }

    async processPayment(paymentData) {
        // Simulación de procesamiento con Stripe
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `stripe_${Date.now()}`,
                    reference: `ST${Date.now().toString().slice(-8)}`,
                    processorResponse: 'approved'
                });
            }, 3000);
        });
    }

    async refund(transactionId, amount) {
        return {
            success: true,
            refundId: `rf_${Date.now()}`,
            amount: amount
        };
    }
}

class PayPalProvider {
    constructor() {
        this.paypal = null;
    }

    async init() {
        //console.log('🅿️ PayPal Provider inicializado (simulado)');
    }

    async createPaymentForm(amount) {
        return `
            <div class="paypal-form">
                <div class="alert alert-info">
                    <i class="fab fa-paypal"></i>
                    Serás redirigido a PayPal para completar el pago de manera segura.
                </div>
                <div class="paypal-button-container">
                    <div class="btn btn-warning btn-lg w-100">
                        <i class="fab fa-paypal"></i> Pagar con PayPal
                    </div>
                </div>
            </div>
        `;
    }

    async processPayment(paymentData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `paypal_${Date.now()}`,
                    reference: `PP${Date.now().toString().slice(-8)}`,
                    processorResponse: 'completed'
                });
            }, 4000);
        });
    }

    async refund(transactionId, amount) {
        return {
            success: true,
            refundId: `pp_rf_${Date.now()}`,
            amount: amount
        };
    }
}

class OXXOProvider {
    async init() {
        //console.log('🏪 OXXO Provider inicializado');
    }

    async createPaymentForm(amount) {
        return `
            <div class="oxxo-form">
                <div class="alert alert-warning">
                    <i class="fas fa-store"></i>
                    <strong>Pago en OXXO</strong><br>
                    Se generará una referencia para pagar en efectivo en cualquier tienda OXXO.
                    El pago será confirmado en un plazo de 24-48 horas.
                </div>
                <div class="oxxo-info">
                    <p><strong>Total a pagar:</strong> $${amount.toLocaleString('es-MX')} MXN</p>
                    <p><strong>Vigencia:</strong> 3 días</p>
                </div>
            </div>
        `;
    }

    async processPayment(paymentData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `oxxo_${Date.now()}`,
                    reference: this.generateOXXOReference(),
                    processorResponse: 'pending',
                    paymentInstructions: 'Presenta esta referencia en cualquier tienda OXXO'
                });
            }, 2000);
        });
    }

    generateOXXOReference() {
        return Math.random().toString().slice(2, 12).padStart(10, '0');
    }

    async refund(transactionId, amount) {
        return {
            success: false,
            error: 'Los pagos en OXXO no admiten reembolsos automáticos'
        };
    }
}

class SPEIProvider {
    async init() {
        //console.log('🏦 SPEI Provider inicializado');
    }

    async createPaymentForm(amount) {
        return `
            <div class="spei-form">
                <div class="alert alert-info">
                    <i class="fas fa-university"></i>
                    <strong>Transferencia SPEI</strong><br>
                    Realiza una transferencia bancaria electrónica usando los datos que se proporcionarán.
                </div>
                <div class="bank-info">
                    <h6>Datos bancarios:</h6>
                    <p><strong>Beneficiario:</strong> Bachillerato Héroes de la Patria A.C.</p>
                    <p><strong>Banco:</strong> Banco Ejemplo</p>
                    <p><strong>CLABE:</strong> 123456789012345678</p>
                    <p><strong>Concepto:</strong> Pago servicios educativos</p>
                </div>
            </div>
        `;
    }

    async processPayment(paymentData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `spei_${Date.now()}`,
                    reference: `SP${Date.now().toString().slice(-8)}`,
                    processorResponse: 'pending',
                    paymentInstructions: 'Realiza la transferencia con los datos proporcionados'
                });
            }, 1500);
        });
    }

    async refund(transactionId, amount) {
        return {
            success: true,
            refundId: `spei_rf_${Date.now()}`,
            amount: amount,
            processingTime: '24-48 horas'
        };
    }
}

class MercadoPagoProvider {
    async init() {
        //console.log('💰 MercadoPago Provider inicializado (simulado)');
    }

    async createPaymentForm(amount) {
        return `
            <div class="mercadopago-form">
                <div class="alert alert-primary">
                    <i class="fas fa-credit-card"></i>
                    Serás redirigido a MercadoPago para completar el pago.
                </div>
            </div>
        `;
    }

    async processPayment(paymentData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: `mp_${Date.now()}`,
                    reference: `MP${Date.now().toString().slice(-8)}`,
                    processorResponse: 'approved'
                });
            }, 3500);
        });
    }

    async refund(transactionId, amount) {
        return {
            success: true,
            refundId: `mp_rf_${Date.now()}`,
            amount: amount
        };
    }
}

// Auto-inicialización
let paymentSystemAdvanced;

document.addEventListener('DOMContentLoaded', () => {
    paymentSystemAdvanced = new PaymentSystemAdvanced();
    
    // Hacer disponible globalmente
    window.paymentSystemAdvanced = paymentSystemAdvanced;
});

// Agregar estilos para el sistema de pagos
const paymentStyles = document.createElement('style');
paymentStyles.textContent = `
    .service-card {
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .service-card:hover {
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.15);
    }
    
    .service-card.selected {
        border-color: #007bff;
        background-color: #f8f9ff;
    }
    
    .service-price {
        font-size: 1.2rem;
        font-weight: bold;
        color: #007bff;
    }
    
    .service-select input[type="radio"] {
        display: none;
    }
    
    .service-select label {
        width: 20px;
        height: 20px;
        border: 2px solid #dee2e6;
        border-radius: 50%;
        display: block;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .service-card.selected .service-select label {
        border-color: #007bff;
        background-color: #007bff;
    }
    
    .service-card.selected .service-select label::after {
        content: '✓';
        color: white;
        display: block;
        text-align: center;
        line-height: 16px;
        font-size: 12px;
    }
    
    .payment-method {
        border: 2px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .payment-method:hover {
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.15);
    }
    
    .payment-method.selected {
        border-color: #007bff;
        background-color: #f8f9ff;
    }
    
    .method-info {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .method-fee {
        font-weight: bold;
        color: #6c757d;
    }
    
    .oxxo-logo {
        background: #f39c12;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 14px;
    }
    
    .spei-logo {
        font-size: 24px;
    }
    
    .summary-card {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .summary-item:last-child {
        border-bottom: none;
    }
    
    .summary-item.total {
        font-size: 1.2rem;
        font-weight: bold;
        border-top: 2px solid #dee2e6;
        margin-top: 10px;
        padding-top: 15px;
    }
    
    .payment-step {
        display: none;
    }
    
    .payment-step.active {
        display: block;
    }
    
    .step-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #dee2e6;
    }
    
    .success-icon, .error-icon {
        font-size: 4rem;
    }
    
    .stripe-form input {
        font-family: 'Courier New', monospace;
    }
    
    .paypal-button-container .btn {
        font-size: 1.1rem;
    }
    
    .is-invalid {
        border-color: #dc3545 !important;
    }
    
    @media (max-width: 768px) {
        .service-card, .payment-method {
            flex-direction: column;
            text-align: center;
            gap: 10px;
        }
        
        .step-buttons {
            flex-direction: column;
            gap: 10px;
        }
    }
`;

document.head.appendChild(paymentStyles);

// Exponer la clase
window.PaymentSystemAdvanced = PaymentSystemAdvanced;

//console.log('💳 Payment System Advanced cargado. Usa window.paymentSystemAdvanced para acceso directo.');