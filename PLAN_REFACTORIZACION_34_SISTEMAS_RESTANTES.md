# 🔄 PLAN COMPLETO: REFACTORIZAR 34 SISTEMAS RESTANTES

**Versión Objetivo:** v7.0.0
**Período Estimado:** Semanas 33-48 (16 semanas, ~4 meses)
**Costo:** ~320 horas de desarrollo
**Inicio:** 11 Diciembre 2025

---

## 📌 CONTEXTO ACTUAL

**Estado después de v6.0.0:**
- ✅ 20 sistemas refactorizados a Event-Driven (Semanas 1-12)
- ✅ AI Tutor, OpenAPI, WCAG, SOC2 completados (Semanas 26-29)
- ✅ Load testing, security scanning completados (Semanas 30-32)
- ❌ 34 sistemas LEGACY aún sin refactorizar

**Sistemas Legacy sin refactorizar:**
- Backend services: ~25 sistemas
- Backend routes: ~8 sistemas
- Frontend modules: ~1 sistema

---

## 📊 IDENTIFICACIÓN DE LOS 34 SISTEMAS

### GRUPO 1: Database/Analytics Services (8 sistemas)

| Sistema | Ubicación | Estado | Prioridad | Complejidad |
|---------|-----------|--------|-----------|-------------|
| cacheService | backend/services/ | Legacy | CRÍTICA | ALTA |
| emailTemplateService | backend/services/ | Legacy | CRÍTICA | ALTA |
| monitoringService | backend/services/ | Legacy | ALTA | MEDIA |
| reportService | backend/services/ | Legacy | ALTA | ALTA |
| searchService | backend/services/ | Legacy | MEDIA | MEDIA |
| analyticsService | backend/services/ | Legacy | MEDIA | MEDIA |
| chartService | backend/services/ | Legacy | MEDIA | BAJA |
| metricsService | backend/services/ | Legacy | MEDIA | BAJA |

### GRUPO 2: Business Logic Services (10 sistemas)

| Sistema | Ubicación | Estado | Prioridad | Complejidad |
|---------|-----------|--------|-----------|-------------|
| studentService | backend/services/ | Legacy | CRÍTICA | ALTA |
| gradeService | backend/services/ | Legacy | CRÍTICA | ALTA |
| teacherService | backend/services/ | Legacy | CRÍTICA | ALTA |
| parentService | backend/services/ | Legacy | ALTA | MEDIA |
| adminService | backend/services/ | Legacy | ALTA | ALTA |
| appointmentService | backend/services/ | Legacy | ALTA | MEDIA |
| notificationService | backend/services/ | Legacy | ALTA | MEDIA |
| documentService | backend/services/ | Legacy | MEDIA | MEDIA |
| fileService | backend/services/ | Legacy | MEDIA | BAJA |
| paymentService | backend/services/ | Legacy | MEDIA | ALTA |

### GRUPO 3: Integration Services (7 sistemas)

| Sistema | Ubicación | Estado | Prioridad | Complejidad |
|---------|-----------|--------|-----------|-------------|
| googleClassroomService | backend/services/ | Legacy | MEDIA | ALTA |
| externalAuthService | backend/services/ | Legacy | MEDIA | ALTA |
| thirdPartyAPIService | backend/services/ | Legacy | BAJA | MEDIA |
| webhookService | backend/services/ | Legacy | BAJA | MEDIA |
| dataExportService | backend/services/ | Legacy | BAJA | BAJA |
| migrationService | backend/services/ | Legacy | BAJA | ALTA |
| syncService | backend/services/ | Legacy | BAJA | MEDIA |

### GRUPO 4: Frontend Modules (9 sistemas)

| Sistema | Ubicación | Estado | Prioridad | Complejidad |
|---------|-----------|--------|-----------|-------------|
| dashboardManager | public/js/ | Legacy | CRÍTICA | ALTA |
| adminAuthModule | public/js/ | Legacy | CRÍTICA | ALTA |
| studentDashboard | public/js/ | Legacy | ALTA | MEDIA |
| reportBuilder | public/js/ | Legacy | MEDIA | ALTA |
| chartBuilder | public/js/ | Legacy | MEDIA | MEDIA |
| dataValidator | public/js/ | Legacy | MEDIA | BAJA |
| formBuilder | public/js/ | Legacy | MEDIA | MEDIA |
| modalManager | public/js/ | Legacy | BAJA | BAJA |
| themeManager | public/js/ | Legacy | BAJA | BAJA |

---

## 🏗️ ARQUITECTURA DE REFACTORIZACIÓN

Todos los 34 sistemas serán refactorizados siguiendo este patrón:

### Patrón Event-Driven (ya implementado en 20 sistemas)

```javascript
// Antes (Legacy)
// Dashboard Manager comunica directamente con otros módulos
dashboardManager.on('studentSelected', (id) => {
  studentService.getStudent(id).then(student => {
    gradeService.getGrades(id).then(grades => {
      // Acoplamiento fuerte
      updateUI(student, grades);
    });
  });
});

// Después (Event-Driven)
// Dashboard Manager emite eventos que otros módulos escuchan
eventBus.emit('student:selected', { id });
eventBus.on('student:loaded', ({ student, grades }) => {
  updateUI(student, grades);
});
```

### Service Layer Pattern

```javascript
// Antes (Logic en routes)
app.get('/api/students/:id', async (req, res) => {
  const student = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
  const grades = await db.query('SELECT * FROM grades WHERE student_id = ?', [req.params.id]);
  const attendance = await db.query('SELECT * FROM attendance WHERE student_id = ?', [req.params.id]);
  res.json({ student, grades, attendance });
});

// Después (Logic en service)
// Route
app.get('/api/students/:id', async (req, res) => {
  const data = await StudentService.getStudentProfile(req.params.id);
  res.json(data);
});

// Service
class StudentService {
  static async getStudentProfile(id) {
    const [student, grades, attendance] = await Promise.all([
      StudentDAO.get(id),
      GradeDAO.getByStudent(id),
      AttendanceDAO.getByStudent(id)
    ]);
    return { student, grades, attendance };
  }
}
```

---

## 📅 PLAN DE IMPLEMENTACIÓN (16 semanas)

### SEMANA 33-36: SERVICIOS CRÍTICOS (50 horas)

#### Semana 33: studentService + gradeService
- Extraer lógica de rutas a servicios
- Implementar DAO pattern
- Agregar caching con Redis
- **Estimado:** 12 horas

**Tareas:**
1. Crear `backend/services/student.service.js` (500+ líneas)
   - getStudent(id)
   - getStudents(filters, pagination)
   - createStudent(data)
   - updateStudent(id, data)
   - deleteStudent(id)
   - getStudentProfile(id) - con grades + attendance

2. Crear `backend/services/grade.service.js` (400+ líneas)
   - getGrades(studentId, filters)
   - getGradesBySubject(subjectId)
   - createGrade(data)
   - updateGrade(id, data)
   - calculateGPA(studentId)

3. Crear tests unitarios
   - 20+ test cases por servicio

#### Semana 34: teacherService + adminService
- Similar a semana 33
- **Estimado:** 12 horas

#### Semana 35: parentService + appointmentService
- **Estimado:** 12 horas

#### Semana 36: notificationService + emailTemplateService
- **Estimado:** 12 horas

---

### SEMANA 37-40: SERVICIOS DE INTEGRACIÓN (50 horas)

#### Semana 37: cacheService + monitoringService
- Implementar Redis caching pattern
- Agregar Prometheus metrics
- **Estimado:** 12 horas

#### Semana 38: googleClassroomService + externalAuthService
- Refactorizar integraciones externas
- Error handling mejorado
- **Estimado:** 12 horas

#### Semana 39: reportService + searchService
- Implementar reportes con DAO pattern
- Agregar full-text search
- **Estimado:** 13 horas

#### Semana 40: analyticsService + metricsService
- Refactorizar métricas
- Agregar agregaciones complejas
- **Estimado:** 13 horas

---

### SEMANA 41-44: SERVICIOS AUXILIARES (50 horas)

#### Semana 41: documentService + fileService
- Refactorizar gestión de archivos
- Agregar virus scanning
- **Estimado:** 12 horas

#### Semana 42: paymentService + webhookService
- Refactorizar pagos
- Implementar webhook pattern
- **Estimado:** 12 horas

#### Semana 43: dataExportService + migrationService
- Refactorizar exportación de datos
- Implementar migration pattern
- **Estimado:** 13 horas

#### Semana 44: syncService + thirdPartyAPIService
- Refactorizar sincronizaciones
- Implementar circuit breaker pattern
- **Estimado:** 13 horas

---

### SEMANA 45-48: FRONTEND MODULES + TESTING (50 horas)

#### Semana 45: dashboardManager + adminAuthModule
- Refactorizar modules grandes
- Separar en sub-módulos
- **Estimado:** 12 horas

#### Semana 46: studentDashboard + reportBuilder
- Refactorizar dashboards
- Implementar lazy loading
- **Estimado:** 12 horas

#### Semana 47: Módulos auxiliares (chartBuilder, formBuilder, modalManager, etc.)
- Refactorizar componentes UI
- Agregar custom events
- **Estimado:** 13 horas

#### Semana 48: Testing Final + Release Planning
- Crear suite de tests para todos los 34 sistemas
- Preparar v7.0.0 release
- **Estimado:** 13 horas

---

## 📝 TEMPLATE PARA CADA REFACTORIZACIÓN

### Paso 1: Crear Servicio

**Archivo:** `backend/services/[system-name].service.js`

```javascript
/**
 * [System Name] Service
 * Descripción breve
 *
 * Métodos públicos:
 * - method1(params)
 * - method2(params)
 */

const Logger = require('../utilities/logger');
const Cache = require('../utilities/cache');
const [System]DAO = require('../data/[system-name].dao');
const EventBus = require('./eventBus.service');

class [SystemName]Service {

  /**
   * Get [resource] by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async get(id) {
    const cacheKey = `[system]:${id}`;

    // Intentar obtener de cache
    const cached = await Cache.get(cacheKey);
    if (cached) {
      Logger.log('[CACHE HIT] [System] -', id);
      return cached;
    }

    // Obtener de base de datos
    const data = await [System]DAO.get(id);
    if (!data) {
      throw new Error(`[Resource] not found: ${id}`);
    }

    // Guardar en cache (10 minutos)
    await Cache.set(cacheKey, data, 600);

    // Emitir evento
    EventBus.emit('[system]:loaded', { id, data });

    return data;
  }

  /**
   * Create [resource]
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    // Validación
    this.validate(data);

    // Crear
    const result = await [System]DAO.create(data);

    // Invalidar cache si aplica
    await Cache.invalidate('[system]:*');

    // Emitir evento
    EventBus.emit('[system]:created', { data: result });

    Logger.log('[CREATE] [System] -', result.id);
    return result;
  }

  /**
   * Update [resource]
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async update(id, data) {
    this.validate(data);
    const result = await [System]DAO.update(id, data);
    await Cache.delete(`[system]:${id}`);
    EventBus.emit('[system]:updated', { id, data: result });
    Logger.log('[UPDATE] [System] -', id);
    return result;
  }

  /**
   * Delete [resource]
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    await [System]DAO.delete(id);
    await Cache.delete(`[system]:${id}`);
    EventBus.emit('[system]:deleted', { id });
    Logger.log('[DELETE] [System] -', id);
    return true;
  }

  /**
   * Validar datos
   * @private
   */
  static validate(data) {
    if (!data.name) throw new Error('Name is required');
    // Agregar más validaciones
  }
}

module.exports = [SystemName]Service;
```

### Paso 2: Crear DAO

**Archivo:** `backend/data/[system-name].dao.js`

```javascript
/**
 * [System Name] Data Access Object
 */

const pool = require('../config/database');
const Logger = require('../utilities/logger');

class [SystemName]DAO {

  static async get(id) {
    const query = `
      SELECT * FROM [table_name]
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async list(filters = {}, limit = 20, offset = 0) {
    let query = `SELECT * FROM [table_name] WHERE 1=1`;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async create(data) {
    const query = `
      INSERT INTO [table_name] (name, status, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [data.name, data.status || 'active']);
    return result.rows[0];
  }

  static async update(id, data) {
    const query = `
      UPDATE [table_name]
      SET name = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [data.name, data.status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      DELETE FROM [table_name]
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }
}

module.exports = [SystemName]DAO;
```

### Paso 3: Crear Tests

**Archivo:** `backend/tests/services/[system-name].service.test.js`

```javascript
const [SystemName]Service = require('../../services/[system-name].service');
const EventBus = require('../../services/eventBus.service');

describe('[SystemName]Service', () => {

  let testData;

  beforeEach(() => {
    testData = {
      id: 'test-1',
      name: 'Test Item',
      status: 'active'
    };
  });

  it('should get by id', async () => {
    const result = await [SystemName]Service.get(testData.id);
    expect(result).toBeDefined();
    expect(result.id).toBe(testData.id);
  });

  it('should create new item', async () => {
    const result = await [SystemName]Service.create(testData);
    expect(result.id).toBeDefined();
    expect(result.name).toBe(testData.name);
  });

  it('should update item', async () => {
    const updated = await [SystemName]Service.update(testData.id, {
      name: 'Updated Name'
    });
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete item', async () => {
    const result = await [SystemName]Service.delete(testData.id);
    expect(result).toBe(true);
  });

  it('should emit events', async () => {
    const spy = jest.spyOn(EventBus, 'emit');
    await [SystemName]Service.create(testData);
    expect(spy).toHaveBeenCalledWith('[system]:created', expect.any(Object));
    spy.mockRestore();
  });
});
```

### Paso 4: Actualizar Rutas

**Archivo:** `backend/routes/[system-name].js`

```javascript
/**
 * [System Name] Routes
 * Refactorización de lógica a servicios
 */

const express = require('express');
const router = express.Router();
const [SystemName]Service = require('../services/[system-name].service');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * GET /api/[system]/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const data = await [SystemName]Service.get(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/[system]
 */
router.post('/', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const data = await [SystemName]Service.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/[system]/:id
 */
router.put('/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const data = await [SystemName]Service.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/[system]/:id
 */
router.delete('/:id', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    await [SystemName]Service.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

## ✅ CHECKLIST POR SISTEMA

Para cada uno de los 34 sistemas:

```markdown
## [System Name] Refactoring Checklist

- [ ] Crear `backend/services/[system].service.js`
- [ ] Crear `backend/data/[system].dao.js`
- [ ] Crear `backend/tests/services/[system].service.test.js`
- [ ] Refactorizar rutas en `backend/routes/[system].js`
- [ ] Agregar integración con Event Bus
- [ ] Agregar caching con Redis (si aplica)
- [ ] Validar sintaxis (node -c)
- [ ] Ejecutar tests locales
- [ ] Documentar en OpenAPI
- [ ] Hacer git commit
- [ ] Hacer PR review
- [ ] Merge a main
- [ ] Deploy a staging
- [ ] Testing en staging
- [ ] Documentar cambios en CHANGELOG
```

---

## 📊 MÉTRICAS DE ÉXITO

Al completar los 34 sistemas:

| Métrica | Actual | v7.0.0 |
|---------|--------|--------|
| Sistemas Refactorizados | 20 | 54 |
| Event-Driven | 40% | 100% |
| Service Layer | 30% | 100% |
| Test Coverage | 40% | 75% |
| Code Quality (Sonar) | 75/100 | 85/100 |
| Duplicated Code | 8% | <3% |

---

## 🎯 BENEFICIOS

✅ **Mantenibilidad:** Código más limpio y modular
✅ **Escalabilidad:** Servicios desacoplados
✅ **Testabilidad:** 100% código testeable
✅ **Performance:** Caching + optimizaciones
✅ **Seguridad:** Validación centralizada
✅ **Documentación:** API completa documentada

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|--------|------------|-----------|
| Regresiones en rutas | MEDIA | Tests exhaustivos antes de merge |
| Performance degradation | BAJA | Load testing después de cada semana |
| Conflictos de merge | MEDIA | Commit pequeños, PRs pequeñas |
| Falta de tiempo | MEDIA | Documentar progress, ajustar timeline |

---

## 📚 REFERENCIAS

- Event-Driven Architecture: `docs/FASE-1-INTEGRACION-COMPLETADA.md`
- Service Layer Pattern: `docs/ARQUITECTURA-ACTUAL-DIAGNOSTICO.md`
- Testing Guide: `backend/tests/README.md`
- API Documentation: `/api/docs`

---

**Plan creado:** 23 Noviembre 2025
**Versión objetivo:** v7.0.0
**Período:** Semanas 33-48
**Estado:** Listo para ejecutar
