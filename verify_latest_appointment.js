const db = require('./backend/config/database');

async function checkLatestCita() {
    try {
        const result = await db.executeQuery(`
            SELECT id, cita_id, nombre_completo, email, fecha_solicitada, hora_solicitada, created_at 
            FROM citas 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        console.log("LATEST_CITA:", JSON.stringify(result[0], null, 2));
        process.exit(0);
    } catch (error) {
        console.error("DB_ERROR:", error);
        process.exit(1);
    }
}

checkLatestCita();
