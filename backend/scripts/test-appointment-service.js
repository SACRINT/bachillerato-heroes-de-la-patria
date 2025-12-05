
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const AppointmentService = require('../services/appointment.service');
const devLogger = require('../utils/devLogger');

async function testAppointmentService() {
    devLogger.log('🧪 Iniciando pruebas de AppointmentService...');

    try {
        // 1. Crear Cita
        devLogger.log('1️⃣ Probando createAppointment...');
        const newAppointment = await AppointmentService.createAppointment({
            nombre_completo: 'Test User',
            email: 'test@example.com',
            telefono: '1234567890',
            tipo_persona: 'externo',
            motivo: 'Prueba de servicio',
            descripcion: 'Esta es una cita de prueba generada automáticamente',
            fecha_solicitada: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana
            hora_solicitada: '10:00',
            metadata: { origen: 'test-script' }
        });
        devLogger.log('✅ Cita creada:', newAppointment.cita_id);

        // 2. Listar Citas
        devLogger.log('2️⃣ Probando listAppointments...');
        const list = await AppointmentService.listAppointments({ email: 'test@example.com' });
        devLogger.log(`✅ Citas encontradas: ${list.length}`);

        // 3. Actualizar Cita
        devLogger.log('3️⃣ Probando updateAppointment...');
        const updated = await AppointmentService.updateAppointment(newAppointment.id, {
            motivo: 'Motivo Actualizado',
            hora_solicitada: '11:00'
        });
        devLogger.log('✅ Cita actualizada:', updated.motivo, updated.hora_solicitada);

        // 4. Cancelar Cita
        devLogger.log('4️⃣ Probando cancelAppointment...');
        const cancelled = await AppointmentService.cancelAppointment(newAppointment.id, 'Prueba de cancelación');
        devLogger.log('✅ Cita cancelada, estado:', cancelled.estado);

        // 5. Eliminar Cita (Limpieza)
        devLogger.log('5️⃣ Probando deleteAppointment (Limpieza)...');
        const deleted = await AppointmentService.deleteAppointment(newAppointment.id);
        devLogger.log('✅ Cita eliminada:', deleted);

        devLogger.log('🎉 Todas las pruebas pasaron exitosamente.');

    } catch (error) {
        devLogger.error('❌ Error en pruebas:', error.message);
        if (error.stack) devLogger.error(error.stack);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testAppointmentService();
}

module.exports = testAppointmentService;
