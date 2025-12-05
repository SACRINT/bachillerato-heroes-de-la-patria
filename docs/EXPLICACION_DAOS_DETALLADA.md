# 📚 EXPLICACIÓN DETALLADA: ¿QUÉ SON LOS DAOs?

**Fecha:** 4 de Diciembre, 2025
**Nivel:** Fundamental - Arquitectura de Software
**Duración Lectura:** 10-15 minutos

---

## 🎯 DEFINICIÓN RÁPIDA

**DAO = Data Access Object (Objeto de Acceso a Datos)**

Un DAO es una **clase que encapsula toda la lógica para acceder a una tabla o conjunto de datos en la base de datos**. Es como un "intermediario" entre tu código y la base de datos.

---

## 🏗️ ANTES vs DESPUÉS: VISUALIZACIÓN

### ❌ SIN DAO (Forma Antigua - MALA PRÁCTICA)

```javascript
// backend/routes/students.js
const express = require('express');
const app = express();
const pool = require('../config/database'); // conexión a BD

// RUTA para obtener un estudiante
app.get('/api/students/:id', async (req, res) => {
  try {
    // ❌ PROBLEMA 1: Lógica de BD directamente en la ruta
    const query = 'SELECT * FROM estudiantes WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const student = result.rows[0];

    // ❌ PROBLEMA 2: Más lógica de BD para obtener calificaciones
    const gradesQuery = 'SELECT * FROM grades WHERE student_id = $1';
    const gradesResult = await pool.query(gradesQuery, [req.params.id]);

    // ❌ PROBLEMA 3: Más lógica de BD para obtener asistencia
    const attendanceQuery = 'SELECT * FROM attendance WHERE student_id = $1';
    const attendanceResult = await pool.query(attendanceQuery, [req.params.id]);

    res.json({
      student: student,
      grades: gradesResult.rows,
      attendance: attendanceResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Problemas con este enfoque:**
1. ❌ La ruta está mezclada con lógica de base de datos
2. ❌ El código SQL está disperso por todos lados
3. ❌ Si cambias la estructura de la BD, debes cambiar TODAS las rutas
4. ❌ Código duplicado: cada ruta que necesita "estudiantes" repite la lógica
5. ❌ Difícil de testear
6. ❌ Difícil de mantener

---

### ✅ CON DAO (Forma Moderna - BUENA PRÁCTICA)

#### **PASO 1: Crear el DAO**
```javascript
// backend/data/student.dao.js
const pool = require('../config/database');
const Logger = require('../utilities/logger');

/**
 * StudentDAO - Gestiona TODA la lógica de acceso a la tabla 'estudiantes'
 *
 * Este archivo es responsable ÚNICAMENTE de:
 * - Conectarse a la BD
 * - Ejecutar queries SQL
 * - Retornar datos sin procesar
 */

class StudentDAO {

  /**
   * Obtener un estudiante por ID
   * @param {number} id - ID del estudiante
   * @returns {Promise<Object>} Objeto estudiante o null
   */
  static async getById(id) {
    const query = 'SELECT * FROM estudiantes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Obtener todos los estudiantes
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Array>} Array de estudiantes
   */
  static async getAll(limit = 20, offset = 0) {
    const query = 'SELECT * FROM estudiantes LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Crear un nuevo estudiante
   * @param {Object} data - Datos del estudiante
   * @returns {Promise<Object>} Estudiante creado
   */
  static async create(data) {
    const { nombre, email, grado } = data;
    const query = `
      INSERT INTO estudiantes (nombre, email, grado, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, email, grado]);
    Logger.log('[DAO] ✅ Estudiante creado:', result.rows[0].id);
    return result.rows[0];
  }

  /**
   * Actualizar un estudiante
   * @param {number} id - ID del estudiante
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Estudiante actualizado
   */
  static async update(id, data) {
    const { nombre, email, grado } = data;
    const query = `
      UPDATE estudiantes
      SET nombre = $1, email = $2, grado = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, email, grado, id]);
    Logger.log('[DAO] ✅ Estudiante actualizado:', id);
    return result.rows[0];
  }

  /**
   * Eliminar un estudiante
   * @param {number} id - ID del estudiante
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async delete(id) {
    const query = 'DELETE FROM estudiantes WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    Logger.log('[DAO] ✅ Estudiante eliminado:', id);
    return result.rows.length > 0;
  }
}

module.exports = StudentDAO;
```

#### **PASO 2: Crear el Servicio**
```javascript
// backend/services/student.service.js
const StudentDAO = require('../data/student.dao');
const GradeDAO = require('../data/grade.dao');
const AttendanceDAO = require('../data/attendance.dao');
const Cache = require('../utilities/cache');
const EventBus = require('./eventBus.service');

/**
 * StudentService - Lógica de negocio para estudiantes
 *
 * Este archivo es responsable de:
 * - Usar los DAOs para obtener datos
 * - Procesar y transformar datos
 * - Aplicar reglas de negocio
 * - Emitir eventos
 * - Manejar cache
 */

class StudentService {

  /**
   * Obtener perfil completo de un estudiante
   * (estudiante + calificaciones + asistencia)
   */
  static async getStudentProfile(id) {
    // Verificar cache primero
    const cacheKey = `student:${id}`;
    const cached = await Cache.get(cacheKey);
    if (cached) {
      Logger.log('[SERVICE] 📦 Cache HIT para estudiante:', id);
      return cached;
    }

    // Obtener datos de múltiples DAOs en paralelo
    const [student, grades, attendance] = await Promise.all([
      StudentDAO.getById(id),
      GradeDAO.getByStudentId(id),
      AttendanceDAO.getByStudentId(id)
    ]);

    if (!student) {
      throw new Error(`Estudiante no encontrado: ${id}`);
    }

    // Procesar datos (LÓGICA DE NEGOCIO)
    const gpa = this.calculateGPA(grades);
    const attendancePercentage = this.calculateAttendancePercentage(attendance);

    const profile = {
      student: {
        ...student,
        gpa,
        attendancePercentage
      },
      grades,
      attendance
    };

    // Guardar en cache (10 minutos)
    await Cache.set(cacheKey, profile, 600);

    // Emitir evento para que otros módulos sepan que se cargó este estudiante
    EventBus.emit('student:loaded', { id, profile });

    return profile;
  }

  /**
   * Calcular GPA (LÓGICA DE NEGOCIO)
   */
  static calculateGPA(grades) {
    if (!grades.length) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade.calificacion, 0);
    return (sum / grades.length).toFixed(2);
  }

  /**
   * Calcular porcentaje de asistencia (LÓGICA DE NEGOCIO)
   */
  static calculateAttendancePercentage(attendance) {
    if (!attendance.length) return 0;
    const presentDays = attendance.filter(a => a.presente).length;
    return ((presentDays / attendance.length) * 100).toFixed(2);
  }

  /**
   * Crear nuevo estudiante (con validaciones)
   */
  static async createStudent(data) {
    // VALIDACIÓN (regla de negocio)
    if (!data.nombre || !data.email) {
      throw new Error('Nombre y email son requeridos');
    }

    // Crear en BD usando DAO
    const student = await StudentDAO.create(data);

    // Invalidar cache
    await Cache.delete('students:*');

    // Emitir evento
    EventBus.emit('student:created', { student });

    return student;
  }
}

module.exports = StudentService;
```

#### **PASO 3: Usar en la Ruta (LIMPIA Y SIMPLE)**
```javascript
// backend/routes/students.js
const express = require('express');
const StudentService = require('../services/student.service');
const router = express.Router();

// ✅ RUTA LIMPIA - Solo hace 2 cosas:
// 1. Recibe la request
// 2. Llama al servicio
// 3. Devuelve respuesta

router.get('/api/students/:id', async (req, res) => {
  try {
    // ✅ Una sola línea: delegar al servicio
    const profile = await StudentService.getStudentProfile(req.params.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/students', async (req, res) => {
  try {
    // ✅ Una sola línea: delegar al servicio
    const student = await StudentService.createStudent(req.body);
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🏛️ ARQUITECTURA CON DAOs (3 CAPAS)

```
┌─────────────────────────────────────────────────┐
│              RUTAS (Routes)                     │
│     - Reciben requests HTTP                     │
│     - Llaman a servicios                        │
│     - Devuelven respuestas JSON                 │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│           SERVICIOS (Services)                  │
│     - Lógica de negocio                         │
│     - Validaciones                              │
│     - Cache                                     │
│     - Eventos                                   │
│     - Usa múltiples DAOs                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│       DAOs (Data Access Objects)                │
│     - Acceso a BD                               │
│     - Queries SQL                               │
│     - Retorna datos sin procesar                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         BASE DE DATOS (PostgreSQL)              │
│     - Almacenamiento de datos                   │
└─────────────────────────────────────────────────┘
```

---

## 📋 COMPARACIÓN: CON vs SIN DAO

| Aspecto | SIN DAO | CON DAO |
|---------|---------|---------|
| **Dónde está la lógica SQL** | Dispersa en rutas | Centralizada en DAOs |
| **Cambio de BD** | Editar 50+ rutas | Editar 2-3 DAOs |
| **Reutilización** | Código duplicado | Código reutilizable |
| **Testing** | Difícil (necesita BD real) | Fácil (mockear DAOs) |
| **Mantenibilidad** | Pesadilla | Simple |
| **Performance** | Variables | Optimizable en un lugar |
| **Seguridad** | SQL injection posible | Centralizado y seguro |

---

## 🎯 VENTAJAS DE USAR DAOs

### 1️⃣ **SEPARACIÓN DE RESPONSABILIDADES**
```
❌ Ruta = BD + Lógica + HTTP (3 responsabilidades)
✅ Ruta = HTTP, Servicio = Lógica, DAO = BD (1 responsabilidad cada una)
```

### 2️⃣ **REUTILIZACIÓN DE CÓDIGO**
```javascript
// Mismo DAO usado por múltiples servicios
const StudentService = require('./student.service'); // usa StudentDAO
const ReportService = require('./report.service');   // usa StudentDAO
const NotificationService = require('./notification.service'); // usa StudentDAO

// Si necesito cambiar query de "estudiantes", cambio UNA VEZ en StudentDAO
```

### 3️⃣ **FÁCIL DE TESTEAR**
```javascript
// Test sin necesidad de BD real
const studentDAO = {
  getById: jest.fn().mockResolvedValue({ id: 1, nombre: 'Juan' })
};

// Test del servicio usando DAO mockeado
const profile = await StudentService.getStudentProfile(1);
expect(profile.student.nombre).toBe('Juan');
```

### 4️⃣ **FÁCIL DE MANTENER**
```javascript
// Si BD cambia de PostgreSQL a MongoDB, solo cambias el DAO
// Los servicios y rutas NO cambian

// Antiguo (PostgreSQL)
class StudentDAO {
  static async getById(id) {
    const query = 'SELECT * FROM estudiantes WHERE id = $1';
    return await pool.query(query, [id]);
  }
}

// Nuevo (MongoDB)
class StudentDAO {
  static async getById(id) {
    return await db.collection('estudiantes').findOne({ _id: id });
  }
}

// ✅ Los servicios y rutas NO necesitan cambios
```

### 5️⃣ **OPTIMIZACIÓN CENTRALIZADA**
```javascript
// Si una query tarda mucho, la optimizas en UN SOLO LUGAR
class StudentDAO {
  static async getById(id) {
    // ✅ Agregar índice, cache, o query optimizada AQUÍ
    return await pool.query(`
      SELECT * FROM estudiantes e
      LEFT JOIN (SELECT student_id, COUNT(*) FROM grades GROUP BY student_id) g
      ON e.id = g.student_id
      WHERE e.id = $1
    `, [id]);
  }
}
// ✅ Todas las rutas y servicios automáticamente usan la versión optimizada
```

---

## 📊 ESTRUCTURA DE UN DAO TÍPICO

```javascript
// backend/data/[entity].dao.js

const pool = require('../config/database');
const Logger = require('../utilities/logger');

class [Entity]DAO {

  // ✅ CREATE: Insertar nuevo registro
  static async create(data) { }

  // ✅ READ: Obtener registros
  static async getById(id) { }
  static async getAll(filters, limit, offset) { }
  static async getByColumn(columnName, value) { }

  // ✅ UPDATE: Actualizar registro
  static async update(id, data) { }

  // ✅ DELETE: Eliminar registro
  static async delete(id) { }

  // ✅ AUXILIARES: Queries especiales
  static async countTotal() { }
  static async search(query) { }
  static async getRelated(id) { }
}

module.exports = [Entity]DAO;
```

---

## 🔐 EJEMPLO REAL: BGE Teachers Portal

En tu proyecto, los DAOs para Portal de Docentes serían:

```
backend/data/
├── teacher.dao.js               # Acceso a tabla 'docentes'
├── teacher-class.dao.js         # Acceso a 'teacher_classes'
├── teacher-assignment.dao.js    # Acceso a 'teacher_assignments'
├── teacher-resource.dao.js      # Acceso a 'teacher_resources'
└── teacher-message.dao.js       # Acceso a 'teacher_messages'
```

Cada DAO maneja ÚNICAMENTE las queries para su tabla.

---

## 🚀 FLUJO COMPLETO DE UNA REQUEST

```
1. CLIENTE (Frontend)
   │
   │ GET /api/students/123
   │
   ▼
2. RUTA (routes/students.js)
   │ router.get('/api/students/:id', ...)
   │
   ▼
3. SERVICIO (services/student.service.js)
   │ const profile = await StudentService.getStudentProfile(id)
   │
   ▼
4. DAO (data/student.dao.js)
   │ const student = await StudentDAO.getById(id)
   │ const grades = await GradeDAO.getByStudentId(id)
   │
   ▼
5. BASE DE DATOS (PostgreSQL)
   │ SELECT * FROM estudiantes WHERE id = 123
   │ SELECT * FROM grades WHERE student_id = 123
   │
   ▼
6. RESPUESTA (De vuelta hacia arriba)
   │ Procesar datos en servicio
   │ Calcular GPA, asistencia
   │ Guardar en cache
   │ Retornar JSON al cliente
   │
   ▼
7. CLIENTE
   { student: {...}, grades: [...], gpa: 8.5 }
```

---

## 💡 RESUMEN

| Concepto | Responsabilidad |
|----------|-----------------|
| **DAO** | "¿Cómo obtengo estos datos de la BD?" |
| **Servicio** | "¿Qué hago con estos datos?" |
| **Ruta** | "¿Cómo respondo al cliente?" |

---

## 📌 TU PROYECTO BGE

Tu proyecto está en el **camino a la transición** de Sin DAO → Con DAO.

**Tablas que necesitan DAOs:**
- `estudiantes` → `StudentDAO` ✅
- `docentes` → `TeacherDAO` ✅
- `padres` → `ParentDAO` ✅
- `calificaciones` → `GradeDAO` ✅
- `asistencia` → `AttendanceDAO` ✅
- `teacher_classes` (nueva) → `TeacherClassDAO` ✅
- `teacher_assignments` (nueva) → `TeacherAssignmentDAO` ✅
- etc.

---

**¿Preguntas?** Te los explico aún más detallado si necesitas. 📚
