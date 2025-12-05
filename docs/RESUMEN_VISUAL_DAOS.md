# 🎨 RESUMEN VISUAL: DAOs en 5 MINUTOS

**¿Qué son DAOs? → Una forma MÁS LIMPIA de organizar tu código**

---

## 🔴 ANTES (SIN DAO) - CAÓTICO

```
Tu base de datos:
┌─────────────────────────┐
│   TABLA: estudiantes    │
│   ├─ id                 │
│   ├─ nombre             │
│   ├─ email              │
│   └─ grado              │
└─────────────────────────┘

Tu código (DISPERSO POR TODOS LADOS):

📄 routes/students.js
  getStudent() → SELECT * FROM estudiantes WHERE id = ?
  deleteStudent() → DELETE FROM estudiantes WHERE id = ?

📄 routes/teachers.js
  getStudentsForTeacher() → SELECT * FROM estudiantes WHERE id = ?

📄 services/report.service.js
  getStudentGPA() → SELECT ... FROM estudiantes ...

📄 routes/admin.js
  getAllStudents() → SELECT * FROM estudiantes

❌ PROBLEMA:
   - 4 archivos diferentes
   - Lógica de BD repetida
   - Si cambio tabla, cambio 4 archivos
   - Inconsistencia
```

---

## 🟢 DESPUÉS (CON DAO) - ORGANIZADO

```
Tu base de datos:
┌─────────────────────────┐
│   TABLA: estudiantes    │
└─────────────────────────┘
           ▲
           │ (Acceso centralizado)
           │
┌─────────────────────────┐
│   StudentDAO.js         │
├─────────────────────────┤
│ • getById()             │ ← Un solo lugar para TODAS
│ • getAll()              │   las queries de estudiantes
│ • create()              │
│ • update()              │
│ • delete()              │
└─────────────────────────┘
           ▲
           │ (Usa el DAO)
     ┌─────┴─────┬──────────┬──────────┐
     │           │          │          │
📄 routes/  📄 services/ 📄 routes/ 📄 services/
students.js report.js teachers.js admin.js

  ✅ TODO accede por el DAO
  ✅ Un solo lugar para mantener
  ✅ Código limpio y reutilizable
```

---

## 📊 DIAGRAMA COMPARATIVO

### ❌ SIN DAO

```
CLIENTE HTTP
    ▼
┌────────────────┐
│  RUTA          │
│  (GET /api...) │
└────────┬───────┘
         │
         │ SELECT * FROM...
         │ INSERT INTO...
         │ UPDATE...
         │
         ▼
┌────────────────┐
│  BASE DE DATOS │
└────────────────┘

Problema: BD está acoplada a las rutas
```

---

### ✅ CON DAO

```
CLIENTE HTTP
    ▼
┌────────────────┐
│  RUTA          │
│  (limpia)      │
└────────┬───────┘
         │ StudentDAO.getById(id)
         ▼
┌────────────────┐
│  DAO           │ ← Encapsula TODA la lógica de BD
│  StudentDAO    │
└────────┬───────┘
         │
         │ SELECT * FROM...
         │ INSERT INTO...
         │ UPDATE...
         │
         ▼
┌────────────────┐
│  BASE DE DATOS │
└────────────────┘

Ventaja: BD está aislada en el DAO
```

---

## 💻 CÓDIGO LADO A LADO

### ❌ RUTA SIN DAO (Fea)

```javascript
// ❌ Ruta con lógica de BD
router.get('/api/students/:id', async (req, res) => {
  try {
    // ❌ SQL directamente en la ruta
    const query = 'SELECT * FROM estudiantes WHERE id = $1';
    const result = await pool.query(query, [req.params.id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'No encontrado' });
    }

    const student = result.rows[0];

    // ❌ Más SQL
    const gradesQuery = 'SELECT * FROM grades WHERE student_id = $1';
    const gradesResult = await pool.query(gradesQuery, [req.params.id]);

    res.json({ student, grades: gradesResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Problemas:**
- 20+ líneas de código
- Lógica de BD aquí
- Difícil de entender
- Difícil de testear

---

### ✅ RUTA CON DAO (Limpia)

```javascript
// ✅ Ruta sin lógica de BD (LIMPIA)
router.get('/api/students/:id', async (req, res) => {
  try {
    // ✅ Una sola línea: pedir al DAO
    const profile = await StudentService.getStudentProfile(req.params.id);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Ventajas:**
- 5 líneas de código
- NINGUNA lógica de BD aquí
- Claro y directo
- Fácil de testear

---

## 🧩 LA ESTRUCTURA CON DAO

```
PROYECTO
├── routes/
│   └── students.js          ← ¿Cómo respondo al HTTP?
│
├── services/
│   └── student.service.js   ← ¿Qué hago con los datos?
│
├── data/
│   └── student.dao.js       ← ¿Cómo accedo a la BD?
│
└── config/
    └── database.js          ← Conexión a BD
```

**Cada uno sabe su trabajo:**
- **Ruta:** "Recibe request, llama servicio, devuelve respuesta"
- **Servicio:** "Usa DAOs, procesa datos, valida, emite eventos"
- **DAO:** "Ejecuta queries SQL y retorna datos sin procesar"

---

## 🎯 FLUJO DE UNA REQUEST

```
┌─────────────────────────────────┐
│  CLIENTE                        │
│  GET /api/students/5            │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  RUTA (routes/students.js)      │
│  router.get('/api/students/:id' │
│  await StudentService.get(id)   │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  SERVICIO (services/...)        │
│  getStudentProfile(id) {        │
│    • const student =            │
│        StudentDAO.getById(id)   │
│    • const grades =             │
│        GradeDAO.get(id)         │
│    • calcular promedio          │
│    • cache                      │
│    • emitir evento              │
│    • return { student, grades } │
│  }                              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  DAO (data/student.dao.js)      │
│  getById(id) {                  │
│    return pool.query(           │
│      'SELECT * FROM estudiantes │
│       WHERE id = $1', [id]      │
│    )                            │
│  }                              │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)     │
│  SELECT * FROM estudiantes      │
│  WHERE id = 5                   │
└──────────────┬──────────────────┘
               ▼
          ✅ Estudiante
         { id: 5, nombre: '...' }
               ▲
               │ (Respuesta de vuelta)
               │
         Procesar → Servicio
               │
         Formatear → Ruta
               │
      ┌────────────────────────────┐
      │  RESPUESTA AL CLIENTE       │
      │  HTTP 200                  │
      │  {                         │
      │    student: {...},         │
      │    grades: [...],          │
      │    gpa: 8.5                │
      │  }                         │
      └────────────────────────────┘
```

---

## 🎓 ANALÓGICA SIMPLE

**Sin DAO:**
```
Todos entran al almacén
Buscan donde quieren
Caos total
```

**Con DAO:**
```
Un empleado (DAO) gestiona el almacén
Todos le piden "necesito X"
Él sabe dónde está
Orden total
```

---

## 📋 CHECKLIST: TIENES QUE HACER

Para tu proyecto BGE con las tablas nuevas:

```
PASO 1: Crear DAOs
  ☐ StudentDAO
  ☐ TeacherDAO
  ☐ ParentDAO
  ☐ GradeDAO
  ☐ AttendanceDAO
  ☐ TeacherClassDAO (nueva)
  ☐ TeacherAssignmentDAO (nueva)
  ☐ etc.

PASO 2: Crear Servicios (usan DAOs)
  ☐ StudentService
  ☐ TeacherService
  ☐ GradeService
  ☐ etc.

PASO 3: Crear Rutas (usan Servicios)
  ☐ GET /api/students
  ☐ POST /api/students
  ☐ PUT /api/students/:id
  ☐ DELETE /api/students/:id
  ☐ etc.

RESULTADO: Código limpio y mantenible ✅
```

---

## 🚀 TU PRÓXIMO PASO

**Opción 1:** Continuar leyendo documentación detallada
- 📄 `EXPLICACION_DAOS_DETALLADA.md` (completo)
- 📄 `ANALOGIA_REAL_DAOS.md` (visual)

**Opción 2:** Empezar a crear DAOs para tus tablas
- Crear `backend/data/student.dao.js`
- Crear `backend/data/teacher.dao.js`
- etc.

**¿Cuál prefieres?** 🎯

---

## ✅ RESUMEN EN UNA FRASE

**DAO = Una clase que maneja TODA la lógica de BD para una tabla**

Así tu código está:
- 🧼 Limpio
- 🔧 Mantenible
- 🧪 Testeable
- 🚀 Escalable

---

¿Dudas? Te explico aún más simple si es necesario. 📚
