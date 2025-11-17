/**
 * 🎯 ARTILLERY PROCESSORS - SEMANA 9
 * Funciones personalizadas para load testing
 *
 * Características:
 * - Generación dinámica de datos
 * - Validaciones personalizadas
 * - Logging de métricas
 *
 * Fecha: 17 Noviembre 2025
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// FUNCIONES HELPER
// =============================================================================

/**
 * Genera un email aleatorio para testing
 */
function generateRandomEmail(userContext, events, done) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    userContext.vars.test_email = `test${timestamp}${random}@bge.edu.mx`;
    return done();
}

/**
 * Genera datos de estudiante aleatorios
 */
function generateStudentData(userContext, events, done) {
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura'];
    const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez'];

    userContext.vars.student_nombre = nombres[Math.floor(Math.random() * nombres.length)];
    userContext.vars.student_apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    userContext.vars.student_username = `test${Date.now()}${Math.floor(Math.random() * 1000)}`;

    return done();
}

/**
 * Valida que la respuesta contiene un token JWT válido
 */
function validateJWT(requestParams, response, context, ee, next) {
    try {
        const body = JSON.parse(response.body);

        if (!body.token) {
            ee.emit('customStat', {
                stat: 'errors.missing_token',
                value: 1
            });
            console.error('[VALIDATION] Missing JWT token in response');
        } else {
            // Verificar formato JWT (3 partes separadas por puntos)
            const parts = body.token.split('.');
            if (parts.length !== 3) {
                ee.emit('customStat', {
                    stat: 'errors.invalid_jwt_format',
                    value: 1
                });
                console.error('[VALIDATION] Invalid JWT format');
            } else {
                ee.emit('customStat', {
                    stat: 'success.valid_jwt',
                    value: 1
                });
            }
        }
    } catch (error) {
        ee.emit('customStat', {
            stat: 'errors.json_parse',
            value: 1
        });
        console.error('[VALIDATION] Error parsing JSON:', error.message);
    }

    return next();
}

/**
 * Valida response time y emite métricas personalizadas
 */
function validateResponseTime(requestParams, response, context, ee, next) {
    const responseTime = response.timings.phases.total;

    if (responseTime > 1000) {
        ee.emit('customStat', {
            stat: 'slow_requests.gt_1s',
            value: 1
        });
    } else if (responseTime > 500) {
        ee.emit('customStat', {
            stat: 'slow_requests.gt_500ms',
            value: 1
        });
    } else {
        ee.emit('customStat', {
            stat: 'fast_requests.lt_500ms',
            value: 1
        });
    }

    return next();
}

/**
 * Log de errores detallado
 */
function logError(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: requestParams.method,
            url: requestParams.url,
            statusCode: response.statusCode,
            body: response.body ? response.body.substring(0, 200) : 'N/A'
        };

        console.error('[ERROR]', JSON.stringify(logEntry));

        // Emitir evento de error personalizado
        ee.emit('customStat', {
            stat: `errors.http_${response.statusCode}`,
            value: 1
        });
    }

    return next();
}

/**
 * Valida que la búsqueda retorna resultados
 */
function validateSearchResults(requestParams, response, context, ee, next) {
    try {
        const body = JSON.parse(response.body);

        if (body.success && body.results) {
            const totalResults = Object.values(body.results).reduce((sum, arr) => sum + arr.length, 0);

            if (totalResults === 0) {
                ee.emit('customStat', {
                    stat: 'search.no_results',
                    value: 1
                });
            } else {
                ee.emit('customStat', {
                    stat: 'search.has_results',
                    value: 1
                });
            }
        }
    } catch (error) {
        // Ignorar errores de parsing si no es JSON
    }

    return next();
}

/**
 * Callback antes de cada request (beforeRequest hook)
 */
function beforeRequest(requestParams, context, ee, next) {
    // Agregar header personalizado para identificar load test
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Load-Test'] = 'Artillery';
    requestParams.headers['X-Test-Session'] = context.vars.$uuid || 'unknown';

    return next();
}

/**
 * Callback después de cada request (afterResponse hook)
 */
function afterResponse(requestParams, response, context, ee, next) {
    // Emitir estadística del status code
    ee.emit('customStat', {
        stat: `status_codes.${response.statusCode}`,
        value: 1
    });

    // Validar headers de seguridad esperados
    if (!response.headers['content-security-policy']) {
        ee.emit('customStat', {
            stat: 'security.missing_csp',
            value: 1
        });
    }

    if (!response.headers['x-rate-limit-limit']) {
        ee.emit('customStat', {
            stat: 'security.missing_rate_limit_header',
            value: 1
        });
    }

    return next();
}

/**
 * Setup inicial del test
 */
function setupTest(context, ee, next) {
    console.log('================================================');
    console.log('🚀 ARTILLERY LOAD TEST - INICIANDO');
    console.log('================================================');
    console.log(`Target: ${context.vars.target}`);
    console.log(`Phases: ${JSON.stringify(context.funcs.config.phases)}`);
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log('================================================\n');

    // Emitir evento inicial
    ee.emit('customStat', {
        stat: 'test.started',
        value: 1
    });

    return next();
}

/**
 * Teardown al finalizar el test
 */
function teardownTest(context, ee, next) {
    console.log('\n================================================');
    console.log('✅ ARTILLERY LOAD TEST - COMPLETADO');
    console.log('================================================');
    console.log(`End Time: ${new Date().toISOString()}`);
    console.log('Revisa el reporte HTML para métricas detalladas');
    console.log('================================================\n');

    return next();
}

// =============================================================================
// CUSTOM METRICS TRACKING
// =============================================================================

/**
 * Track custom business metrics
 */
function trackBusinessMetrics(requestParams, response, context, ee, next) {
    try {
        const body = JSON.parse(response.body);
        const url = requestParams.url;

        // Track login attempts
        if (url.includes('/auth/login')) {
            if (response.statusCode === 200) {
                ee.emit('customStat', {
                    stat: 'business.login_success',
                    value: 1
                });
            } else {
                ee.emit('customStat', {
                    stat: 'business.login_failure',
                    value: 1
                });
            }
        }

        // Track student operations
        if (url.includes('/students')) {
            if (requestParams.method === 'POST' && response.statusCode === 201) {
                ee.emit('customStat', {
                    stat: 'business.student_created',
                    value: 1
                });
            }
        }

        // Track search operations
        if (url.includes('/search')) {
            ee.emit('customStat', {
                stat: 'business.search_queries',
                value: 1
            });

            if (body.took) {
                ee.emit('histogram', {
                    name: 'search.query_time_ms',
                    value: body.took
                });
            }
        }

        // Track webhook operations
        if (url.includes('/webhooks')) {
            ee.emit('customStat', {
                stat: 'business.webhook_operations',
                value: 1
            });
        }

    } catch (error) {
        // Silent fail for non-JSON responses
    }

    return next();
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // Generators
    generateRandomEmail,
    generateStudentData,

    // Validators
    validateJWT,
    validateResponseTime,
    validateSearchResults,

    // Logging
    logError,

    // Hooks
    beforeRequest,
    afterResponse,

    // Lifecycle
    setupTest,
    teardownTest,

    // Business metrics
    trackBusinessMetrics
};
