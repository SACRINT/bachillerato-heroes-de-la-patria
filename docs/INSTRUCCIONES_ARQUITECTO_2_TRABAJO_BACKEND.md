# 🎯 INSTRUCCIONES PARA ARQUITECTO 2: LOGGING GDPR + BACKEND REFACTORING

**Enfoque:** Trabajo técnico puro. Solo diseña y construye. El Git lo maneja el PM.

---

## 📋 TU MISIÓN (2 SUB-TAREAS ENCADENADAS)

**Sub-Tarea A:** Eliminar 5,966 logs masivos → Logging condicional (10 horas)

**Sub-Tarea B:** Crear capa de servicios backend → Refactorizar 18 rutas (25-30 horas)

Total: 35-40 horas distribuidas en ~14 días

---

## 🔴 SUB-TAREA A: ELIMINACIÓN DE LOGGING MASIVO (10 horas)

### A.1: Crear infraestructura de logging condicional (2 horas)

**ARCHIVO 1: `public/js/debug-logger.js` (NUEVO)**

Copia exactamente esto:
```javascript
/**
 * Debug Logger - Logging condicional para desarrollo
 * Solo loguea si DEBUG_MODE está activado
 */

const debugLog = {
  /**
   * @param {string} tag - Prefijo del log (ej: 'AUTH', 'API', 'FORM')
   * @param {string} message - Mensaje
   * @param {any} data - Datos adicionales (opcional)
   */
  log: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #0066cc; font-weight: bold;',
      data || ''
    );
  },

  warn: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.warn(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #ff9900; font-weight: bold;',
      data || ''
    );
  },

  error: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.error(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #ff3333; font-weight: bold;',
      data || ''
    );
  }
};

// Exportar para Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugLog };
}
```

**ARCHIVO 2: `backend/utils/debug-logger.js` (NUEVO)**

Copia exactamente esto:
```javascript
/**
 * Debug Logger Backend - Logging condicional para Node.js
 * Solo loguea si NODE_ENV es 'development'
 */

const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = {
  log: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${tag}] ${message}`, data || '');
  },

  warn: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`[${timestamp}] [${tag}] ${message}`, data || '');
  },

  error: (tag, message, data = null) => {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] [${tag}] ${message}`, data || '');
  }
};

module.exports = { debugLog };
```

**ARCHIVO 3: `backend/utils/sanitized-errors.js` (NUEVO)**

Copia exactamente esto:
```javascript
/**
 * Sanitized Errors - Remover datos sensibles de error logs
 * GDPR Compliance: Nunca loguear PII
 */

function sanitizeError(error, context = 'unknown') {
  // Solo preservar información no-sensible
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    context: context,
    timestamp: new Date().toISOString(),
    // NO INCLUIR: error.stack, error.sql, user data, passwords, tokens
  };
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***';
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '***-****';
  return `***-${phone.substring(phone.length - 4)}`;
}

function maskToken(token) {
  if (!token) return '***';
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

module.exports = {
  sanitizeError,
  maskEmail,
  maskPhone,
  maskToken
};
```

---

### A.2: Sanitizar logs en 15 archivos FRONTEND (4 horas)

**Archivos a procesar (en orden):**

1. `public/js/dashboard-manager-2025.js` (137 logs)
2. `public/js/auth-manager.js` (65 logs)
3. `public/js/api-client.js` (78 logs)
4. `public/js/unified-auth-system-v2.js` (58 logs)
5. `public/js/context-manager.js` (52 logs)
6. `public/js/admin-auth-secure.js` (45 logs)
7. `public/js/professional-forms.js` (43 logs)
8. `public/js/student-dashboard.js` (41 logs)
9. `public/js/admin-dashboard.js` (38 logs)
10. `public/js/notification-system.js` (35 logs)
11. `public/js/appointments.js` (32 logs)
12. `public/js/gamification-system.js` (31 logs)
13. `public/js/form-validator.js` (28 logs)
14. `public/js/error-handler.js` (26 logs)
15. `public/js/export-manager.js` (23 logs)

**Para CADA archivo, aplicar este patrón:**

```javascript
// ❌ ANTES (GDPR Risk):
console.log('User authenticated:', { email: user.email, token: jwt, password: pwd });
console.log('Admin action:', adminData);
console.error('Database error:', { query, user_id: userId });

// ✅ DESPUÉS (GDPR Safe):
debugLog.log('AUTH', 'User authenticated', { userId: user.id });
debugLog.log('ADMIN', 'Action completed');
debugLog.error('DB', 'Query failed', { context: 'getUserById' });

// ✅ CON MASKING:
const { maskEmail, maskToken } = require('../../utils/sanitized-errors');
debugLog.log('AUTH', 'Login attempt', { email: maskEmail(user.email) });
debugLog.log('AUTH', 'Token generated', { token: maskToken(jwtToken) });
```

**Paso a paso por archivo:**
1. Abre el archivo
2. Busca todos los `console.log(`, `console.warn(`, `console.error(`, `console.debug(`
3. Si loguea datos sensibles (email, password, token, user data), reemplazar
4. Usar `debugLog.log()`, `debugLog.warn()`, `debugLog.error()`
5. Agregar masking si es necesario
6. Validar: `node -c archivo.js`

---

### A.3: Sanitizar logs en 10 archivos BACKEND (3 horas)

**Archivos a procesar:**

1. `backend/admin-auth.js` (89 logs)
2. `backend/routes/admin.js` (72 logs)
3. `backend/routes/auth.js` (68 logs)
4. `backend/services/emailService.js` (54 logs)
5. `backend/routes/students.js` (51 logs)
6. `backend/data/database-access.js` (48 logs)
7. `backend/routes/approvals.js` (46 logs)
8. `backend/middleware/auth.js` (43 logs)
9. `backend/routes/uploads.js` (39 logs)
10. `backend/services/notificationService.js` (35 logs)

**Patrón BACKEND:**

```javascript
// En inicio del archivo, agregar:
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail, maskToken } = require('../utils/sanitized-errors');

// ❌ ANTES:
console.log('User login:', { email: user.email, password: pwd, token: jwt });
console.error('DB Error:', error);

// ✅ DESPUÉS:
debugLog.log('AUTH', 'User login', { email: maskEmail(user.email) });
debugLog.error('DB', 'Query failed', sanitizeError(error, 'authenticateUser'));
```

**Validar:** `node -c archivo.js`

---

### A.4: Testing validación (1 hora)

```bash
# Test 1: Verificar que DEBUG_MODE está correcto
grep -r "debugLog" public/js/ | head -5
# Resultado esperado: 15+ líneas con debugLog

grep -r "debugLog" backend/ | head -5
# Resultado esperado: 10+ líneas con debugLog

# Test 2: Buscar logs sensibles remanentes (NO debe haber)
grep -r "console.log.*email\|console.log.*token\|console.log.*password" public/js/
# Resultado esperado: (vacío - 0 líneas)

grep -r "console.log.*email\|console.log.*token\|console.log.*password" backend/
# Resultado esperado: (vacío - 0 líneas)
```

---

## 🟠 SUB-TAREA B: REFACTORIZACIÓN BACKEND (25-30 horas)

### B.1: Crear capa de servicios (15 horas)

**Objetivo:** Extraer lógica de rutas a servicios reutilizables

**Crear estos 10 archivos nuevos en `backend/services/`:**

#### 1. `backend/services/UserService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');

class UserService {
  async authenticateUser(email, password) {
    debugLog.log('USER', 'Authenticate attempt', { email });
    try {
      const user = await db.getUserByEmail(email);
      if (!user) throw new Error('User not found');
      // Validar password (bcrypt)
      return { id: user.id, email: user.email, role: user.role };
    } catch (error) {
      debugLog.error('USER', 'Auth failed', error.message);
      throw error;
    }
  }

  async createUser(userData) {
    debugLog.log('USER', 'Creating user', { email: userData.email });
    return await db.createUser(userData);
  }

  async getUserById(id) {
    return await db.getUserById(id);
  }

  async updateUser(id, updates) {
    debugLog.log('USER', 'Updating user', { id });
    return await db.updateUser(id, updates);
  }
}

module.exports = new UserService();
```

#### 2. `backend/services/StudentService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');

class StudentService {
  async getStudents(filters = {}) {
    debugLog.log('STUDENT', 'Fetching students', { filters });
    return await db.getStudents(filters);
  }

  async getStudentById(id) {
    return await db.getStudentById(id);
  }

  async createStudent(data) {
    debugLog.log('STUDENT', 'Creating student');
    return await db.createStudent(data);
  }

  async updateStudent(id, data) {
    debugLog.log('STUDENT', 'Updating student', { id });
    return await db.updateStudent(id, data);
  }

  async deleteStudent(id) {
    debugLog.log('STUDENT', 'Deleting student', { id });
    return await db.deleteStudent(id);
  }
}

module.exports = new StudentService();
```

#### 3. `backend/services/ApprovalService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');

class ApprovalService {
  async getPendingApprovals(filters = {}) {
    debugLog.log('APPROVAL', 'Fetching pending approvals');
    return await db.getPendingApprovals(filters);
  }

  async approveRequest(requestId, approverNotes) {
    debugLog.log('APPROVAL', 'Approving request', { requestId });
    const result = await db.updateRequestStatus(requestId, 'approved', approverNotes);
    // Trigger email notification
    return result;
  }

  async rejectRequest(requestId, rejectionReason) {
    debugLog.log('APPROVAL', 'Rejecting request', { requestId });
    return await db.updateRequestStatus(requestId, 'rejected', rejectionReason);
  }
}

module.exports = new ApprovalService();
```

#### 4. `backend/services/NotificationService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');
const emailService = require('./emailService');

class NotificationService {
  async sendNotification(userId, type, data) {
    debugLog.log('NOTIFICATION', `Sending ${type}`, { userId });

    // Guardar en BD
    const notification = await db.createNotification({ userId, type, data });

    // Enviar email si aplica
    if (type === 'approval' || type === 'urgent') {
      const user = await db.getUserById(userId);
      await emailService.send({
        to: user.email,
        subject: data.subject,
        template: `emails/${type}`,
        context: data
      });
    }

    return notification;
  }

  async getNotifications(userId) {
    return await db.getNotifications(userId);
  }
}

module.exports = new NotificationService();
```

#### 5. `backend/services/ReportService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');

class ReportService {
  async generateStudentReport(studentId, reportType) {
    debugLog.log('REPORT', `Generating ${reportType}`, { studentId });

    const student = await db.getStudentById(studentId);
    const grades = await db.getStudentGrades(studentId);
    const attendance = await db.getStudentAttendance(studentId);

    return {
      student,
      grades,
      attendance,
      generatedAt: new Date(),
      reportType
    };
  }

  async getAnalytics(filters) {
    debugLog.log('REPORT', 'Generating analytics');
    return await db.getAnalytics(filters);
  }
}

module.exports = new ReportService();
```

#### 6. `backend/services/FormService.js`
```javascript
const { debugLog } = require('../utils/debug-logger');
const db = require('../data/database-access');

class FormService {
  async submitForm(formType, formData, userId) {
    debugLog.log('FORM', `Submitting ${formType}`, { userId });

    // Validar datos
    this.validateFormData(formType, formData);

    // Guardar en BD
    const submission = await db.createFormSubmission({
      form_type: formType,
      user_id: userId,
      form_data: formData,
      status: 'pending',
      created_at: new Date()
    });

    return submission;
  }

  validateFormData(formType, data) {
    // Validaciones específicas por tipo
    if (formType === 'Contacto' && !data.email) throw new Error('Email required');
    if (formType === 'CV' && !data.file) throw new Error('File required');
  }
}

module.exports = new FormService();
```

#### 7-10: Archivos adicionales (UploadService, ExportService, ChatbotService, AnalyticsService)

Por brevedad, los patrones son similares. Crear siguiendo el modelo anterior.

---

### B.2: Refactorizar 18 rutas backend (10-15 horas)

**Rutas a refactorizar:**

1. `backend/routes/students.js` → Usar `StudentService`
2. `backend/routes/approvals.js` → Usar `ApprovalService`
3. `backend/routes/notifications.js` → Usar `NotificationService`
4. `backend/routes/reports.js` → Usar `ReportService`
5. `backend/routes/forms.js` → Usar `FormService`
6. `backend/routes/uploads.js` → Usar `UploadService`
7. `backend/routes/auth.js` → Usar `UserService`
8. `backend/routes/admin.js` → Usar `AdminService`
9. `backend/routes/parents.js` → Usar `ParentService`
10. `backend/routes/teachers.js` → Usar `TeacherService`
11. Más rutas según sea necesario

**Patrón de refactorización:**

```javascript
// ❌ ANTES:
router.get('/students', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM usuarios WHERE role = $1', ['estudiante']);
    console.log('Fetched students:', result.rows.length);
    client.release();
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DESPUÉS:
const StudentService = require('../services/StudentService');

router.get('/students', async (req, res) => {
  try {
    const students = await StudentService.getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### B.3: Testing y validación (1-2 horas)

```bash
# Test 1: Verificar que todos los servicios cargan sin error
node -c backend/services/UserService.js
node -c backend/services/StudentService.js
# ... (todos los servicios)

# Test 2: Buscar que las rutas NO accesan directo al pool
grep -r "pool.connect\|pool.query" backend/routes/
# Resultado esperado: 0 líneas (todas deben ir por servicios)

# Test 3: Validar sintaxis rutas refactorizadas
node -c backend/routes/students.js
node -c backend/routes/approvals.js
# ... (todas las rutas)
```

---

## 📊 TIMELINE RECOMENDADO (14 días)

**Días 1-2:** SUB-TAREA A.1 + A.2 (Logging infrastructure + 5 archivos frontend)
**Día 3:** SUB-TAREA A.2 (10 archivos frontend restantes)
**Día 4:** SUB-TAREA A.3 (Logging backend 10 archivos)
**Días 5-6:** SUB-TAREA A.4 (Testing + validación)
**Días 7-12:** SUB-TAREA B.1 (10 servicios nuevos)
**Días 13-14:** SUB-TAREA B.2 (18 rutas refactorizadas)

---

## ✅ CHECKLIST FINAL

**SUB-TAREA A:**
- [ ] `debug-logger.js` (frontend) creado
- [ ] `debug-logger.js` (backend) creado
- [ ] `sanitized-errors.js` creado
- [ ] 15 archivos frontend sanitizados
- [ ] 10 archivos backend sanitizados
- [ ] 0 `console.log` sin condicional con datos sensibles
- [ ] Todos validados con `node -c`

**SUB-TAREA B:**
- [ ] 10 servicios creados en `backend/services/`
- [ ] 18 rutas refactorizadas usando servicios
- [ ] 0 accesos directos a `pool` en rutas
- [ ] Todos los archivos validados con `node -c`
- [ ] Testing completado

---

## 🎯 ENTREGABLE FINAL

Al terminar, el PM hará:
```bash
git add backend/services/ backend/routes/ public/js/ backend/utils/
git commit -m "feat(gdpr+refactor): Logging condicional + capa de servicios backend"
git push
```

Tú **SOLO** necesitas haber hecho el trabajo técnico. El PM maneja Git.

---

## 🚀 COMIENZA AHORA

1. Crea `public/js/debug-logger.js` (copia exacta arriba)
2. Crea `backend/utils/debug-logger.js` (copia exacta arriba)
3. Crea `backend/utils/sanitized-errors.js` (copia exacta arriba)
4. Abre `public/js/dashboard-manager-2025.js` (primer archivo a sanitizar)
5. Busca todos los `console.log(` y reemplaza con `debugLog.log()`
6. Valida: `node -c public/js/dashboard-manager-2025.js`
7. Próximo archivo

**¡Adelante!**
