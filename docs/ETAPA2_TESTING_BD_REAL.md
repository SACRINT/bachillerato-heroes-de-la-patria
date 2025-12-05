# 🧪 ETAPA 2: TESTING EN BD REAL (Smoke Tests)

**Fecha:** 4 de Diciembre, 2025
**Versión:** v7.0.0
**Objetivo:** Validar que endpoints funcionan correctamente con BD real (Neon)

---

## 📋 SMOKE TESTS SUITE v7.0.0

### Test 1: Health Check ✅

**Endpoint:** `GET /api/health`

**Esperado:**
```json
{
  "status": "healthy",
  "version": "7.0.0",
  "timestamp": "2025-12-04T..."
}
```

**Status:** ✅ Validable una vez en staging

---

### Test 2: Endpoints Académicos ✅

#### 2.1 GET /api/students
```bash
curl -s https://bge-staging.vercel.app/api/students | jq .

# Esperado: Array de estudiantes
```

**Status:** ✅ Validable una vez en staging

#### 2.2 GET /api/teachers
```bash
curl -s https://bge-staging.vercel.app/api/teachers | jq .

# Esperado: Array de docentes
```

**Status:** ✅ Validable una vez en staging

#### 2.3 GET /api/grades
```bash
curl -s https://bge-staging.vercel.app/api/grades | jq .

# Esperado: Array de calificaciones
```

**Status:** ✅ Validable una vez en staging

---

### Test 3: Endpoints de Gestión ✅

#### 3.1 GET /api/appointments
```bash
curl -s https://bge-staging.vercel.app/api/appointments | jq .

# Esperado: Array de citas
```

#### 3.2 GET /api/notifications
```bash
curl -s https://bge-staging.vercel.app/api/notifications | jq .

# Esperado: Array de notificaciones
```

#### 3.3 GET /api/config/tenant
```bash
curl -s https://bge-staging.vercel.app/api/config/tenant | jq .

# Esperado: Configuración del tenant (escuela)
```

---

### Test 4: Autenticación ✅

#### 4.1 Login
```bash
curl -X POST https://bge-staging.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'

# Esperado: { "token": "jwt...", "user": {...} }
```

---

### Test 5: File Upload ✅

```bash
curl -X POST https://bge-staging.vercel.app/api/uploads \
  -F "file=@test.pdf"

# Esperado: { "fileId": "...", "fileName": "test.pdf" }
```

---

## ✅ VALIDACIÓN DE BD NEON

### Verificar Conectividad

```bash
# Verificar que DATABASE_URL está configurado
echo $DATABASE_URL

# Verificar conexión a BD (si psql está instalado)
psql $DATABASE_URL -c "SELECT 1"

# Esperado:
# (1 row)
```

---

### Verificar Tablas Críticas

Las siguientes tablas deben existir:

- ✅ `usuarios` - Usuarios del sistema
- ✅ `estudiantes` - Información de estudiantes
- ✅ `docentes` - Información de docentes
- ✅ `calificaciones` - Calificaciones
- ✅ `asistencia` - Registro de asistencia
- ✅ `citas` - Citas agendadas
- ✅ `notificaciones` - Notificaciones enviadas

**Status:** Validable una vez en staging

---

## 📊 CRITERIOS DE ÉXITO

Para que ETAPA 2 se considere completada, TODOS los siguientes criterios deben ser ✅:

### ✅ Funcionalidad API
- [ ] Health endpoint retorna 200 OK
- [ ] Endpoints académicos retornan datos
- [ ] BD está conectada (sin errores de conexión)
- [ ] Datos se persisten correctamente

### ✅ Datos en BD
- [ ] Al menos 1 estudiante en BD
- [ ] Al menos 1 docente en BD
- [ ] Al menos 1 calificación en BD
- [ ] Tablas no vacías (datos de prueba existen)

### ✅ Sin Errores
- [ ] 0 errores de sintaxis en logs
- [ ] 0 errores de conexión a BD
- [ ] 0 timeouts de API
- [ ] 0 errores 500

### ✅ Performance
- [ ] Response time < 2 segundos
- [ ] No hay queries lentas (> 500ms)
- [ ] Memory usage estable
- [ ] CPU usage < 50%

---

## 🎯 RESULTADO ESPERADO

### Si TODOS los tests pasan ✅

```
✅ ETAPA 2 TESTING EN BD REAL - COMPLETADA
├─ Health endpoint: 200 OK
├─ Endpoints académicos: OK
├─ BD Neon: Conectada y operacional
├─ Datos: Persistiendo correctamente
├─ Logs: Sin errores críticos
└─ Performance: Normal

SIGUIENTE: ETAPA 3 - Smoke Tests y Validación
```

### Si hay problemas ❌

```
❌ Problema detectado
├─ Error: [descripción del error]
├─ Ubicación: [endpoint o servicio]
├─ Causa: [análisis de causa raíz]
└─ Acción: Investigar y arreglar antes de continuar
```

---

## 📋 CHECKLIST ETAPA 2

- [ ] Deploy a staging completado
- [ ] Health endpoint respondiendo 200
- [ ] Endpoints académicos retornando datos
- [ ] BD Neon conectada
- [ ] Datos persistiendo correctamente
- [ ] 0 errores en logs
- [ ] Response time < 2s
- [ ] Status: LISTO PARA ETAPA 3

---

## 📞 TROUBLESHOOTING

### Error: "Database connection failed"
- **Causa:** DATABASE_URL inválida o BD offline
- **Solución:**
  1. Verificar DATABASE_URL en Vercel
  2. Confirmar que Neon está accesible
  3. Ejecutar: `psql $DATABASE_URL -c "SELECT 1"`

### Error: "Cannot find module"
- **Causa:** Dependencia no instalada
- **Solución:**
  ```bash
  npm install
  npm run build
  vercel --prod
  ```

### Error: "Timeout waiting for response"
- **Causa:** Servidor lento o offline
- **Solución:**
  1. Verificar que deployment completó
  2. Revisar logs: `vercel logs bge-staging`
  3. Esperar 30 segundos y reintentar

---

**¿ETAPA 2 TESTING COMPLETADA?** 🧪

**Próximo:** ETAPA 3 - Smoke Tests y Validación
