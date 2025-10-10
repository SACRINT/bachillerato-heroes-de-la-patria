/**
 * 💰 DYNAMIC FINANCE LOADER - BGE HEROES DE LA PATRIA
 * Sistema de gestión dinámica de finanzas desde JSON
 */

class DynamicFinanceLoader {
    constructor() {
        this.financeFile = '/data/finanzas.json';
        this.finances = {};
        this.currentEditingId = null;
        console.log('💰 Dynamic Finance Loader inicializado');
    }

    /**
     * Cargar datos financieros desde JSON
     */
    async loadFinances() {
        try {
            console.log('📡 Cargando datos financieros desde:', this.financeFile);
            const response = await fetch(this.financeFile);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.finances = await response.json();
            console.log('✅ Datos financieros cargados:', this.finances);

            // Actualizar la interfaz
            this.updateFinanceCards();
            this.updateFinanceTables();

            return this.finances;
        } catch (error) {
            console.error('❌ Error cargando datos financieros:', error);

            // Cargar datos por defecto
            this.loadDefaultFinances();
            return this.finances;
        }
    }

    /**
     * Cargar datos financieros por defecto
     */
    loadDefaultFinances() {
        console.log('📋 Cargando datos financieros por defecto...');

        this.finances = {
            resumen: {
                ingresosMes: 0,
                pagosPendientes: 0,
                tasaCobro: 0,
                gastosMes: 0,
                utilidadMes: 0
            },
            ingresos: [],
            gastos: [],
            pagosPendientes: [],
            estadisticas: {},
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0"
            }
        };

        this.updateFinanceCards();
        this.updateFinanceTables();
    }

    /**
     * Actualizar tarjetas de resumen financiero
     */
    updateFinanceCards() {
        try {
            console.log('🔄 Actualizando tarjetas financieras...');

            // Buscar las tarjetas en la sección de finanzas
            const financeSection = document.getElementById('finances');
            if (!financeSection) {
                console.log('⚠️ Sección de finanzas no encontrada');
                return;
            }

            // Actualizar las tarjetas existentes
            const cards = financeSection.querySelectorAll('.card h4');
            if (cards.length >= 3) {
                // Ingresos del mes
                cards[0].textContent = this.formatCurrency(this.finances.resumen?.ingresosMes || 0);
                
                // Pagos pendientes
                cards[1].textContent = this.formatCurrency(this.finances.resumen?.pagosPendientes || 0);
                
                // Tasa de cobro
                cards[2].textContent = `${this.finances.resumen?.tasaCobro || 0}%`;
            }

            console.log('✅ Tarjetas financieras actualizadas');
        } catch (error) {
            console.error('❌ Error actualizando tarjetas financieras:', error);
        }
    }

    /**
     * Actualizar tablas financieras
     */
    updateFinanceTables() {
        try {
            console.log('🔄 Actualizando tablas financieras...');

            // Actualizar tabla de ingresos
            this.updateIncomeTable();
            
            // Actualizar tabla de gastos
            this.updateExpenseTable();
            
            // Actualizar tabla de pagos pendientes
            this.updatePendingPaymentsTable();

            console.log('✅ Tablas financieras actualizadas');
        } catch (error) {
            console.error('❌ Error actualizando tablas financieras:', error);
        }
    }

    /**
     * Actualizar tabla de ingresos
     */
    updateIncomeTable() {
        const tableBody = document.querySelector('#incomesTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.finances.ingresos?.forEach(income => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${income.concepto}</strong></td>
                <td><span class="badge bg-primary">${income.categoria}</span></td>
                <td>${this.formatCurrency(income.monto)}</td>
                <td>${this.formatDate(income.fecha)}</td>
                <td>
                    <span class="badge ${income.estado === 'Recibido' ? 'bg-success' : 'bg-warning'}">
                        ${income.estado}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="dynamicFinanceLoader.editIncome('${income.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dynamicFinanceLoader.deleteIncome('${income.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Actualizar tabla de gastos
     */
    updateExpenseTable() {
        const tableBody = document.querySelector('#expensesTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.finances.gastos?.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${expense.concepto}</strong></td>
                <td><span class="badge bg-secondary">${expense.categoria}</span></td>
                <td>${this.formatCurrency(expense.monto)}</td>
                <td>${this.formatDate(expense.fecha)}</td>
                <td>
                    <span class="badge ${expense.estado === 'Pagado' ? 'bg-success' : 'bg-warning'}">
                        ${expense.estado}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="dynamicFinanceLoader.editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dynamicFinanceLoader.deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Actualizar tabla de pagos pendientes
     */
    updatePendingPaymentsTable() {
        const tableBody = document.querySelector('#pendingPaymentsTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.finances.pagosPendientes?.forEach(payment => {
            const row = document.createElement('tr');
            const statusClass = payment.estado === 'Vencido' ? 'bg-danger' : 
                               payment.estado === 'Próximo' ? 'bg-warning' : 'bg-success';
            
            row.innerHTML = `
                <td>
                    <strong>${payment.estudiante}</strong><br>
                    <small class="text-muted">${payment.matricula}</small>
                </td>
                <td>${payment.concepto}</td>
                <td>${this.formatCurrency(payment.monto)}</td>
                <td>${this.formatDate(payment.fechaVencimiento)}</td>
                <td>
                    <span class="badge ${statusClass}">${payment.estado}</span>
                    ${payment.diasVencido > 0 ? `<br><small class="text-danger">${payment.diasVencido} días</small>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-success" onclick="dynamicFinanceLoader.markAsPaid('${payment.id}')">
                        <i class="fas fa-check"></i> Pagar
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="dynamicFinanceLoader.contactStudent('${payment.matricula}')">
                        <i class="fas fa-phone"></i> Contactar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Mostrar modal de configuración financiera
     */
    showFinanceConfigModal() {
        console.log('⚙️ Mostrando modal de configuración financiera...');
        
        // Crear modal si no existe
        let modal = document.getElementById('financeConfigModal');
        if (!modal) {
            modal = this.createFinanceConfigModal();
            document.body.appendChild(modal);
        }

        // Llenar formulario con datos actuales
        document.getElementById('configIngresosMes').value = this.finances.resumen?.ingresosMes || 0;
        document.getElementById('configPagosPendientes').value = this.finances.resumen?.pagosPendientes || 0;
        document.getElementById('configTasaCobro').value = this.finances.resumen?.tasaCobro || 0;
        document.getElementById('configGastosMes').value = this.finances.resumen?.gastosMes || 0;
        document.getElementById('configPresupuestoAnual').value = this.finances.configuracion?.presupuestoAnual || 0;
        document.getElementById('configMetaCobro').value = this.finances.configuracion?.metaCobroMensual || 95;

        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Crear modal de configuración financiera
     */
    createFinanceConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'financeConfigModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-cog me-2"></i>Configuración de Estadísticas Financieras
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="financeConfigForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configIngresosMes" class="form-label">
                                            <i class="fas fa-dollar-sign me-1"></i>Ingresos del Mes
                                        </label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="configIngresosMes" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configPagosPendientes" class="form-label">
                                            <i class="fas fa-clock me-1"></i>Pagos Pendientes
                                        </label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="configPagosPendientes" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configTasaCobro" class="form-label">
                                            <i class="fas fa-chart-pie me-1"></i>Tasa de Cobro
                                        </label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" id="configTasaCobro" step="0.1" min="0" max="100" required>
                                            <span class="input-group-text">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configGastosMes" class="form-label">
                                            <i class="fas fa-credit-card me-1"></i>Gastos del Mes
                                        </label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="configGastosMes" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configPresupuestoAnual" class="form-label">
                                            <i class="fas fa-calendar-alt me-1"></i>Presupuesto Anual
                                        </label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="configPresupuestoAnual" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="configMetaCobro" class="form-label">
                                            <i class="fas fa-target me-1"></i>Meta de Cobro Mensual
                                        </label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" id="configMetaCobro" step="0.1" min="0" max="100" required>
                                            <span class="input-group-text">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Nota:</strong> Estos valores actualizarán las estadísticas mostradas en el dashboard. 
                                Los cálculos de utilidad y otros indicadores se generarán automáticamente.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicFinanceLoader.saveFinanceConfig()">
                            <i class="fas fa-save me-2"></i>Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Guardar configuración financiera
     */
    async saveFinanceConfig() {
        try {
            console.log('💾 Guardando configuración financiera...');

            // Obtener datos del formulario
            const newConfig = {
                ingresosMes: parseFloat(document.getElementById('configIngresosMes').value) || 0,
                pagosPendientes: parseFloat(document.getElementById('configPagosPendientes').value) || 0,
                tasaCobro: parseFloat(document.getElementById('configTasaCobro').value) || 0,
                gastosMes: parseFloat(document.getElementById('configGastosMes').value) || 0,
                presupuestoAnual: parseFloat(document.getElementById('configPresupuestoAnual').value) || 0,
                metaCobroMensual: parseFloat(document.getElementById('configMetaCobro').value) || 95
            };

            // Actualizar el objeto interno
            this.finances.resumen = {
                ...this.finances.resumen,
                ingresosMes: newConfig.ingresosMes,
                pagosPendientes: newConfig.pagosPendientes,
                tasaCobro: newConfig.tasaCobro,
                gastosMes: newConfig.gastosMes,
                utilidadMes: newConfig.ingresosMes - newConfig.gastosMes
            };

            this.finances.configuracion = {
                ...this.finances.configuracion,
                presupuestoAnual: newConfig.presupuestoAnual,
                metaCobroMensual: newConfig.metaCobroMensual,
                ultimaActualizacion: new Date().toISOString()
            };

            // Recalcular estadísticas
            this.updateStatistics();

            // Guardar en servidor/localStorage
            await this.saveFinancesData();

            // Actualizar interfaz
            this.updateFinanceCards();
            this.updateFinanceTables();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('financeConfigModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Configuración financiera actualizada correctamente');

        } catch (error) {
            console.error('❌ Error guardando configuración financiera:', error);
            this.showErrorMessage('Error al guardar la configuración financiera');
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStatistics() {
        if (!this.finances.resumen) return;

        const resumen = this.finances.resumen;
        
        this.finances.estadisticas = {
            totalIngresosMes: resumen.ingresosMes || 0,
            totalGastosMes: resumen.gastosMes || 0,
            utilidadMes: (resumen.ingresosMes || 0) - (resumen.gastosMes || 0),
            totalPagosPendientes: resumen.pagosPendientes || 0,
            tasaCobroActual: resumen.tasaCobro || 0,
            promedioIngresoDiario: (resumen.ingresosMes || 0) / 30,
            margenUtilidad: resumen.ingresosMes > 0 ? 
                (((resumen.ingresosMes - resumen.gastosMes) / resumen.ingresosMes) * 100).toFixed(2) : 0
        };
    }

    /**
     * Formatear moneda
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Marcar pago como realizado
     */
    async markAsPaid(paymentId) {
        try {
            console.log('✅ Marcando pago como realizado:', paymentId);
            
            // Encontrar el pago
            const paymentIndex = this.finances.pagosPendientes?.findIndex(p => p.id === paymentId);
            if (paymentIndex === -1) {
                console.error('❌ Pago no encontrado:', paymentId);
                return;
            }

            const payment = this.finances.pagosPendientes[paymentIndex];
            
            // Confirmar acción
            if (!confirm(`¿Marcar como pagado el concepto "${payment.concepto}" por ${this.formatCurrency(payment.monto)}?`)) {
                return;
            }

            // Agregar a ingresos
            const newIncome = {
                id: `ING_${Date.now()}`,
                concepto: payment.concepto,
                categoria: 'Colegiaturas',
                monto: payment.monto,
                fecha: new Date().toISOString().split('T')[0],
                estado: 'Recibido',
                periodo: new Date().toISOString().substr(0, 7),
                descripcion: `Pago de ${payment.estudiante} - ${payment.matricula}`
            };

            if (!this.finances.ingresos) {
                this.finances.ingresos = [];
            }
            this.finances.ingresos.push(newIncome);

            // Remover de pagos pendientes
            this.finances.pagosPendientes.splice(paymentIndex, 1);

            // Actualizar resumen
            this.finances.resumen.ingresosMes += payment.monto;
            this.finances.resumen.pagosPendientes -= payment.monto;
            
            // Recalcular tasa de cobro (simplificado)
            const totalPendientes = this.finances.pagosPendientes?.reduce((sum, p) => sum + p.monto, 0) || 0;
            const totalIngresos = this.finances.resumen.ingresosMes;
            this.finances.resumen.tasaCobro = totalIngresos > 0 ? 
                ((totalIngresos / (totalIngresos + totalPendientes)) * 100).toFixed(1) : 0;

            // Guardar y actualizar
            await this.saveFinancesData();
            this.updateFinanceCards();
            this.updateFinanceTables();

            this.showSuccessMessage('Pago registrado correctamente');

        } catch (error) {
            console.error('❌ Error marcando pago:', error);
            this.showErrorMessage('Error al registrar el pago');
        }
    }

    /**
     * Editar ingreso
     */
    editIncome(incomeId) {
        console.log('✏️ Editando ingreso ID:', incomeId);

        // Encontrar el ingreso
        const income = this.finances.ingresos?.find(i => i.id === incomeId);
        if (!income) {
            console.error('❌ Ingreso no encontrado:', incomeId);
            this.showErrorMessage('Ingreso no encontrado');
            return;
        }

        this.showIncomeEditModal(income);
    }

    /**
     * Editar gasto
     */
    editExpense(expenseId) {
        console.log('✏️ Editando gasto ID:', expenseId);

        // Encontrar el gasto
        const expense = this.finances.gastos?.find(g => g.id === expenseId);
        if (!expense) {
            console.error('❌ Gasto no encontrado:', expenseId);
            this.showErrorMessage('Gasto no encontrado');
            return;
        }

        this.showExpenseEditModal(expense);
    }

    /**
     * Eliminar ingreso
     */
    async deleteIncome(incomeId) {
        console.log('🗑️ Eliminando ingreso ID:', incomeId);

        // Encontrar el ingreso
        const incomeIndex = this.finances.ingresos?.findIndex(i => i.id === incomeId);
        if (incomeIndex === -1) {
            console.error('❌ Ingreso no encontrado:', incomeId);
            this.showErrorMessage('Ingreso no encontrado');
            return;
        }

        const income = this.finances.ingresos[incomeIndex];

        if (!confirm(`¿Eliminar el ingreso "${income.concepto}" por ${this.formatCurrency(income.monto)}?`)) {
            return;
        }

        // Eliminar del array
        this.finances.ingresos.splice(incomeIndex, 1);

        // Recalcular resumen
        this.recalculateFinancialSummary();

        // Guardar y actualizar
        await this.saveFinancesData();
        this.updateFinanceCards();
        this.updateFinanceTables();

        this.showSuccessMessage('Ingreso eliminado correctamente');
    }

    /**
     * Eliminar gasto
     */
    async deleteExpense(expenseId) {
        console.log('🗑️ Eliminando gasto ID:', expenseId);

        // Encontrar el gasto
        const expenseIndex = this.finances.gastos?.findIndex(g => g.id === expenseId);
        if (expenseIndex === -1) {
            console.error('❌ Gasto no encontrado:', expenseId);
            this.showErrorMessage('Gasto no encontrado');
            return;
        }

        const expense = this.finances.gastos[expenseIndex];

        if (!confirm(`¿Eliminar el gasto "${expense.concepto}" por ${this.formatCurrency(expense.monto)}?`)) {
            return;
        }

        // Eliminar del array
        this.finances.gastos.splice(expenseIndex, 1);

        // Recalcular resumen
        this.recalculateFinancialSummary();

        // Guardar y actualizar
        await this.saveFinancesData();
        this.updateFinanceCards();
        this.updateFinanceTables();

        this.showSuccessMessage('Gasto eliminado correctamente');
    }

    /**
     * Mostrar modal de edición de ingreso
     */
    showIncomeEditModal(income) {
        console.log('📝 Mostrando modal de edición de ingreso:', income);

        // Por ahora mostrar datos del ingreso
        const details = `
            Concepto: ${income.concepto}
            Categoría: ${income.categoria}
            Monto: ${this.formatCurrency(income.monto)}
            Fecha: ${this.formatDate(income.fecha)}
            Estado: ${income.estado}
        `;

        alert(`Editando Ingreso:\n\n${details}\n\nModal de edición será implementado próximamente.`);
    }

    /**
     * Mostrar modal de edición de gasto
     */
    showExpenseEditModal(expense) {
        console.log('📝 Mostrando modal de edición de gasto:', expense);

        // Por ahora mostrar datos del gasto
        const details = `
            Concepto: ${expense.concepto}
            Categoría: ${expense.categoria}
            Monto: ${this.formatCurrency(expense.monto)}
            Fecha: ${this.formatDate(expense.fecha)}
            Estado: ${expense.estado}
        `;

        alert(`Editando Gasto:\n\n${details}\n\nModal de edición será implementado próximamente.`);
    }

    /**
     * Recalcular resumen financiero
     */
    recalculateFinancialSummary() {
        const totalIngresos = this.finances.ingresos?.reduce((sum, income) => sum + income.monto, 0) || 0;
        const totalGastos = this.finances.gastos?.reduce((sum, expense) => sum + expense.monto, 0) || 0;
        const totalPendientes = this.finances.pagosPendientes?.reduce((sum, payment) => sum + payment.monto, 0) || 0;

        this.finances.resumen = {
            ...this.finances.resumen,
            ingresosMes: totalIngresos,
            gastosMes: totalGastos,
            utilidadMes: totalIngresos - totalGastos,
            pagosPendientes: totalPendientes,
            tasaCobro: totalIngresos > 0 ? ((totalIngresos / (totalIngresos + totalPendientes)) * 100).toFixed(1) : 0
        };

        this.updateStatistics();
    }

    /**
     * Contactar estudiante
     */
    contactStudent(matricula) {
        console.log('📧 Contactando estudiante:', matricula);
        
        // Buscar datos del estudiante en el sistema de estudiantes
        if (window.dynamicStudentLoader && window.dynamicStudentLoader.students) {
            const student = window.dynamicStudentLoader.students.estudiantes?.find(s => s.matricula === matricula);
            if (student && window.dynamicStudentLoader.contactStudent) {
                window.dynamicStudentLoader.contactStudent(student.id);
                return;
            }
        }
        
        // Si no está disponible el sistema de estudiantes, mostrar modal simple
        this.showSimpleContactModal(matricula);
    }

    /**
     * Mostrar modal simple de contacto
     */
    showSimpleContactModal(matricula) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-phone me-2"></i>Contactar Estudiante
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p><strong>Matrícula:</strong> ${matricula}</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary">
                                <i class="fas fa-envelope me-2"></i>Enviar Email de Cobro
                            </button>
                            <button class="btn btn-success">
                                <i class="fas fa-phone me-2"></i>Llamar Teléfono
                            </button>
                            <button class="btn btn-info">
                                <i class="fas fa-file-pdf me-2"></i>Generar Estado de Cuenta
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Guardar datos financieros
     */
    async saveFinancesData() {
        try {
            console.log('💾 Guardando datos financieros...');

            // Actualizar configuración
            this.finances.configuracion = {
                ...this.finances.configuracion,
                ultimaActualizacion: new Date().toISOString(),
                version: '1.0'
            };

            // Guardar en localStorage como backup
            localStorage.setItem('financesData', JSON.stringify(this.finances));

            // Intentar guardar en servidor
            try {
                const response = await fetch('/api/save-finances', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.finances)
                });

                if (response.ok) {
                    console.log('✅ Datos financieros guardados en servidor');
                } else {
                    console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
                }
            } catch (serverError) {
                console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
            }

            return true;
        } catch (error) {
            console.error('❌ Error guardando datos financieros:', error);
            return false;
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <strong>¡Éxito!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * Inicializar el sistema
     */
    async init() {
        console.log('🚀 Inicializando Dynamic Finance Loader...');

        // Cargar datos financieros al inicio
        await this.loadFinances();

        // Configurar eventos
        this.setupEvents();

        console.log('✅ Dynamic Finance Loader inicializado correctamente');
    }

    /**
     * Configurar eventos
     */
    setupEvents() {
        // Botón de configuración financiera
        const configBtn = document.getElementById('financeConfigBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showFinanceConfigModal());
        }

        // Configurar eventos de búsqueda y filtros
        this.setupSearchEvents();

        // Recarga automática cada 60 segundos (finanzas se actualizan menos frecuentemente)
        setInterval(async () => {
            console.log('🔄 Recarga automática de datos financieros...');
            await this.loadFinances();
        }, 60000);

        // Recargar cuando la ventana gana el foco
        window.addEventListener('focus', async () => {
            console.log('🔄 Página enfocada, recargando datos financieros...');
            await this.loadFinances();
        });
    }

    /**
     * Configurar eventos de búsqueda
     */
    setupSearchEvents() {
        // Búsqueda en ingresos
        const incomeSearch = document.getElementById('searchIncomes');
        if (incomeSearch) {
            incomeSearch.addEventListener('input', (e) => {
                this.filterTable('incomesTable', e.target.value, ['concepto', 'categoria', 'descripcion']);
            });
        }

        // Búsqueda en gastos
        const expenseSearch = document.getElementById('searchExpenses');
        if (expenseSearch) {
            expenseSearch.addEventListener('input', (e) => {
                this.filterTable('expensesTable', e.target.value, ['concepto', 'categoria', 'descripcion']);
            });
        }

        // Búsqueda en pagos pendientes
        const pendingSearch = document.getElementById('searchPendingPayments');
        if (pendingSearch) {
            pendingSearch.addEventListener('input', (e) => {
                this.filterTable('pendingPaymentsTable', e.target.value, ['estudiante', 'matricula', 'concepto']);
            });
        }

        // Filtros por categoría para ingresos
        const incomeFilter = document.getElementById('filterIncomeCategory');
        if (incomeFilter) {
            incomeFilter.addEventListener('change', (e) => {
                this.filterByCategory('incomesTable', e.target.value, 1); // columna 1 = categoría
            });
        }

        // Filtros por categoría para gastos
        const expenseFilter = document.getElementById('filterExpenseCategory');
        if (expenseFilter) {
            expenseFilter.addEventListener('change', (e) => {
                this.filterByCategory('expensesTable', e.target.value, 1); // columna 1 = categoría
            });
        }

        // Filtros por estado para pagos pendientes
        const statusFilter = document.getElementById('filterPaymentStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus('pendingPaymentsTable', e.target.value);
            });
        }
    }

    /**
     * Filtrar tabla por texto de búsqueda
     */
    filterTable(tableId, searchText, searchColumns) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        const searchLower = searchText.toLowerCase().trim();

        rows.forEach(row => {
            if (searchLower === '') {
                row.style.display = '';
                return;
            }

            let found = false;
            const cells = row.querySelectorAll('td');

            // Buscar en las columnas especificadas
            cells.forEach((cell, index) => {
                const cellText = cell.textContent.toLowerCase();
                if (cellText.includes(searchLower)) {
                    found = true;
                }
            });

            row.style.display = found ? '' : 'none';
        });

        // Mostrar mensaje si no hay resultados
        this.showNoResultsMessage(tableId, searchText, rows);
    }

    /**
     * Filtrar tabla por categoría
     */
    filterByCategory(tableId, category, categoryColumnIndex) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            if (category === '' || category === 'all') {
                row.style.display = '';
                return;
            }

            const categoryCell = row.querySelectorAll('td')[categoryColumnIndex];
            const categoryText = categoryCell ? categoryCell.textContent.trim() : '';

            row.style.display = categoryText === category ? '' : 'none';
        });
    }

    /**
     * Filtrar tabla por estado de pagos
     */
    filterByStatus(tableId, status) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            if (status === '' || status === 'all') {
                row.style.display = '';
                return;
            }

            const statusCell = row.querySelectorAll('td')[4]; // columna 4 = estado
            const statusBadge = statusCell ? statusCell.querySelector('.badge') : null;
            const statusText = statusBadge ? statusBadge.textContent.trim() : '';

            row.style.display = statusText === status ? '' : 'none';
        });
    }

    /**
     * Mostrar mensaje cuando no hay resultados
     */
    showNoResultsMessage(tableId, searchText, rows) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        let noResultsRow = tbody.querySelector('.no-results-row');

        // Contar filas visibles
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');

        if (visibleRows.length === 0 && searchText.trim() !== '') {
            // Crear fila de "no hay resultados" si no existe
            if (!noResultsRow) {
                noResultsRow = document.createElement('tr');
                noResultsRow.className = 'no-results-row';
                noResultsRow.innerHTML = `
                    <td colspan="6" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-search fa-2x mb-2"></i>
                            <p class="mb-0">No se encontraron resultados para "<strong>${searchText}</strong>"</p>
                            <small>Intenta con otros términos de búsqueda</small>
                        </div>
                    </td>
                `;
                tbody.appendChild(noResultsRow);
            } else {
                noResultsRow.style.display = '';
                noResultsRow.querySelector('strong').textContent = searchText;
            }
        } else if (noResultsRow) {
            noResultsRow.style.display = 'none';
        }
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando Dynamic Finance Loader...');

    // Crear instancia global
    window.dynamicFinanceLoader = new DynamicFinanceLoader();

    // Inicializar después de un breve delay
    setTimeout(async () => {
        await window.dynamicFinanceLoader.init();
    }, 700);
});

// Función global para recargar finanzas
window.reloadFinances = async () => {
    if (window.dynamicFinanceLoader) {
        await window.dynamicFinanceLoader.loadFinances();
    }
};

console.log('💰 dynamic-finance-loader.js cargado correctamente');