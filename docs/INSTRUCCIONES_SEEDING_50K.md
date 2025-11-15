# 🌱 INSTRUCCIONES: SEEDING DE 50,000 REGISTROS

**Fecha:** 10 de Noviembre de 2025
**Objetivo:** Generar datos realistas para validar que el índice se utilice

---

## 📋 RESUMEN

PostgreSQL usa **Seq Scan** cuando la tabla es pequeña (10 filas) porque es más eficiente que un Index Scan. Con **50,000 filas**, el planificador elegirá automáticamente el índice.

El script `seed-estudiantes.js` genera 50,000 registros realistas usando `faker-js` y los inserta en batches de 500.

---

## ⚙️ REQUISITOS PREVIOS

✅ **Dependencias Necesarias:**
- `pg` (node-postgres) - Ya instalado
- `@faker-js/faker` - Necesita verificación

**Verificar instalación:**
```bash
npm list @faker-js/faker
```

**Si NO está instalado, ejecutar:**
```bash
npm install @faker-js/faker --save-dev
```

---

## 🚀 PASOS DE EJECUCIÓN

### PASO 1: Instalar faker-js (si no está)

```bash
cd C:\03_BachilleratoHeroesWeb
npm install @faker-js/faker --save-dev
```

**Resultado esperado:**
```
added X packages
```

---

### PASO 2: Ejecutar Script de Seeding

**Comando:**
```bash
node backend/scripts/seed-estudiantes.js
```

**Ubicación:** Ejecutar desde `C:\03_BachilleratoHeroesWeb`

**Duración esperada:** 2-5 minutos (depende del servidor BD)

**Salida esperada:**
```
🌱 INICIANDO SCRIPT DE SEEDING DE ESTUDIANTES

═══════════════════════════════════════════════════════════

📋 PASO 1: Vaciando tabla estudiantes...
✅ Tabla vaciada correctamente

🔄 PASO 2: Generando 50,000 registros de estudiantes...
✅ Registros generados exitosamente

📤 PASO 3: Insertando registros en batches...
📦 Se crearán 100 batches de 500 registros cada uno
✅ Batch 1/100 completado (500/50000 registros, 1.00%)
✅ Batch 2/100 completado (1000/50000 registros, 2.00%)
...
✅ Batch 100/100 completado (50000/50000 registros, 100.00%)
✅ Total de registros insertados: 50000

📊 PASO 4: Actualizando estadísticas de PostgreSQL...
✅ Estadísticas actualizadas

✔️  PASO 5: Verificando conteo de registros...
✅ Total de registros en la tabla: 50000

═══════════════════════════════════════════════════════════

🎉 SEEDING COMPLETADO EXITOSAMENTE

📌 La tabla ahora contiene datos suficientes para que el planificador de
   PostgreSQL elija usar el Index Scan en lugar de Seq Scan.

🔍 Próximo paso: Ejecutar EXPLAIN ANALYZE en Neon Console para validar
```

---

### PASO 3: Validar Index Scan en Neon Console

**Ir a:** https://console.neon.tech → SQL Editor

**Ejecutar la siguiente consulta:**
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    matricula,
    nombre,
    apellido_paterno,
    apellido_materno,
    especialidad,
    semestre,
    promedio,
    status_academico
FROM estudiantes
ORDER BY apellido_paterno, apellido_materno, nombre ASC;
```

**Resultado ESPERADO:**
- ✅ **Index Scan using idx_estudiantes_apellidos_nombre** (en lugar de Seq Scan)
- ✅ Execution Time: 20-100ms
- ✅ Planning Time: < 1ms

**Resultado INCORRECTO (aún Seq Scan):**
- ❌ Seq Scan on estudiantes
- Esto significa que el índice aún no está siendo usado

---

### PASO 4: Captura de Pantalla de Validación

**Tomar screenshot del resultado EXPLAIN ANALYZE** mostrando:
- Grid View con "Index Scan" confirmado
- Execution time medido
- Plan tab con desglose de nodos

---

### PASO 5: Limpiar la Base de Datos (IMPORTANTE)

Una vez validado el Index Scan, ejecutar en Neon Console:

```sql
TRUNCATE TABLE estudiantes RESTART IDENTITY CASCADE;
```

**Resultado esperado:**
```
TRUNCATE TABLE
```

Esto deja la tabla lista para desarrollo nuevamente con 0 registros.

---

## 📊 INFORMACIÓN DEL SCRIPT

### Características

- **Generador:** @faker-js/faker (locale: es_MX)
- **Registros:** 50,000
- **Batch Size:** 500 registros por inserción
- **Duración:** ~2-5 minutos
- **Performance:** ~10,000 registros/minuto

### Datos Generados

Para cada estudiante se generan:
```javascript
{
    nombre: faker.person.firstName(),
    apellido_paterno: faker.person.lastName(),
    apellido_materno: faker.person.lastName(),
    matricula: "EST-{timestamp}-{random}",
    especialidad: [Administración, Contabilidad, Informática, ...],
    semestre: [1-6],
    promedio: [0-100],
    status_academico: [activo, baja_temporal, graduado, ...],
    fecha_nacimiento: [edad 16-40],
    genero: [M, F],
    telefono: [10 dígitos],
    direccion: faker.location.streetAddress(),
    fecha_ingreso: [últimos 4 años],
    curp: [18 caracteres alphanumeric]
}
```

### Especialidades Disponibles
- Administración
- Contabilidad
- Informática
- Enfermería
- Educación
- Ingeniería
- Recursos Humanos
- Logística

### Estados Académicos
- activo
- baja_temporal
- baja_permanente
- suspendido
- graduado

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find module '@faker-js/faker'"

**Solución:**
```bash
npm install @faker-js/faker --save-dev
```

---

### Error: "Connection refused"

**Verifica:**
1. ¿La variable `DATABASE_URL` está configurada?
2. ¿Neon/Base de datos está accesible?

**Si usas variable local:**
```bash
set DATABASE_URL=postgresql://user:password@host:port/dbname
node backend/scripts/seed-estudiantes.js
```

---

### Error: "relation 'estudiantes' does not exist"

**Solución:** Asegúrate que la tabla existe en Neon:
```sql
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    matricula VARCHAR,
    nombre VARCHAR,
    apellido_paterno VARCHAR,
    apellido_materno VARCHAR,
    especialidad VARCHAR,
    semestre INTEGER,
    promedio NUMERIC,
    status_academico VARCHAR,
    -- ... otras columnas
);
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] faker-js instalado (`npm install @faker-js/faker --save-dev`)
- [ ] Script creado: `backend/scripts/seed-estudiantes.js`
- [ ] Sintaxis validada: `node -c backend/scripts/seed-estudiantes.js`
- [ ] Conexión a BD verificada
- [ ] Script ejecutado: `node backend/scripts/seed-estudiantes.js`
- [ ] Seeding completó exitosamente (50,000 registros insertados)
- [ ] EXPLAIN ANALYZE ejecutado en Neon Console
- [ ] Index Scan confirmado (en lugar de Seq Scan)
- [ ] Screenshot tomado del resultado
- [ ] Tabla limpiada: `TRUNCATE TABLE estudiantes RESTART IDENTITY CASCADE`

---

## 📝 NOTAS

- El seeding toma **2-5 minutos** dependiendo de la conexión a BD
- Los datos son **completamente aleatorios y realistas**
- El script hace **TRUNCATE** automáticamente al inicio
- Las estadísticas se actualizan con **ANALYZE** al final
- Una vez validado, **SIEMPRE ejecutar TRUNCATE** para limpiar

---

## 🎯 SIGUIENTE PASO

Después de completar estos pasos:
1. ✅ Validar Index Scan en Neon
2. ✅ Limpiar tabla (TRUNCATE)
3. ✅ Crear commit: `test(db): Re-validar índice con datos de carga (50k)`
4. ✅ Push a GitHub

---

**Estimado de tiempo total:** 10-15 minutos

🧠 Generated with Claude Code
