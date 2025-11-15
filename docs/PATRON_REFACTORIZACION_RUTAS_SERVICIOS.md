# 📋 PATRÓN DE REFACTORIZACIÓN: RUTAS → SERVICIOS

## 🎯 Objetivo

Separar la lógica de negocio de las rutas HTTP moviendo toda la lógica a servicios reutilizables.

---

## 📐 PATRÓN ANTES → DESPUÉS

### ❌ ANTES (Lógica en Ruta)

```javascript
// backend/routes/students.js
const express = require('express');
const { Pool } = require('pg');
const pool = new Pool();

router.get('/', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, especialidad, search } = req.query;
        const offset = (page - 1) * limit;

        // ❌ LÓGICA DE NEGOCIO EN LA RUTA (SQL, filtros, paginación)
        let query = `
            SELECT e.*, u.nombre, u.email
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `;

        const params = [];

        if (especialidad) {
            query += ' AND e.especialidad = $' + (params.length + 1);
            params.push(especialidad);
        }

        if (search) {
            query += ` AND (u.nombre LIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        // ❌ ACCESO DIRECTO AL POOL (Tight coupling)
        const client = await pool.connect();
        const result = await client.query(query, params);
        client.release();

        // ❌ LOG SIN CONDICIONAL CON DATOS SENSIBLES
        console.log('Students fetched:', result.rows.length, 'Query:', query);

        res.json({
            success: true,
            data: result.rows,
            pagination: { page, limit, total: result.rows.length }
        });

    } catch (error) {
        // ❌ ERROR SIN SANITIZAR
        console.error('Error fetching students:', error);
        next(error);
    }
});
```

### ✅ DESPUÉS (Lógica en Servicio)

```javascript
// backend/routes/students.js
const express = require('express');
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');
const StudentService = require('../services/StudentService');

router.get('/', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, especialidad, search } = req.query;

        // ✅ LÓGICA DELEGADA AL SERVICIO
        const filters = {
            page: parseInt(page),
            limit: parseInt(limit),
            especialidad,
            search
        };

        const result = await StudentService.getStudents(filters);

        debugLog.log('STUDENTS', 'Students fetched successfully', { count: result.data.length });

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        debugLog.error('STUDENTS', 'Error in GET /students', sanitizeError(error, 'getStudentsRoute'));
        next(error);
    }
});
```

---

## 🔧 PASO A PASO: CÓMO REFACTORIZAR

### PASO 1: Agregar imports de servicio y logging

```javascript
// Al inicio del archivo de rutas
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');
const StudentService = require('../services/StudentService');
```

### PASO 2: Mover lógica de negocio al servicio

**Identificar:**
- Queries SQL directas
- Lógica de filtros/paginación
- Validaciones de datos
- Transformaciones de datos
- Accesos a pool/client directos

**Mover a servicio:**
```javascript
// En StudentService.js
async getStudents(filters = {}) {
    debugLog.log('STUDENT', 'Fetching students', { filterCount: Object.keys(filters).length });

    try {
        const { page = 1, limit = 20, especialidad, search, estatus = 'activo' } = filters;
        const offset = (page - 1) * limit;

        // Construir query dinámicamente
        let query = `
            SELECT e.*, u.nombre, u.email
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE u.activo = TRUE
        `;

        const params = [];

        if (estatus && estatus !== 'todos') {
            query += ` AND e.estatus = $${params.length + 1}`;
            params.push(estatus);
        }

        if (especialidad) {
            query += ` AND e.especialidad = $${params.length + 1}`;
            params.push(especialidad);
        }

        if (search) {
            query += ` AND (u.nombre ILIKE $${params.length + 1} OR e.matricula ILIKE $${params.length + 2})`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        // Usar DAL (database-access.js) en lugar de pool directo
        const db = require('../data/database-access');
        const students = await db.executeQuery(query, params);

        // Obtener total para paginación
        const countQuery = `SELECT COUNT(*) FROM estudiantes e JOIN usuarios u ON e.usuario_id = u.id WHERE u.activo = TRUE`;
        const totalResult = await db.executeQuery(countQuery);
        const total = parseInt(totalResult[0].count);

        debugLog.log('STUDENT', 'Students fetched', { count: students.length, total });

        return {
            data: students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        debugLog.error('STUDENT', 'Error fetching students', sanitizeError(error, 'getStudents'));
        throw error;
    }
}
```

### PASO 3: Simplificar la ruta

```javascript
// Ruta simplificada
router.get('/', authenticateToken, requireTeacher, async (req, res, next) => {
    try {
        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            especialidad: req.query.especialidad,
            search: req.query.search,
            estatus: req.query.estatus
        };

        const result = await StudentService.getStudents(filters);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        debugLog.error('STUDENTS', 'Error in GET /students', sanitizeError(error, 'getStudentsRoute'));
        next(error);
    }
});
```

### PASO 4: Validar sintaxis

```bash
node -c backend/routes/students.js
node -c backend/services/StudentService.js
```

---

## 📊 RUTAS A REFACTORIZAR (18 ARCHIVOS)

### Prioridad Alta (5 rutas)
1. ✅ `backend/routes/students.js` → StudentService (EJEMPLO COMPLETO ARRIBA)
2. ⏳ `backend/routes/approvals.js` → ApprovalService
3. ⏳ `backend/routes/auth.js` → authService (ya existe)
4. ⏳ `backend/routes/admin.js` → StudentService + ApprovalService
5. ⏳ `backend/routes/uploads.js` → UploadService

### Prioridad Media (6 rutas)
6. ⏳ `backend/routes/teachers.js` → TeacherService (crear)
7. ⏳ `backend/routes/parents.js` → ParentService (crear)
8. ⏳ `backend/routes/grades.js` → GradeService (crear)
9. ⏳ `backend/routes/notifications.js` → notificationService (ya existe)
10. ⏳ `backend/routes/calendar.js` → calendarService (ya existe)
11. ⏳ `backend/routes/cms.js` → cmsService (ya existe)

### Prioridad Baja (7 rutas)
12. ⏳ `backend/routes/analytics.js` → analyticsService (ya existe)
13. ⏳ `backend/routes/chatbot.js` → ChatbotService (crear)
14. ⏳ `backend/routes/egresados.js` → EgresadosService (crear)
15. ⏳ `backend/routes/bolsa-trabajo.js` → JobService (crear)
16. ⏳ `backend/routes/citas.js` → AppointmentService (crear)
17. ⏳ `backend/routes/convocatorias.js` → ConvocatoriasService (crear)
18. ⏳ `backend/routes/subscriptions.js` → SubscriptionService (crear)

---

## ✅ CHECKLIST DE REFACTORIZACIÓN

Para cada ruta refactorizada:

- [ ] Imports de servicio y logging agregados
- [ ] Lógica de negocio movida al servicio
- [ ] Ruta simplificada (solo maneja HTTP)
- [ ] Logs sanitizados (debugLog)
- [ ] Errores sanitizados (sanitizeError)
- [ ] Sintaxis validada (node -c)
- [ ] Middlewares preservados (authenticateToken, requireAdmin, etc)
- [ ] Tests manuales completados (opcional)

---

## 🎯 BENEFICIOS

✅ **Reutilización:** Servicios pueden ser usados desde múltiples rutas

✅ **Testing:** Servicios son fáciles de testear en aislamiento

✅ **Mantenibilidad:** Lógica centralizada en un solo lugar

✅ **GDPR:** Logging condicional y sanitización de errores

✅ **Separación de Concerns:** Rutas solo manejan HTTP, servicios manejan lógica

---

## 📝 NOTAS IMPORTANTES

1. **NO eliminar middlewares de autenticación:** authenticateToken, requireAdmin, etc deben permanecer en las rutas

2. **Validación de entrada:** Puede quedar en rutas (express-validator) o moverse a servicios

3. **Manejo de errores:** Rutas usan `next(error)`, servicios lanzan errors

4. **Logging:** Servicios loguean detalles, rutas loguean contexto HTTP

5. **Transacciones SQL:** Si una ruta tiene transacciones complejas, moverlas COMPLETAS al servicio

---

## 🔄 WORKFLOW RECOMENDADO

```bash
# 1. Leer ruta existente
cat backend/routes/students.js | head -100

# 2. Identificar lógica a mover
# - SQL queries
# - Validaciones de negocio
# - Transformaciones de datos

# 3. Mover lógica al servicio
# Editar backend/services/StudentService.js

# 4. Simplificar ruta
# Editar backend/routes/students.js

# 5. Validar sintaxis
node -c backend/routes/students.js
node -c backend/services/StudentService.js

# 6. Testing manual (opcional)
curl http://localhost:3000/api/students?page=1&limit=10
```

---

**Fin del documento** ✅
