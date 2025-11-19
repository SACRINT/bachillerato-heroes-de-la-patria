/**
 * 🔐 LOGIN MODAL FUNCTIONS - Funciones para modales del dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

// Funciones requeridas por onclick events para evitar errores
function showLoginModal() {
    console.log('🔐 Intentando mostrar modal de login...');
    const modal = document.getElementById('loginModal');
    if (modal) {
        console.log('✅ Modal encontrado, mostrando...');
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        console.error('❌ Modal loginModal no encontrado');
        // Fallback: mostrar alert con datos de prueba
        alert('Modal no encontrado. Datos de prueba:\nUsuario: admin\nContraseña: admin123\nRol: Director');
    }
}

window.showInfoModal = function() {
    console.log('🔧 Abriendo modal de información del sistema...');
    const modal = document.getElementById('infoModal');
    if (modal) {
        console.log('✅ Modal encontrado, actualizando datos y mostrando...');

        // Actualizar estadísticas con datos actuales (localStorage o configurados)
        updateSystemInfoModal();

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        console.error('❌ Modal infoModal no encontrado');
        // Fallback mejorado
        alert('📊 Sistema de Administración BGE Héroes de la Patria\n\n✅ Módulos Disponibles:\n• Gestión de Estudiantes\n• Control Académico\n• Reportes y Estadísticas\n• Sistema de Pagos\n• Gestión de Personal\n• Configuración\n\n🔧 Características:\n• Seguridad avanzada\n• Respaldo automático\n• Diseño responsivo\n• Dashboard interactivo');
    }
}

function updateSystemInfoModal() {
    try {
        // USAR SISTEMA DINÁMICO - Delegar al dynamic-stats-loader
        if (window.dynamicStatsLoader && window.dynamicStatsLoader.stats) {
            window.dynamicStatsLoader.updateModalStats();
            return;
        }

        // Fallback solo si el sistema dinámico no está disponible
        const totalStudents = localStorage.getItem('realData_totalStudents') || '202';
        const totalTeachers = localStorage.getItem('realData_totalTeachers') || '12';
        const totalSubjects = localStorage.getItem('realData_totalSubjects') || '41';
        const generalAverage = localStorage.getItem('realData_generalAverage') || '8.4';

        // Actualizar estadísticas en el modal
        const elements = {
            'modalTotalStudents': totalStudents,
            'modalTotalTeachers': totalTeachers,
            'modalTotalSubjects': totalSubjects,
            'modalGeneralAverage': generalAverage
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Actualizar información de sesión
        const currentUser = JSON.parse(localStorage.getItem('secure_admin_session') || '{}');
        if (currentUser.username) {
            const userNameElement = document.getElementById('currentUserName');
            const userRoleElement = document.getElementById('currentUserRole');
            const loginTimeElement = document.getElementById('loginTime');

            if (userNameElement) userNameElement.textContent = currentUser.name || currentUser.username;
            if (userRoleElement) userRoleElement.textContent = currentUser.role || 'Administrador';
            if (loginTimeElement) {
                const loginTime = new Date(currentUser.loginTime || Date.now()).toLocaleString();
                loginTimeElement.textContent = loginTime;
            }
        }

        // Actualizar timestamp
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }

        console.log('✅ Modal de información actualizado con datos en tiempo real');
    } catch (error) {
        console.error('❌ Error actualizando modal de información:', error);
    }
}

// Las funciones reales están definidas en dashboard-manager-2025.js
// Esta sección ya no bloquea las funcionalidades

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        // Si no existe la sección, hacer scroll al panel admin si está logueado
        if (adminDashboard && adminDashboard.isLoggedIn) {
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel && !adminPanel.classList.contains('d-none')) {
                adminPanel.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

// ✅ FUNCIONES DE CAMBIO DE CONTRASEÑA
window.showChangePasswordModal = function() {
    console.log('🔑 Abriendo modal de cambio de contraseña...');
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        // Limpiar formulario
        document.getElementById('changePasswordForm').reset();
        document.getElementById('passwordChangeMessage').style.display = 'none';
        document.getElementById('passwordStrengthIndicator').style.display = 'none';

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}

window.updatePassword = function() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageDiv = document.getElementById('passwordChangeMessage');

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordMessage('Todos los campos son obligatorios.', 'danger');
        return;
    }

    // Verificar contraseña actual (simulado - en producción sería contra servidor)
    const storedPassword = localStorage.getItem('admin_password') || 'admin123';
    if (currentPassword !== storedPassword) {
        showPasswordMessage('La contraseña actual es incorrecta.', 'danger');
        return;
    }

    // Validar que las nuevas contraseñas coincidan
    if (newPassword !== confirmPassword) {
        showPasswordMessage('Las nuevas contraseñas no coinciden.', 'danger');
        return;
    }

    // Validar fortaleza de contraseña
    if (newPassword.length < 8) {
        showPasswordMessage('La nueva contraseña debe tener al menos 8 caracteres.', 'danger');
        return;
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
        showPasswordMessage('La nueva contraseña debe ser diferente a la actual.', 'warning');
        return;
    }

    // Simular actualización (en producción sería llamada a servidor)
    try {
        localStorage.setItem('admin_password', newPassword);

        // Registrar en el log de cambios
        const changeLog = JSON.parse(localStorage.getItem('password_changes') || '[]');
        changeLog.push({
            timestamp: new Date().toISOString(),
            user: 'admin',
            action: 'password_changed'
        });
        localStorage.setItem('password_changes', JSON.stringify(changeLog));

        showPasswordMessage('✅ Contraseña actualizada exitosamente. Se recomienda cerrar sesión y volver a iniciarla.', 'success');

        // Limpiar formulario después de 3 segundos y cerrar modal
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
            document.getElementById('changePasswordForm').reset();
        }, 3000);

    } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        showPasswordMessage('Error al actualizar la contraseña. Inténtelo de nuevo.', 'danger');
    }
}

function showPasswordMessage(message, type) {
    const messageDiv = document.getElementById('passwordChangeMessage');
    messageDiv.className = `alert alert-${type}`;
    messageDiv.innerHTML = message;
    messageDiv.style.display = 'block';
}

// Validador de fortaleza de contraseña en tiempo real
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
        newPasswordField.addEventListener('input', function() {
            const password = this.value;
            const strengthIndicator = document.getElementById('passwordStrengthIndicator');
            const progressBar = strengthIndicator.querySelector('.progress-bar');
            const strengthText = document.getElementById('strengthText');

            if (password.length > 0) {
                strengthIndicator.style.display = 'block';

                let strength = 0;
                let feedback = [];

                // Longitud
                if (password.length >= 8) strength += 20;
                else feedback.push('mínimo 8 caracteres');

                // Letras mayúsculas
                if (/[A-Z]/.test(password)) strength += 20;
                else feedback.push('mayúsculas');

                // Letras minúsculas
                if (/[a-z]/.test(password)) strength += 20;
                else feedback.push('minúsculas');

                // Números
                if (/\d/.test(password)) strength += 20;
                else feedback.push('números');

                // Caracteres especiales
                if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
                else feedback.push('símbolos');

                // Actualizar barra de progreso
                progressBar.style.width = strength + '%';

                if (strength < 40) {
                    progressBar.className = 'progress-bar bg-danger';
                    strengthText.textContent = `Débil - Falta: ${feedback.join(', ')}`;
                } else if (strength < 80) {
                    progressBar.className = 'progress-bar bg-warning';
                    strengthText.textContent = `Medio - Falta: ${feedback.join(', ')}`;
                } else {
                    progressBar.className = 'progress-bar bg-success';
                    strengthText.textContent = 'Fuerte - Contraseña segura';
                }
            } else {
                strengthIndicator.style.display = 'none';
            }
        });
    }
});

// ✅ FUNCIONES DE CONFIGURACIÓN DE ESTADÍSTICAS
window.showStatisticsConfigModal = function() {
    console.log('📊 Abriendo modal de configuración de estadísticas...');
    const modal = document.getElementById('statisticsConfigModal');
    if (modal) {
        // Cargar valores actuales desde localStorage o defaults
        document.getElementById('configTotalStudents').value = localStorage.getItem('realData_totalStudents') || '1247';
        document.getElementById('configTotalTeachers').value = localStorage.getItem('realData_totalTeachers') || '68';
        document.getElementById('configTotalSubjects').value = localStorage.getItem('realData_totalSubjects') || '42';
        document.getElementById('configGeneralAverage').value = localStorage.getItem('realData_generalAverage') || '8.4';

        // Limpiar mensajes
        document.getElementById('statisticsConfigMessage').style.display = 'none';

        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
}

window.saveStatisticsConfig = function() {
    const students = document.getElementById('configTotalStudents').value;
    const teachers = document.getElementById('configTotalTeachers').value;
    const subjects = document.getElementById('configTotalSubjects').value;
    const average = document.getElementById('configGeneralAverage').value;
    const messageDiv = document.getElementById('statisticsConfigMessage');

    // Validaciones
    if (!students || !teachers || !subjects || !average) {
        showStatisticsMessage('Todos los campos son obligatorios.', 'danger');
        return;
    }

    // Validar valores numéricos
    const studentsNum = parseInt(students);
    const teachersNum = parseInt(teachers);
    const subjectsNum = parseInt(subjects);
    const averageNum = parseFloat(average);

    if (studentsNum < 0 || studentsNum > 9999) {
        showStatisticsMessage('El número de estudiantes debe estar entre 0 y 9999.', 'warning');
        return;
    }

    if (teachersNum < 0 || teachersNum > 999) {
        showStatisticsMessage('El número de docentes debe estar entre 0 y 999.', 'warning');
        return;
    }

    if (subjectsNum < 0 || subjectsNum > 999) {
        showStatisticsMessage('El número de materias debe estar entre 0 y 999.', 'warning');
        return;
    }

    if (averageNum < 0 || averageNum > 10) {
        showStatisticsMessage('El promedio debe estar entre 0 y 10.', 'warning');
        return;
    }

    try {
        // Guardar en localStorage
        localStorage.setItem('realData_totalStudents', students);
        localStorage.setItem('realData_totalTeachers', teachers);
        localStorage.setItem('realData_totalSubjects', subjects);
        localStorage.setItem('realData_generalAverage', average);

        // Registrar cambio en log
        const configLog = JSON.parse(localStorage.getItem('statistics_changes') || '[]');
        configLog.push({
            timestamp: new Date().toISOString(),
            user: 'admin',
            action: 'statistics_updated',
            data: { students, teachers, subjects, average }
        });
        localStorage.setItem('statistics_changes', JSON.stringify(configLog));

        // Actualizar los valores en todas las pantallas
        updateAllStatisticsDisplays(studentsNum, teachersNum, subjectsNum, averageNum);

        showStatisticsMessage('✅ Estadísticas actualizadas exitosamente. Los cambios son permanentes.', 'success');

        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('statisticsConfigModal'));
            modal.hide();
        }, 3000);

    } catch (error) {
        console.error('Error al guardar estadísticas:', error);
        showStatisticsMessage('Error al guardar las estadísticas. Inténtelo de nuevo.', 'danger');
    }
}

function showStatisticsMessage(message, type) {
    const messageDiv = document.getElementById('statisticsConfigMessage');
    messageDiv.className = `alert alert-${type}`;
    messageDiv.innerHTML = message;
    messageDiv.style.display = 'block';
}

function updateAllStatisticsDisplays(students, teachers, subjects, average) {
    // Actualizar las tarjetas principales del dashboard
    const studentsCard = document.getElementById('totalStudents');
    const teachersCard = document.getElementById('totalTeachers');
    const subjectsCard = document.getElementById('totalSubjects');
    const averageCard = document.getElementById('generalAverage');

    if (studentsCard) studentsCard.textContent = students.toLocaleString();
    if (teachersCard) teachersCard.textContent = teachers.toLocaleString();
    if (subjectsCard) subjectsCard.textContent = subjects.toLocaleString();
    if (averageCard) averageCard.textContent = average;

    // Actualizar modal de información del sistema
    const modalStudents = document.getElementById('modalTotalStudents');
    const modalTeachers = document.getElementById('modalTotalTeachers');
    const modalSubjects = document.getElementById('modalTotalSubjects');
    const modalAverage = document.getElementById('modalGeneralAverage');

    if (modalStudents) modalStudents.textContent = students.toLocaleString();
    if (modalTeachers) modalTeachers.textContent = teachers.toLocaleString();
    if (modalSubjects) modalSubjects.textContent = subjects.toLocaleString();
    if (modalAverage) modalAverage.textContent = average;

    // Actualizar instancia del dashboard si existe
    if (window.adminDashboard && window.adminDashboard.realDataConfig) {
        window.adminDashboard.realDataConfig.totalStudents = students;
        window.adminDashboard.realDataConfig.totalTeachers = teachers;
        window.adminDashboard.realDataConfig.totalSubjects = subjects;
        window.adminDashboard.realDataConfig.generalAverage = average;

        // Refreshar dashboard si tiene método de actualización
        if (typeof window.adminDashboard.updateDashboardUI === 'function') {
            window.adminDashboard.updateDashboardUI();
        }
    }

    console.log('📊 Estadísticas actualizadas:', { students, teachers, subjects, average });
}

// ✅ FUNCIONES DEL CHATBOT (Eliminadas)
