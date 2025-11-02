require('dotenv').config({path:'.env'});
const{pool}=require('./backend/config/database');

(async()=>{
  try {
    console.log('🔧 Agregando columna student_id a tabla parents...\n');

    // Agregar student_id
    await pool.query(`ALTER TABLE parents ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES estudiantes(id) ON DELETE SET NULL`);
    console.log('✅ Columna student_id agregada');

    // Verificar
    const r=await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='parents' ORDER BY ordinal_position`);
    console.log('\n📋 Columnas actuales en parents:');
    r.rows.forEach(c=>console.log(`  - ${c.column_name}`));

    await pool.end();
    console.log('\n✅ TABLA PARENTS CORREGIDA');
  } catch(e) {
    console.error('❌ Error:',e.message);
    process.exit(1);
  }
})();
