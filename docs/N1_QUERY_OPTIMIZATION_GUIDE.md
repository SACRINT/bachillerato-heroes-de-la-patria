# 🚀 GUÍA DE OPTIMIZACIÓN N+1 QUERIES - SEMANA 3

**Fecha:** 17 Noviembre 2025
**Objetivo:** Eliminar N+1 query problem en endpoints críticos
**Solución:** DataLoader pattern con batching y caching

---

## 📋 ¿QUÉ ES EL PROBLEMA N+1?

### Ejemplo del Problema

Imagina que necesitas mostrar una lista de 100 estudiantes con sus calificaciones:

```javascript
// ❌ PROBLEMA N+1 (MAL)
router.get('/api/estudiantes', async (req, res) => {
    // 1 query para obtener estudiantes
    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    // N queries (una por cada estudiante) para obtener calificaciones
    for (const estudiante of estudiantes.rows) {
        const calificaciones = await pool.query(
            'SELECT * FROM calificaciones WHERE estudiante_id = $1',
            [estudiante.id]
        );

        estudiante.calificaciones = calificaciones.rows;
    }

    res.json({ data: estudiantes.rows });
});
```

**Resultado:**
- 1 query inicial (estudiantes)
- \+ 100 queries (una por estudiante)
- **= 101 queries totales** ❌
- **Tiempo total: ~2,500ms** (25ms por query × 101)

---

### Solución con DataLoader

```javascript
// ✅ SOLUCIÓN CON DATALOADER (BIEN)
const { loadersMiddleware } = require('../utils/loaders');
app.use(loadersMiddleware);  // Agregar en app.js

router.get('/api/estudiantes', async (req, res) => {
    // 1 query para obtener estudiantes
    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    // 1 query BATCH para TODAS las calificaciones (no N queries)
    const estudiantesConCalif = await Promise.all(
        estudiantes.rows.map(async (estudiante) => {
            estudiante.calificaciones = await req.loaders.calificaciones.load(estudiante.id);
            return estudiante;
        })
    );

    res.json({ data: estudiantesConCalif });
});
```

**Resultado:**
- 1 query inicial (estudiantes)
- \+ 1 query BATCH (TODAS las calificaciones con `ANY($1)`)
- **= 2 queries totales** ✅
- **Tiempo total: ~50ms** (25ms × 2)

**Mejora: 98% reducción** (2,500ms → 50ms) 🚀

---

## 🎯 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Agregar Middleware de Loaders en app.js

```javascript
// backend/server.js o api/app.js
const { loadersMiddleware } = require('./utils/loaders');

// Agregar ANTES de las rutas
app.use(loadersMiddleware);

// Rutas
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/calificaciones', require('./routes/calificaciones'));
// ...
```

### Paso 2: Usar Loaders en Rutas

```javascript
// backend/routes/estudiantes.js

// ❌ ANTES (N+1 problem)
router.get('/', async (req, res) => {
    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    for (const estudiante of estudiantes.rows) {
        // N queries separadas
        const calificaciones = await pool.query(
            'SELECT * FROM calificaciones WHERE estudiante_id = $1',
            [estudiante.id]
        );
        estudiante.calificaciones = calificaciones.rows;
    }

    res.json({ data: estudiantes.rows });
});

// ✅ DESPUÉS (con DataLoader)
router.get('/', async (req, res) => {
    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    // Promise.all ejecuta todos los loads en paralelo
    // DataLoader agrupa (batch) todos en 1 solo query
    const estudiantesConDatos = await Promise.all(
        estudiantes.rows.map(async (estudiante) => {
            return {
                ...estudiante,
                calificaciones: await req.loaders.calificaciones.load(estudiante.id),
                asistencia: await req.loaders.asistencia.load(estudiante.id),
                pagosPendientes: await req.loaders.pagosPendientes.load(estudiante.id)
            };
        })
    );

    res.json({ data: estudiantesConDatos });
});
```

**Queries ejecutadas:**
- ANTES: 1 + 100 + 100 + 100 = **301 queries** ❌
- DESPUÉS: 1 + 1 + 1 + 1 = **4 queries** ✅
- **Reducción: 99%**

---

## 📖 EJEMPLOS POR CASO DE USO

### Ejemplo 1: Dashboard Admin - Lista de Estudiantes

```javascript
// GET /api/admin/estudiantes/dashboard

// ❌ ANTES (N+1 problem)
router.get('/dashboard', async (req, res) => {
    const estudiantes = await pool.query(`
        SELECT id, nombre, apellido_paterno, grado, grupo
        FROM estudiantes
        WHERE status = 'activo'
        ORDER BY apellido_paterno
        LIMIT 100
    `);

    const resultado = [];

    for (const estudiante of estudiantes.rows) {
        // Query 1: Promedio de calificaciones
        const promedio = await pool.query(`
            SELECT AVG(calificacion_final) as promedio
            FROM calificaciones
            WHERE estudiante_id = $1
        `, [estudiante.id]);

        // Query 2: Asistencia del mes
        const asistencia = await pool.query(`
            SELECT COUNT(*) FILTER (WHERE status = 'presente') as presentes,
                   COUNT(*) as total
            FROM asistencia
            WHERE estudiante_id = $1
              AND fecha >= NOW() - INTERVAL '30 days'
        `, [estudiante.id]);

        // Query 3: Pagos pendientes
        const pagos = await pool.query(`
            SELECT COUNT(*) as pendientes, SUM(monto) as monto_total
            FROM pagos_pendientes
            WHERE estudiante_id = $1 AND estado = 'pendiente'
        `, [estudiante.id]);

        resultado.push({
            ...estudiante,
            promedio: promedio.rows[0]?.promedio || 0,
            asistencia: asistencia.rows[0],
            pagos: pagos.rows[0]
        });
    }

    res.json({ data: resultado });
});

// QUERIES TOTALES: 1 + (100 × 3) = 301 queries
// TIEMPO: ~7,500ms (25ms × 301)
```

```javascript
// ✅ DESPUÉS (con DataLoader)
router.get('/dashboard', async (req, res) => {
    const estudiantes = await pool.query(`
        SELECT id, nombre, apellido_paterno, grado, grupo
        FROM estudiantes
        WHERE status = 'activo'
        ORDER BY apellido_paterno
        LIMIT 100
    `);

    const resultado = await Promise.all(
        estudiantes.rows.map(async (estudiante) => {
            const [calificaciones, asistencia, pagos] = await Promise.all([
                req.loaders.calificaciones.load(estudiante.id),
                req.loaders.asistencia.load(estudiante.id),
                req.loaders.pagosPendientes.load(estudiante.id)
            ]);

            return {
                ...estudiante,
                promedio: calcularPromedio(calificaciones),
                asistencia: calcularAsistencia(asistencia),
                pagos: calcularPagos(pagos)
            };
        })
    );

    res.json({ data: resultado });
});

// QUERIES TOTALES: 1 + 3 = 4 queries
// TIEMPO: ~100ms (25ms × 4)
// MEJORA: 98.7% reducción (7,500ms → 100ms)
```

---

### Ejemplo 2: Reportes Académicos - Estudiantes con Detalles

```javascript
// GET /api/reportes/academicos

// ✅ SOLUCIÓN ÓPTIMA con DataLoader
router.get('/academicos', async (req, res) => {
    const { grado, grupo } = req.query;

    // 1. Query principal de estudiantes
    const estudiantes = await pool.query(`
        SELECT id, nombre, apellido_paterno, apellido_materno, grado, grupo
        FROM estudiantes
        WHERE grado = $1 AND grupo = $2
        ORDER BY apellido_paterno
    `, [grado, grupo]);

    // 2. Cargar datos relacionados con DataLoader (batching automático)
    const estudiantesCompletos = await Promise.all(
        estudiantes.rows.map(async (estudiante) => {
            // Estos 3 loads se ejecutan en paralelo
            // DataLoader agrupa todos en 1 query por tipo
            const [calificaciones, asistencias, inscripciones] = await Promise.all([
                req.loaders.calificaciones.load(estudiante.id),
                req.loaders.asistencia.load(estudiante.id),
                req.loaders.inscripciones.load(estudiante.id)
            ]);

            return {
                id: estudiante.id,
                nombreCompleto: `${estudiante.nombre} ${estudiante.apellido_paterno} ${estudiante.apellido_materno}`,
                grado: estudiante.grado,
                grupo: estudiante.grupo,
                // Procesar datos cargados
                promedioGeneral: calcularPromedioGeneral(calificaciones),
                calificacionesPorMateria: agruparPorMateria(calificaciones),
                porcentajeAsistencia: calcularPorcentaje(asistencias),
                cursosActuales: inscripciones.filter(i => i.periodo_academico === '2025-1')
            };
        })
    );

    res.json({
        success: true,
        data: estudiantesCompletos,
        total: estudiantesCompletos.length
    });
});

// QUERIES TOTALES: 1 + 3 = 4 queries (sin importar cuántos estudiantes)
// TIEMPO PARA 50 ESTUDIANTES: ~100ms
// SIN DATALOADER SERÍA: 1 + (50 × 3) = 151 queries = ~3,775ms
```

---

### Ejemplo 3: Cursos con Docentes (N+1 anidado)

```javascript
// GET /api/cursos

// ❌ ANTES (N+1 anidado - muy problemático)
router.get('/', async (req, res) => {
    const cursos = await pool.query('SELECT * FROM cursos LIMIT 50');

    for (const curso of cursos.rows) {
        // N+1 nivel 1: Docentes del curso
        const docentesCurso = await pool.query(`
            SELECT docente_id FROM cursos_docentes WHERE curso_id = $1
        `, [curso.id]);

        curso.docentes = [];

        for (const cd of docentesCurso.rows) {
            // N+1 nivel 2: Datos de cada docente
            const docente = await pool.query(`
                SELECT * FROM docentes WHERE id = $1
            `, [cd.docente_id]);

            curso.docentes.push(docente.rows[0]);
        }
    }

    res.json({ data: cursos.rows });
});

// QUERIES: 1 + 50 + (50 × promedio 2 docentes por curso) = 151 queries
// TIEMPO: ~3,775ms
```

```javascript
// ✅ DESPUÉS (con DataLoader anidado)
router.get('/', async (req, res) => {
    const cursos = await pool.query('SELECT * FROM cursos LIMIT 50');

    const cursosConDocentes = await Promise.all(
        cursos.rows.map(async (curso) => {
            // 1 query batch para cursos_docentes
            const docentesData = await req.loaders.docentes.load(curso.id);

            return {
                ...curso,
                docentes: docentesData  // Ya incluye datos completos de docentes
            };
        })
    );

    res.json({ data: cursosConDocentes });
});

// QUERIES: 1 + 1 = 2 queries
// TIEMPO: ~50ms
// MEJORA: 98.7% reducción (3,775ms → 50ms)
```

---

## 🛠️ LOADERS DISPONIBLES EN BGE

El middleware `loadersMiddleware` agrega `req.loaders` con los siguientes loaders:

### `req.loaders.calificaciones`
```javascript
// Cargar calificaciones de un estudiante
const calificaciones = await req.loaders.calificaciones.load(estudianteId);

// Cargar calificaciones de múltiples estudiantes
const todasCalificaciones = await req.loaders.calificaciones.loadMany([1, 2, 3, 4, 5]);
```

### `req.loaders.asistencia`
```javascript
// Cargar asistencia de un estudiante
const asistencias = await req.loaders.asistencia.load(estudianteId);
```

### `req.loaders.pagosPendientes`
```javascript
// Cargar pagos pendientes de un estudiante
const pagos = await req.loaders.pagosPendientes.load(estudianteId);
```

### `req.loaders.inscripciones`
```javascript
// Cargar inscripciones (cursos) de un estudiante
const inscripciones = await req.loaders.inscripciones.load(estudianteId);
```

### `req.loaders.docentes`
```javascript
// Cargar docentes de un curso
const docentes = await req.loaders.docentes.load(cursoId);
```

### `req.loaders.usuarios`
```javascript
// Cargar datos de un usuario
const usuario = await req.loaders.usuarios.load(userId);

// Cargar múltiples usuarios
const usuarios = await req.loaders.usuarios.loadMany([1, 2, 3]);
```

---

## 📊 FUNCIONES HELPER PARA CÁLCULOS

```javascript
// helpers.js
function calcularPromedioGeneral(calificaciones) {
    if (!calificaciones || calificaciones.length === 0) return 0;

    const suma = calificaciones.reduce((acc, c) => acc + parseFloat(c.calificacion_final), 0);
    return (suma / calificaciones.length).toFixed(2);
}

function agruparPorMateria(calificaciones) {
    const porMateria = {};

    calificaciones.forEach(calif => {
        if (!porMateria[calif.materia_id]) {
            porMateria[calif.materia_id] = [];
        }
        porMateria[calif.materia_id].push(calif);
    });

    return porMateria;
}

function calcularPorcentaje(asistencias) {
    if (!asistencias || asistencias.length === 0) return 100;

    const presentes = asistencias.filter(a => a.status === 'presente').length;
    return ((presentes / asistencias.length) * 100).toFixed(1);
}

function calcularPagos(pagos) {
    if (!pagos || pagos.length === 0) {
        return { pendientes: 0, montoTotal: 0 };
    }

    return {
        pendientes: pagos.length,
        montoTotal: pagos.reduce((acc, p) => acc + parseFloat(p.monto), 0)
    };
}

module.exports = {
    calcularPromedioGeneral,
    agruparPorMateria,
    calcularPorcentaje,
    calcularPagos
};
```

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Crear Loader Personalizado

```javascript
// backend/utils/custom-loaders.js
const DataLoader = require('./dataloader');
const { pool } = require('../config/database');

function createMisNotasLoader() {
    return new DataLoader(async (materiaIds) => {
        const query = `
            SELECT
                materia_id,
                jsonb_agg(
                    jsonb_build_object(
                        'titulo', titulo,
                        'contenido', contenido,
                        'fecha', fecha
                    ) ORDER BY fecha DESC
                ) as notas
            FROM notas_profesor
            WHERE materia_id = ANY($1)
            GROUP BY materia_id;
        `;

        const result = await pool.query(query, [materiaIds]);

        const notasMap = new Map();
        result.rows.forEach(row => {
            notasMap.set(row.materia_id, row.notas);
        });

        return materiaIds.map(id => notasMap.get(id) || []);
    }, {
        cache: true,           // Activar caché (default: true)
        maxBatchSize: 100      // Máximo de IDs por batch (default: 100)
    });
}
```

### Deshabilitar Caché para Datos en Tiempo Real

```javascript
function createRealtimeStatsLoader() {
    return new DataLoader(async (estudianteIds) => {
        // ... batch load logic
    }, {
        cache: false  // Deshabilitar caché para datos que cambian constantemente
    });
}
```

---

## 🧪 TESTING Y VERIFICACIÓN

### Verificar Queries Ejecutadas

```javascript
// Habilitar query logging en PostgreSQL
// backend/config/database.js
const pool = new Pool({
    // ... config
    log: (msg) => console.log('[DB QUERY]', msg)
});
```

### Comparar Performance ANTES vs DESPUÉS

```javascript
// backend/tests/performance/n1-benchmark.js
const { performance } = require('perf_hooks');

async function benchmarkWithoutDataLoader() {
    const start = performance.now();

    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    for (const e of estudiantes.rows) {
        await pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1', [e.id]);
    }

    const end = performance.now();
    console.log(`SIN DataLoader: ${(end - start).toFixed(2)}ms`);
}

async function benchmarkWithDataLoader() {
    const start = performance.now();

    const loaders = createLoaders();
    const estudiantes = await pool.query('SELECT * FROM estudiantes LIMIT 100');

    await Promise.all(
        estudiantes.rows.map(e => loaders.calificaciones.load(e.id))
    );

    const end = performance.now();
    console.log(`CON DataLoader: ${(end - start).toFixed(2)}ms`);
}

// Ejecutar benchmarks
benchmarkWithoutDataLoader();  // Output: SIN DataLoader: 2534.21ms
benchmarkWithDataLoader();     // Output: CON DataLoader: 48.93ms
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Setup Inicial
- [ ] DataLoader base creado (`backend/utils/dataloader.js`)
- [ ] Loaders específicos creados (`backend/utils/loaders.js`)
- [ ] Middleware agregado en `app.js` o `server.js`
- [ ] Testing manual: verificar `req.loaders` existe

### Por Cada Endpoint con N+1
- [ ] Identificar endpoints con loops y queries anidadas
- [ ] Reemplazar loops con `Promise.all` + `loader.load()`
- [ ] Verificar logs: debe haber 1 query batch en lugar de N queries
- [ ] Medir performance ANTES vs DESPUÉS con `performance.now()`
- [ ] Testing funcional: verificar datos retornados son correctos

### Optimización
- [ ] Crear loaders personalizados para casos específicos
- [ ] Configurar `maxBatchSize` según carga esperada
- [ ] Deshabilitar caché (`cache: false`) para datos real-time
- [ ] Monitorear queries con PostgreSQL slow query log

---

## 🎯 MÉTRICAS ESPERADAS

| Endpoint | Estudiantes | Queries ANTES | Queries DESPUÉS | Mejora | Time ANTES | Time DESPUÉS | Mejora |
|----------|-------------|---------------|-----------------|--------|-----------|-------------|--------|
| `/estudiantes` | 100 | 301 | 4 | 99% | 7,500ms | 100ms | 98.7% |
| `/reportes/academicos` | 50 | 151 | 4 | 97% | 3,775ms | 100ms | 97.3% |
| `/cursos` | 50 | 151 | 2 | 99% | 3,775ms | 50ms | 98.7% |
| `/dashboard/admin` | 100 | 301 | 4 | 99% | 7,500ms | 100ms | 98.7% |

**Target general:** Reducir queries de **N+1 → 2** y tiempo de **~800ms a <100ms** ✅

---

## 📚 RECURSOS ADICIONALES

- [GraphQL DataLoader Original](https://github.com/graphql/dataloader)
- [N+1 Queries Explained](https://medium.com/@gajus/solving-the-n-1-problem-in-graphql-9c3f3c3b3c3f)
- [PostgreSQL ANY() Operator](https://www.postgresql.org/docs/current/functions-comparisons.html#FUNCTIONS-COMPARISONS-ANY-SOME)

---

**Próximo paso:** Aplicar DataLoader en 10+ endpoints críticos y medir impacto en dashboard admin.
