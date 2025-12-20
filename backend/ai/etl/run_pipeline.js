/**
 * @file run_pipeline.js
 * @description Orquestador principal del ETL de IA. Ejecutable vía Cron o CLI.
 */

const { extractGrades } = require('./extract_grades');
const { processBatch } = require('./transform_features');
const { loadFeatures } = require('./load_feature_store');
const db = require('../utils/db_connector');

async function runPipeline() {
    const startTime = Date.now();
    console.log('🚀 [ETL-ORCHESTRATOR] Iniciando Pipeline de IA: Student 360...');

    try {
        // Parametrización (podría venir de args o env)
        const currentPeriod = process.env.CURRENT_SCHOOL_PERIOD || '2025-A';

        // 1. EXTRACT
        console.time('Extract Phase');
        const rawData = await extractGrades(currentPeriod);
        console.timeEnd('Extract Phase');

        if (rawData.length === 0) {
            console.warn('⚠️ No se encontraron calificaciones para procesar. Abortando.');
            return;
        }

        // 2. TRANSFORM
        console.time('Transform Phase');
        const features = processBatch(rawData);
        console.timeEnd('Transform Phase');

        // 3. LOAD
        console.time('Load Phase');
        await loadFeatures(features);
        console.timeEnd('Load Phase');

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`✅ [ETL-ORCHESTRATOR] Pipeline completado exitosamente en ${totalTime}s.`);

    } catch (error) {
        console.error('❌ [ETL-ORCHESTRATOR] Pipeline falló con errores críticos.');
        console.error(error);
        process.exit(1);
    } finally {
        await db.closePool();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runPipeline();
}

module.exports = { runPipeline };
