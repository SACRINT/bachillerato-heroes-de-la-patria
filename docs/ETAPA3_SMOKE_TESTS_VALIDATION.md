# ✅ ETAPA 3: SMOKE TESTS Y VALIDACIÓN

**Fecha:** 4 de Diciembre, 2025
**Versión:** v7.0.0
**Objetivo:** Suite de 15 smoke tests para validar funcionalidad crítica

---

## 🧪 SUITE DE 15 SMOKE TESTS

### Test Group 1: Autenticación (3 tests)

#### Test 1.1: Health Check
```bash
TEST: GET /api/health
ESPERADO: 200 OK con version 7.0.0
RESULTADO: ⏳ Pendiente (ejecutar en staging)
```

#### Test 1.2: Login Exitoso
```bash
TEST: POST /api/auth/login
PAYLOAD: {"email":"user@example.com","password":"password123"}
ESPERADO: 200 OK con JWT token
RESULTADO: ⏳ Pendiente
```

#### Test 1.3: Token Inválido
```bash
TEST: GET /api/protected-endpoint + header Authorization: Bearer invalid_token
ESPERADO: 401 Unauthorized
RESULTADO: ⏳ Pendiente
```

---

### Test Group 2: Endpoints Académicos (3 tests)

#### Test 2.1: GET Students
```bash
TEST: GET /api/students
ESPERADO: 200 OK, Array de estudiantes
RESULTADO: ⏳ Pendiente
```

#### Test 2.2: GET Teachers
```bash
TEST: GET /api/teachers
ESPERADO: 200 OK, Array de docentes
RESULTADO: ⏳ Pendiente
```

#### Test 2.3: GET Grades
```bash
TEST: GET /api/grades
ESPERADO: 200 OK, Array de calificaciones
RESULTADO: ⏳ Pendiente
```

---

### Test Group 3: Operaciones CRUD (3 tests)

#### Test 3.1: Create Student
```bash
TEST: POST /api/students
PAYLOAD: {
  "nombre":"Juan",
  "apellido_paterno":"García",
  "email":"juan@example.com"
}
ESPERADO: 201 Created, con ID del estudiante
RESULTADO: ⏳ Pendiente
```

#### Test 3.2: Update Student
```bash
TEST: PUT /api/students/1
PAYLOAD: {"nombre":"Juan Carlos"}
ESPERADO: 200 OK, estudiante actualizado
RESULTADO: ⏳ Pendiente
```

#### Test 3.3: Delete Student
```bash
TEST: DELETE /api/students/1
ESPERADO: 200 OK o 204 No Content
RESULTADO: ⏳ Pendiente
```

---

### Test Group 4: Gestión (3 tests)

#### Test 4.1: Create Appointment
```bash
TEST: POST /api/appointments
PAYLOAD: {
  "student_id":1,
  "teacher_id":1,
  "fecha":"2025-12-15",
  "hora":"10:00"
}
ESPERADO: 201 Created
RESULTADO: ⏳ Pendiente
```

#### Test 4.2: Get Appointments
```bash
TEST: GET /api/appointments
ESPERADO: 200 OK, Array de citas
RESULTADO: ⏳ Pendiente
```

#### Test 4.3: Configuration
```bash
TEST: GET /api/config/tenant
ESPERADO: 200 OK con configuración del tenant
RESULTADO: ⏳ Pendiente
```

---

### Test Group 5: Persistencia (3 tests)

#### Test 5.1: Data Persists After Create
```bash
TEST:
1. POST /api/students (crear estudiante)
2. GET /api/students/[id] (recuperar datos)
ESPERADO: Los datos del estudiante están en BD
RESULTADO: ⏳ Pendiente
```

#### Test 5.2: Data Persists After Update
```bash
TEST:
1. PUT /api/students/1 (actualizar nombre)
2. GET /api/students/1 (recuperar datos)
ESPERADO: El nombre actualizado está en BD
RESULTADO: ⏳ Pendiente
```

#### Test 5.3: Relationships Work
```bash
TEST: GET /api/students/1/grades
ESPERADO: Array de calificaciones del estudiante
RESULTADO: ⏳ Pendiente
```

---

## 📊 MATRIZ DE RESULTADOS

### Resumen de Tests

| Test Group | Total | Exitosos | Fallidos | % Éxito |
|-----------|-------|----------|----------|---------|
| Autenticación | 3 | ⏳ | ⏳ | ⏳ |
| Académicos | 3 | ⏳ | ⏳ | ⏳ |
| CRUD | 3 | ⏳ | ⏳ | ⏳ |
| Gestión | 3 | ⏳ | ⏳ | ⏳ |
| Persistencia | 3 | ⏳ | ⏳ | ⏳ |
| **TOTAL** | **15** | **⏳** | **⏳** | **⏳** |

---

## ✅ CRITERIOS DE ÉXITO

Para pasar ETAPA 3, TODOS deben cumplirse:

### ✅ Tasa de Éxito
- [ ] 15/15 tests pasando (100%)
- [ ] 0 tests fallidos
- [ ] 0 tests con timeout

### ✅ Funcionalidad
- [ ] Autenticación funcionando
- [ ] CRUD operations funcionales
- [ ] Relaciones entre entidades funcionan
- [ ] Datos persisten correctamente

### ✅ Performance
- [ ] Response time promedio < 500ms
- [ ] No hay requests > 2s
- [ ] Memory usage estable
- [ ] CPU usage < 50%

### ✅ Logs y Errores
- [ ] 0 errores críticos
- [ ] 0 warnings en logs
- [ ] No hay errores de conexión
- [ ] No hay errores de validación

---

## 📋 DECISION MATRIX

### Si 15/15 tests PASAN ✅

```
✅ ETAPA 3 SMOKE TESTS - COMPLETADA
├─ 15/15 tests exitosos
├─ Funcionalidad crítica validada
├─ BD operacional
├─ Performance aceptable
└─ DECISIÓN: ✅ PROCEDER A ETAPA 4 (DEPLOY A PRODUCCIÓN)
```

### Si algún test FALLA ❌

```
⚠️ TEST FALLIDO DETECTADO
├─ Test: [nombre del test]
├─ Error: [descripción del error]
├─ Root Cause: [análisis]
└─ Acción: BLOQUEAR DEPLOY - Investigar y arreglar
```

---

## 🎬 FLUJO DE EJECUCIÓN

```
ETAPA 2 (Testing BD Real)
        ↓
   ✅ COMPLETADA
        ↓
ETAPA 3 (Smoke Tests)
        ↓
   Ejecutar 15 tests
        ↓
    ¿Todos pasan?
    /          \
  SÍ            NO
  ↓             ↓
✅ Proceder    ❌ Investigar
 a ETAPA 4      y arreglar
```

---

## 🔍 VALIDACIÓN DETALLADA

### Por cada test fallido, ejecutar:

1. **Revisar logs:**
   ```bash
   vercel logs bge-staging --follow
   ```

2. **Verificar endpoint:**
   ```bash
   curl -v https://bge-staging.vercel.app/api/[endpoint]
   ```

3. **Analizar error:**
   - ¿Error de BD?
   - ¿Error de autenticación?
   - ¿Error de validación?
   - ¿Timeout?

4. **Arreglar:**
   - Modificar código si es necesario
   - Redeployar a staging
   - Reintentar test

---

## 📋 CHECKLIST ETAPA 3

- [ ] Suite de 15 smoke tests ejecutada
- [ ] Autenticación: 3/3 tests pasando
- [ ] Académicos: 3/3 tests pasando
- [ ] CRUD: 3/3 tests pasando
- [ ] Gestión: 3/3 tests pasando
- [ ] Persistencia: 3/3 tests pasando
- [ ] Total: 15/15 tests ✅
- [ ] Tasa de éxito: 100%
- [ ] Status: LISTO PARA ETAPA 4 (DEPLOY A PRODUCCIÓN)

---

## 🚀 PRÓXIMO PASO

Una vez que todos los 15 tests PASEN:

**ETAPA 4: DEPLOY A PRODUCCIÓN**
- Deployar v7.0.0 a Vercel production
- Ejecutar validación de health endpoint
- Confirmar usuarios pueden acceder
- Validar que datos se persisten

---

**¿ETAPA 3 SMOKE TESTS COMPLETADA?** ✅

**Status Esperado:** 15/15 tests pasando (100%)
**Próximo:** ETAPA 4 - Deploy a Producción
