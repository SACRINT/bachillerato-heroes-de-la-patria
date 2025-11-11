/**
 * 📊 ESTADÍSTICAS DE LA TABLA ESTUDIANTES
 * Análisis de distribución de datos para optimización de índices
 */

const path = require('path');
const devLogger = require('../utils/devLogger');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function checkStats() {
    try {
        const client = await pool.connect();

        devLogger.log('📊 ESTADÍSTICAS DE LA TABLA ESTUDIANTES:');
        devLogger.log('='.repeat(80));

        // Conteo total
        const count = await client.query('SELECT COUNT(*) as total FROM estudiantes');
        devLogger.log(`Total estudiantes: ${count.rows[0].total}`);

        // Distribución por semestre
        const semestres = await client.query(`
            SELECT semestre, COUNT(*) as total
            FROM estudiantes
            GROUP BY semestre
            ORDER BY semestre
        `);
        devLogger.log('\n📚 Distribución por Semestre:');
        semestres.rows.forEach(s => devLogger.log(`  Semestre ${s.semestre}: ${s.total} estudiantes`));

        // Distribución por status
        const status = await client.query(`
            SELECT status_academico, COUNT(*) as total
            FROM estudiantes
            GROUP BY status_academico
            ORDER BY total DESC
        `);
        devLogger.log('\n📈 Distribución por Status Académico:');
        status.rows.forEach(s => devLogger.log(`  ${s.status_academico || 'NULL'}: ${s.total} estudiantes`));

        // Distribución por especialidad
        const especialidades = await client.query(`
            SELECT especialidad, COUNT(*) as total
            FROM estudiantes
            GROUP BY especialidad
            ORDER BY total DESC
            LIMIT 10
        `);
        devLogger.log('\n🎓 Top 10 Especialidades:');
        especialidades.rows.forEach(e => devLogger.log(`  ${e.especialidad || 'Sin Especialidad'}: ${e.total} estudiantes`));

        // Distribución por género
        const generos = await client.query(`
            SELECT genero, COUNT(*) as total
            FROM estudiantes
            GROUP BY genero
            ORDER BY total DESC
        `);
        devLogger.log('\n👥 Distribución por Género:');
        generos.rows.forEach(g => devLogger.log(`  ${g.genero}: ${g.total} estudiantes`));

        client.release();
        process.exit(0);
    } catch (error) {
        devLogger.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkStats();
