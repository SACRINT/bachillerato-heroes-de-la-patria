/**
 * 💾 RUTAS DE BACKUP - BGE HÉROES DE LA PATRIA
 * APIs para gestión del sistema de backup automático
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const { requireAdmin } = require('../middleware/auth');
const { getBackupService } = require('../services/backupService');
const router = express.Router();

// Aplicar autenticación de admin a todas las rutas de backup
router.use(requireAdmin);

/**
 * GET /api/backup/list
 * Listar todos los backups disponibles
 */
router.get('/list', async (req, res, next) => {
    try {
        debugLog.log('BACKUP', '📋 [BACKUP API] Solicitando lista de backups');

        const backupService = getBackupService();
        const result = await backupService.listBackups();

        if (result.success) {
            debugLog.log('BACKUP', 'Lista de backups consultada', {
                userId: req.user.id,
                count: result.count
            });

            res.json({
                success: true,
                data: result.backups,
                meta: {
                    total: result.count,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error obteniendo lista de backups',
                details: result.error
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backup/stats
 * Obtener estadísticas del sistema de backup
 */
router.get('/stats', async (req, res, next) => {
    try {
        debugLog.log('BACKUP', '📊 [BACKUP API] Solicitando estadísticas de backup');

        const backupService = getBackupService();
        const result = await backupService.getBackupStats();

        if (result.success) {
            res.json({
                success: true,
                data: result.stats,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estadísticas',
                details: result.error
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backup/health
 * Verificar salud del sistema de backup
 */
router.get('/health', async (req, res, next) => {
    try {
        debugLog.log('BACKUP', '❤️ [BACKUP API] Verificando salud del sistema de backup');

        const backupService = getBackupService();
        const health = await backupService.checkBackupHealth();

        const statusCode = health.status === 'healthy' ? 200 :
                          health.status === 'warning' ? 200 : 500;

        res.status(statusCode).json({
            success: health.status !== 'error',
            data: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backup/create
 * Crear backup manual inmediato
 */
router.post('/create', async (req, res, next) => {
    try {
        const { type = 'manual' } = req.body;

        debugLog.log('BACKUP', `🚀 [BACKUP API] Creando backup manual tipo: ${type}`);

        const backupService = getBackupService();

        // Verificar que no hay otro backup en progreso
        if (backupService.isRunning) {
            return res.status(409).json({
                success: false,
                error: 'Ya hay un backup en progreso',
                message: 'Espere a que termine el backup actual'
            });
        }

        const result = await backupService.createManualBackup();

        if (result.success) {
            debugLog.log('BACKUP', 'Backup manual creado', {
                userId: req.user.id,
                filename: result.filename,
                size: result.size
            });

            res.json({
                success: true,
                message: 'Backup creado exitosamente',
                data: {
                    filename: result.filename,
                    size: result.size,
                    sizeFormatted: backupService.formatBytes(result.size),
                    timestamp: result.timestamp
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error creando backup',
                details: result.error
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backup/data-only
 * Crear backup solo de datos
 */
router.post('/data-only', async (req, res, next) => {
    try {
        debugLog.log('BACKUP', '📊 [BACKUP API] Creando backup de datos únicamente');

        const backupService = getBackupService();
        const result = await backupService.createDataBackup();

        if (result.success) {
            debugLog.log('BACKUP', 'Backup de datos creado', {
                userId: req.user.id,
                filename: result.filename,
                type: 'data-only'
            });

            res.json({
                success: true,
                message: 'Backup de datos creado exitosamente',
                data: {
                    filename: result.filename,
                    type: result.type,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error creando backup de datos',
                details: result.error
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backup/restore/:filename
 * Restaurar desde backup específico
 */
router.post('/restore/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;
        const { confirm } = req.body;

        debugLog.log('BACKUP', `🔄 [BACKUP API] Solicitud de restauración: ${filename}`);

        if (!confirm) {
            return res.status(400).json({
                success: false,
                error: 'Confirmación requerida',
                message: 'Debe confirmar la restauración enviando confirm: true'
            });
        }

        const backupService = getBackupService();
        const result = await backupService.restoreFromBackup(filename);

        debugLog.log('BACKUP', 'Solicitud de restauración de backup', {
            userId: req.user.id,
            filename: filename,
            confirmed: confirm
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Backup disponible para restauración',
                data: {
                    filename: filename,
                    backupPath: result.backupPath,
                    instructions: 'Restauración manual requerida por seguridad'
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Backup no encontrado',
                details: result.error
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/backup/:filename
 * Eliminar backup específico
 */
router.delete('/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;

        debugLog.log('BACKUP', `🗑️ [BACKUP API] Eliminando backup: ${filename}`);

        // Validar que es un archivo de backup válido
        if (!filename.includes('backup') || !filename.endsWith('.zip')) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido',
                message: 'Solo se pueden eliminar archivos de backup (.zip)'
            });
        }

        const backupService = getBackupService();
        const fs = require('fs').promises;
        const path = require('path');
        const backupPath = path.join(backupService.backupDir, filename);

        try {
            await fs.access(backupPath);
            await fs.unlink(backupPath);

            debugLog.log('BACKUP', 'Backup eliminado manualmente', {
                userId: req.user.id,
                filename: filename
            });

            res.json({
                success: true,
                message: 'Backup eliminado exitosamente',
                data: {
                    filename: filename,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: 'Backup no encontrado',
                details: error.message
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backup/download/:filename
 * Descargar backup específico
 */
router.get('/download/:filename', async (req, res, next) => {
    try {
        const { filename } = req.params;

        debugLog.log('BACKUP', `📥 [BACKUP API] Descargando backup: ${filename}`);

        // Validar que es un archivo de backup válido
        if (!filename.includes('backup') || !filename.endsWith('.zip')) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido'
            });
        }

        const backupService = getBackupService();
        const path = require('path');
        const fs = require('fs');
        const backupPath = path.join(backupService.backupDir, filename);

        // Verificar que el archivo existe
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                error: 'Backup no encontrado'
            });
        }

        debugLog.log('BACKUP', 'Backup descargado', {
            userId: req.user.id,
            filename: filename
        });

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Enviar archivo
        const fileStream = fs.createReadStream(backupPath);
        fileStream.pipe(res);

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/backup/status
 * Obtener estado actual del sistema de backup
 */
router.get('/status', async (req, res, next) => {
    try {
        debugLog.log('BACKUP', '📋 [BACKUP API] Consultando estado del sistema');

        const backupService = getBackupService();

        const status = {
            isRunning: backupService.isRunning,
            maxBackups: backupService.maxBackups,
            backupDirectory: backupService.backupDir,
            scheduledJobs: {
                daily: '2:00 AM',
                weekly: 'Domingos 3:00 AM',
                dataBackup: 'Cada 6 horas'
            },
            lastCheck: new Date().toISOString()
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/backup/config
 * Actualizar configuración del sistema de backup
 */
router.post('/config', async (req, res, next) => {
    try {
        const { maxBackups } = req.body;

        debugLog.log('BACKUP', '⚙️ [BACKUP API] Actualizando configuración');

        if (maxBackups && (typeof maxBackups !== 'number' || maxBackups < 1 || maxBackups > 100)) {
            return res.status(400).json({
                success: false,
                error: 'maxBackups debe ser un número entre 1 y 100'
            });
        }

        const backupService = getBackupService();

        if (maxBackups) {
            backupService.maxBackups = maxBackups;
        }

        debugLog.log('BACKUP', 'Configuración de backup actualizada', {
            userId: req.user.id,
            changes: req.body
        });

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            data: {
                maxBackups: backupService.maxBackups,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;