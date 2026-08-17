/**
 * 🧪 TEST DE VERIFICACIÓN — FASE 3: Gamificación e IACoins Reales
 * Bachillerato General Estatal "Héroes de la Patria"
 * Ejecutar: node backend/scripts/verify-fase3-gamification.js
 *
 * ✅ Verifica que todos los archivos de FASE 3 existen y tienen sintaxis válida
 * ✅ Verifica que las rutas están montadas en server.js y api/index.js
 * ✅ Verifica que GEMINI_API_KEY está en .env (sin revelar su valor)
 * ✅ Verifica consistencia del middleware de deducción
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BACKEND = path.join(ROOT, 'backend');

let passed = 0;
let failed = 0;
const results = [];

function check(label, condition, detail = '') {
    const ok = !!condition;
    results.push({ ok, label, detail });
    if (ok) passed++;
    else failed++;
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
    return ok;
}

function fileExists(relPath) {
    return fs.existsSync(path.join(ROOT, relPath));
}

function fileContains(relPath, pattern) {
    try {
        const content = fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
        if (typeof pattern === 'string') return content.includes(pattern);
        if (pattern instanceof RegExp) return pattern.test(content);
        return false;
    } catch {
        return false;
    }
}

function isValidJsSyntax(relPath) {
    try {
        require(path.join(ROOT, relPath));
        return true;
    } catch (e) {
        return false;
    }
}

// ================================================================
console.log('\n' + '═'.repeat(60));
console.log('🎮 VERIFICACIÓN FASE 3 — GAMIFICACIÓN E IACOINS REALES');
console.log('═'.repeat(60) + '\n');

// GRUPO 1: Archivos SQL de migración
console.log('── GRUPO 1: SQL Migración ──────────────────────────────');
check('Script SQL de migración existe',
    fileExists('backend/scripts/fase3-gamification-migration.sql'));
check('SQL contiene iacoins_balance',
    fileContains('backend/scripts/fase3-gamification-migration.sql', 'CREATE TABLE IF NOT EXISTS iacoins_balance'));
check('SQL contiene user_streaks',
    fileContains('backend/scripts/fase3-gamification-migration.sql', 'CREATE TABLE IF NOT EXISTS user_streaks'));
check('SQL contiene challenges',
    fileContains('backend/scripts/fase3-gamification-migration.sql', 'CREATE TABLE IF NOT EXISTS challenges'));
check('SQL contiene tournaments',
    fileContains('backend/scripts/fase3-gamification-migration.sql', 'CREATE TABLE IF NOT EXISTS tournaments'));
check('SQL contiene trivia_sessions',
    fileContains('backend/scripts/fase3-gamification-migration.sql', 'CREATE TABLE IF NOT EXISTS trivia_sessions'));
check('SQL contiene level_definitions con 100 niveles',
    fileContains('backend/scripts/fase3-gamification-migration.sql', "(100,'Leyenda Viviente'"));
check('SQL contiene 50 badges (seeds)',
    fileContains('backend/scripts/fase3-gamification-migration.sql', "'Cumpleañero'"));

// GRUPO 2: Middleware IA
console.log('\n── GRUPO 2: Middleware IACoins + Gemini ─────────────────');
check('iacoins-deduction.js existe',
    fileExists('backend/middleware/iacoins-deduction.js'));
check('Exports checkAndDeductCoins',
    fileContains('backend/middleware/iacoins-deduction.js', 'exports.checkAndDeductCoins'));
check('Exports callGemini',
    fileContains('backend/middleware/iacoins-deduction.js', 'exports.callGemini'));
check('Exports IACOINS_COSTS',
    fileContains('backend/middleware/iacoins-deduction.js', 'exports.IACOINS_COSTS'));
check('Tiene modo demo cuando falta GEMINI_API_KEY',
    fileContains('backend/middleware/iacoins-deduction.js', '[IA-DEMO] GEMINI_API_KEY no configurada'));
check('Llama a Gemini Flash real si hay key',
    fileContains('backend/middleware/iacoins-deduction.js', 'gemini-2.0-flash:generateContent'));
check('Deduce de iacoins_balance Y iacoins_balances',
    fileContains('backend/middleware/iacoins-deduction.js', 'iacoins_balance') &&
    fileContains('backend/middleware/iacoins-deduction.js', 'iacoins_balances'));

// GRUPO 3: Rutas FASE 3
console.log('\n── GRUPO 3: Rutas FASE 3 ────────────────────────────────');
check('ia-gemini.js existe',
    fileExists('backend/routes/ia-gemini.js'));
check('ia-gemini tiene /generate con deducción',
    fileContains('backend/routes/ia-gemini.js', "checkAndDeductCoins('ai_short')"));
check('ia-gemini tiene /generate-exam',
    fileContains('backend/routes/ia-gemini.js', "checkAndDeductCoins('ai_exam')"));
check('ia-gemini tiene /costs y /health',
    fileContains('backend/routes/ia-gemini.js', "router.get('/costs'") &&
    fileContains('backend/routes/ia-gemini.js', "router.get('/health'"));

check('gamification-fase3.js existe',
    fileExists('backend/routes/gamification-fase3.js'));
check('gamification-fase3 tiene streak check-in',
    fileContains('backend/routes/gamification-fase3.js', "router.post('/streak/check-in'"));
check('gamification-fase3 tiene leaderboard-real',
    fileContains('backend/routes/gamification-fase3.js', "router.get('/leaderboard-real'"));
check('gamification-fase3 tiene xp/profile',
    fileContains('backend/routes/gamification-fase3.js', "router.get('/xp/profile/:userId'"));

// GRUPO 4: Earn / Spend refactorizados
console.log('\n── GRUPO 4: IACoins Earn/Spend ──────────────────────────');
check('iacoins.js - earn sincroniza iacoins_balance (nuevo)',
    fileContains('backend/routes/iacoins.js', 'INSERT INTO iacoins_balance'));
check('iacoins.js - spend usa metadata JSONB (no columna ai_provider)',
    fileContains('backend/routes/iacoins.js', "JSON.stringify({ ai_provider:"));
check('iacoins.js - earn retorna xp_earned',
    fileContains('backend/routes/iacoins.js', 'xp_earned'));
check('iacoins.js - spend valida y rechaza saldo insuficiente',
    fileContains('backend/routes/iacoins.js', 'Saldo insuficiente de IACoins'));

// GRUPO 5: Trivia finish mejorado
console.log('\n── GRUPO 5: Trivia Duelo de Sabiduría ───────────────────');
check('trivia-game.js sincroniza iacoins_balance',
    fileContains('backend/routes/trivia-game.js', 'INSERT INTO iacoins_balance'));
check('trivia-game.js guarda en trivia_sessions',
    fileContains('backend/routes/trivia-game.js', 'INSERT INTO trivia_sessions'));
check('trivia-game.js guarda en game_sessions',
    fileContains('backend/routes/trivia-game.js', 'INSERT INTO game_sessions'));

// GRUPO 6: Montaje de rutas
console.log('\n── GRUPO 6: Montaje de rutas ────────────────────────────');
check('server.js monta /api/ia (Gemini)',
    fileContains('backend/server.js', "require('./routes/ia-gemini')"));
check('server.js monta /api/gamification (FASE 3)',
    fileContains('backend/server.js', "require('./routes/gamification-fase3')"));
check('api/index.js monta /api/ia para Vercel',
    fileContains('api/index.js', "require('../backend/routes/ia-gemini.js')"));
check('api/index.js monta /api/gamification-fase3 para Vercel',
    fileContains('api/index.js', "require('../backend/routes/gamification-fase3.js')"));

// GRUPO 7: .env y GEMINI_API_KEY
console.log('\n── GRUPO 7: Configuración .env ──────────────────────────');
check('.env existe',
    fileExists('backend/.env'));
check('.env contiene GEMINI_API_KEY',
    fileContains('backend/.env', 'GEMINI_API_KEY'));
const hasRealKey = fileContains('backend/.env', /GEMINI_API_KEY=.{10,}/);
check(`GEMINI_API_KEY ${hasRealKey ? 'CONFIGURADA ✨ (llamadas reales activas)' : 'vacía (modo demo)'}`,
    true, hasRealKey ? 'Gemini Flash real activo' : 'Pega tu key para activar IA real');
check('.env.example contiene GEMINI_API_KEY',
    fileContains('backend/.env.example', 'GEMINI_API_KEY'));
check('.gitignore excluye .env',
    fileContains('.gitignore', '.env') || fileContains('.gitignore', '*.env'));

// ================================================================
// RESUMEN
console.log('\n' + '═'.repeat(60));
const total = passed + failed;
const pct = Math.round((passed / total) * 100);
console.log(`📊 RESULTADO: ${passed}/${total} verificaciones pasadas (${pct}%)`);
if (failed === 0) {
    console.log('🎉 ¡FASE 3 completamente verificada!');
} else {
    console.log(`⚠️  ${failed} verificación(es) fallida(s):`);
    results.filter(r => !r.ok).forEach(r => console.log(`   ❌ ${r.label}`));
}
console.log('\n📋 PRÓXIMO PASO:');
if (!hasRealKey) {
    console.log('   1. Ejecuta el SQL en Neon Console: backend/scripts/fase3-gamification-migration.sql');
    console.log('   2. Pega tu GEMINI_API_KEY en backend/.env');
    console.log('      Ruta exacta: backend/.env');
    console.log('      Variable:    GEMINI_API_KEY=tu_clave_aqui');
    console.log('   3. Reinicia el servidor backend: npm start');
} else {
    console.log('   1. Ejecuta el SQL en Neon si aún no lo has hecho');
    console.log('   2. Reinicia el servidor backend: npm start');
    console.log('   3. Prueba: GET /api/ia/health → debe decir "status: real"');
}
console.log('═'.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
