require('dotenv').config({path:'.env'});
const{pool}=require('./backend/config/database');

(async()=>{
  try {
    // Bolsa trabajo
    const bt=await pool.query(`SELECT column_name,data_type FROM information_schema.columns WHERE table_name='bolsa_trabajo' ORDER BY ordinal_position`);
    console.log('\n📋 COLUMNAS bolsa_trabajo:');
    bt.rows.forEach(c=>console.log(`  - ${c.column_name} (${c.data_type})`));

    // Parents
    const p=await pool.query(`SELECT column_name,data_type FROM information_schema.columns WHERE table_name='parents' ORDER BY ordinal_position`);
    console.log('\n👨‍👩‍👧 COLUMNAS parents:');
    p.rows.forEach(c=>console.log(`  - ${c.column_name} (${c.data_type})`));

    await pool.end();
  } catch(e) {
    console.error('Error:',e.message);
    process.exit(1);
  }
})();
