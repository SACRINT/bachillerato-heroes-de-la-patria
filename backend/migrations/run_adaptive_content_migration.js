/**
 * Script para ejecutar migración de Adaptive Content
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📚 Ejecutando migration de Adaptive Content (Semana 10)...');

        const sqlPath = path.join(__dirname, '066-adaptive-content.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        // Seed Data Específico con lógica JS para recuperar IDs
        // Esto es más seguro que asumir IDs en el SQL
        await seedExampleContent();

        console.log('✅ Sistema de Contenido Adaptativo inicializado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

async function seedExampleContent() {
    console.log('🌱 Seeding example content...');
    try {
        // 1. Get Topic ID
        const topicRes = await executeQuery(`SELECT id FROM adaptive_topics WHERE title = 'Revolución Mexicana' LIMIT 1`);
        if (topicRes.rows.length === 0) return;
        const topicId = topicRes.rows[0].id;

        // 2. Create Node
        const nodeRes = await executeQuery(`
            INSERT INTO adaptive_nodes (topic_id, title, order_index)
            VALUES ($1, 'El Porfiriato', 1)
            RETURNING id
        `, [topicId]);
        const nodeId = nodeRes.rows[0].id;

        // 3. Create Adaptations (Visual, Auditory, Text)

        // Visual (Infografía / Video)
        await executeQuery(`
            INSERT INTO content_adaptations (node_id, content_type, target_style, difficulty_level, content_body)
            VALUES ($1, 'video', 'visual', 5, 'https://www.youtube.com/embed/example-porfiriato-visual')
        `, [nodeId]);

        // Auditory (Podcast script)
        await executeQuery(`
            INSERT INTO content_adaptations (node_id, content_type, target_style, difficulty_level, content_body)
            VALUES ($1, 'audio', 'auditory', 5, 'En este episodio analizamos los 30 años de gobierno de Porfirio Díaz...')
        `, [nodeId]);

        // Kinesthetic (Timeline interactiva exercise)
        // Usar JSON.stringify explícito para evitar errores de sintaxis en SQL
        const interactiveContent = JSON.stringify({ type: "timeline_drag_drop", events: ["Plan de San Luis", "Renuncia de Díaz"] });

        await executeQuery(`
            INSERT INTO content_adaptations (node_id, content_type, target_style, difficulty_level, content_body)
            VALUES ($1, 'interactive', 'kinesthetic', 5, $2)
        `, [nodeId, interactiveContent]);

        // Advanced Text (High Difficulty)
        await executeQuery(`
            INSERT INTO content_adaptations (node_id, content_type, target_style, difficulty_level, content_body)
            VALUES ($1, 'text', 'neutral', 8, 'El análisis sociopolítico del Porfiriato revela contradicciones estructurales...')
        `, [nodeId]);

    } catch (e) {
        console.warn('Seed data warning (might already exist):', e.message);
    }
}

runMigration();
