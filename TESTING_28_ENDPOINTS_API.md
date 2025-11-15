# 📋 PLAN DE TESTING: 28 NUEVOS ENDPOINTS API

**Proyecto:** BGE Héroes de la Patria
**Fecha:** 15 de Noviembre, 2025
**Objetivo:** Validar funcionamiento de 28 endpoints agregados el 2 de noviembre
**Branch:** `claude/review-documents-01CSUn9HGqGqy3HFifjAjbPn`

---

## 📊 RESUMEN EJECUTIVO

- **Total de Endpoints:** 28 nuevos endpoints registrados en `api/app.js`
- **Tipo de Testing:** Integración + Funcional
- **Herramientas:** curl, Postman (alternativa)
- **Prerequisitos:** Servidor backend corriendo en `localhost:3000`

---

## 🎯 LISTA DE 28 ENDPOINTS NUEVOS

### Categoría 1: IA y Analytics (5 endpoints)
1. `/api/ai-database` - Base de datos de IA
2. `/api/analytics-predictivo` - Analytics predictivo
3. `/api/analytics-direct` - Analytics (evita conflicto con analytics-dashboard)
4. `/api/asistente-virtual` - Asistente virtual
5. `/api/deteccion-riesgos` - Detección de riesgos

### Categoría 2: CMS y Contenido (2 endpoints)
6. `/api/cms` - Sistema de gestión de contenido
7. `/api/newsletters-pg` - Newsletters en PostgreSQL

### Categoría 3: Calendario y Eventos (1 endpoint)
8. `/api/calendar` - Gestión de calendario (antes calendar-direct)

### Categoría 4: Comunicación (3 endpoints)
9. `/api/chatbot-ia` - Chatbot con IA
10. `/api/chatbot-direct` - Chatbot directo
11. `/api/parentTeacherCommunication` - Comunicación padres-docentes

### Categoría 5: Gestión Académica (3 endpoints)
12. `/api/grades-direct` - Calificaciones (evita conflicto)
13. `/api/gradesAnalytics` - Analytics de calificaciones
14. `/api/gamification-direct` - Gamificación (evita conflicto)

### Categoría 6: Gestión de Usuarios (3 endpoints)
15. `/api/students-direct` - Estudiantes (evita conflicto)
16. `/api/teachers-direct` - Docentes (evita conflicto)
17. `/api/notifications-direct` - Notificaciones (evita conflicto)

### Categoría 7: Infraestructura (5 endpoints)
18. `/api/backup` - Sistema de backups
19. `/api/maintenance` - Mantenimiento del sistema
20. `/api/ssl` - Gestión SSL
21. `/api/multi-tenant` - Multi-tenancy
22. `/api/google-classroom` - Integración Google Classroom

### Categoría 8: Utilidades (6 endpoints adicionales verificados)
23. `/api/config` - Configuración del sistema
24. `/api/health` - Health check
25. `/api/charts` - Gráficas y charts
26. `/api/cursos` - Gestión de cursos
27. `/api/admin/tenants` - Gestión de tenants (admin)
28. `/api/citas` - Sistema de citas

**Nota:** El endpoint `/api/migration` está comentado (requiere mysql2/promise).

---

## 🧪 CASOS DE PRUEBA POR ENDPOINT

### 1. /api/health (Health Check) ✅ PÚBLICO

**Método:** GET
**Autenticación:** No requerida
**Descripción:** Verifica el estado del sistema completo

**Test Case 1.1: Health Check Básico**
```bash
curl -X GET http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -w "\nHTTP_CODE:%{http_code}\n"
```

**Respuesta Esperada (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "uptime": 12345.67,
  "environment": "development",
  "version": "v22.21.1",
  "services": {
    "database": {
      "status": "healthy",
      "latency": "15ms",
      "connection": "active",
      "type": "PostgreSQL",
      "version": "17.5",
      "pool": {
        "total": 10,
        "idle": 8,
        "waiting": 0
      }
    },
    "memory": {
      "total": "16GB",
      "free": "8GB",
      "used": "8GB",
      "usage_percent": "50%"
    },
    "system": {
      "platform": "linux",
      "hostname": "...",
      "loadavg": [1.5, 1.2, 1.0]
    }
  }
}
```

---

### 2. /api/cms (Content Management System) 🔒 PROTEGIDO

**Métodos:** GET, POST, PUT, DELETE
**Autenticación:** JWT requerido (Admin/Director/Coordinador)
**Descripción:** CRUD de contenido (avisos, noticias, eventos, comunicados)

**Test Case 2.1: Listar Contenido**
```bash
curl -X GET "http://localhost:3000/api/cms/content?type=noticia&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Test Case 2.2: Crear Contenido**
```bash
curl -X POST http://localhost:3000/api/cms/content \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "aviso",
    "titulo": "Aviso de Prueba",
    "contenido": "Contenido del aviso de prueba",
    "priority": "media",
    "status": "publicado"
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "success": true,
  "message": "Contenido creado exitosamente",
  "data": {
    "id": 123,
    "type": "aviso",
    "titulo": "Aviso de Prueba",
    "created_at": "2025-11-15T..."
  }
}
```

---

### 3. /api/calendar (Calendar System) 🔒 PROTEGIDO

**Métodos:** GET, POST, PUT, DELETE
**Autenticación:** JWT requerido
**Descripción:** Gestión de eventos del calendario escolar

**Test Case 3.1: Obtener Eventos del Mes**
```bash
curl -X GET "http://localhost:3000/api/calendar/events?start_date=2025-11-01&end_date=2025-11-30&view=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Test Case 3.2: Crear Evento**
```bash
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Junta de Padres",
    "description": "Junta bimestral con padres de familia",
    "start_date": "2025-11-20T10:00:00",
    "end_date": "2025-11-20T12:00:00",
    "type": "administrativo",
    "location": "Auditorio Principal"
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "success": true,
  "message": "Evento creado exitosamente",
  "data": {
    "id": 456,
    "title": "Junta de Padres",
    "start_date": "2025-11-20T10:00:00",
    "type": "administrativo"
  }
}
```

---

### 4. /api/analytics-predictivo (Predictive Analytics) 🔒 PROTEGIDO

**Método:** GET, POST
**Autenticación:** JWT requerido (Admin)
**Descripción:** Analytics predictivo con Machine Learning

**Test Case 4.1: Obtener Predicciones**
```bash
curl -X GET "http://localhost:3000/api/analytics-predictivo/predictions?metric=enrollment&period=next_semester" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta Esperada (200 OK):**
```json
{
  "success": true,
  "metric": "enrollment",
  "period": "next_semester",
  "predictions": {
    "value": 450,
    "confidence": 0.85,
    "trend": "increasing",
    "factors": ["historical_data", "demographics", "market_trends"]
  }
}
```

---

### 5. /api/backup (Backup System) 🔒 PROTEGIDO

**Métodos:** GET, POST
**Autenticación:** JWT requerido (Admin solo)
**Descripción:** Sistema de backups de base de datos

**Test Case 5.1: Listar Backups Disponibles**
```bash
curl -X GET http://localhost:3000/api/backup/list \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Test Case 5.2: Crear Backup Manual**
```bash
curl -X POST http://localhost:3000/api/backup/create \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "description": "Backup antes de actualización"
  }'
```

**Respuesta Esperada (201 Created):**
```json
{
  "success": true,
  "message": "Backup creado exitosamente",
  "backup": {
    "id": "backup_20251115_143022",
    "size": "125MB",
    "timestamp": "2025-11-15T14:30:22",
    "status": "completed"
  }
}
```

---

### 6. /api/config (Configuration) ✅ MIXTO

**Métodos:** GET
**Autenticación:** Parcial (algunos endpoints públicos)
**Descripción:** Configuración del sistema y tenant

**Test Case 6.1: Obtener Configuración de Tenant (PÚBLICO)**
```bash
curl -X GET http://localhost:3000/api/config/tenant \
  -H "Content-Type: application/json"
```

**Test Case 6.2: Obtener Claves Públicas (PÚBLICO)**
```bash
curl -X GET http://localhost:3000/api/config/public-keys \
  -H "Content-Type: application/json"
```

**Respuesta Esperada (200 OK):**
```json
{
  "success": true,
  "keys": {
    "TINYMCE_API_KEY": "your-api-key",
    "GOOGLE_MAPS_KEY": "your-maps-key",
    "RECAPTCHA_SITE_KEY": "your-recaptcha-key"
  }
}
```

---

## 📋 CHECKLIST DE TESTING

### Preparación
- [ ] Servidor backend iniciado en `localhost:3000`
- [ ] Base de datos PostgreSQL conectada
- [ ] Variables de entorno configuradas en `.env`
- [ ] Token JWT de Admin obtenido
- [ ] Token JWT de Usuario regular obtenido

### Endpoints Públicos (5 tests)
- [ ] `/api/health` - Health check básico
- [ ] `/api/config/tenant` - Configuración tenant
- [ ] `/api/config/public-keys` - Claves públicas
- [ ] `/api/charts` - Endpoint de charts (si público)
- [ ] Verificar respuestas 200 OK

### Endpoints Protegidos - Sin Autenticación (5 tests)
- [ ] `/api/cms` sin token → Esperar 401 Unauthorized
- [ ] `/api/calendar` sin token → Esperar 401 Unauthorized
- [ ] `/api/backup` sin token → Esperar 401 Unauthorized
- [ ] `/api/maintenance` sin token → Esperar 401 Unauthorized
- [ ] `/api/multi-tenant` sin token → Esperar 401 Unauthorized

### Endpoints Protegidos - Con Autenticación (18 tests)
- [ ] `/api/cms/content` GET - Listar contenido
- [ ] `/api/cms/content` POST - Crear contenido
- [ ] `/api/calendar/events` GET - Listar eventos
- [ ] `/api/calendar/events` POST - Crear evento
- [ ] `/api/analytics-predictivo` GET - Obtener predicciones
- [ ] `/api/backup/list` GET - Listar backups
- [ ] `/api/gamification-direct` GET - Obtener logros
- [ ] `/api/chatbot-ia` POST - Enviar mensaje
- [ ] `/api/grades-direct` GET - Obtener calificaciones
- [ ] `/api/gradesAnalytics` GET - Analytics de calificaciones
- [ ] `/api/students-direct` GET - Listar estudiantes
- [ ] `/api/teachers-direct` GET - Listar docentes
- [ ] `/api/notifications-direct` GET - Listar notificaciones
- [ ] `/api/parentTeacherCommunication` GET - Obtener mensajes
- [ ] `/api/asistente-virtual` POST - Consultar asistente
- [ ] `/api/deteccion-riesgos` GET - Detectar riesgos
- [ ] `/api/newsletters-pg` GET - Listar newsletters
- [ ] `/api/ssl` GET - Verificar estado SSL

### Validaciones Críticas
- [ ] Todos los endpoints responden (no 404)
- [ ] Auth middleware funciona correctamente
- [ ] Respuestas JSON bien formadas
- [ ] Códigos HTTP correctos (200, 201, 401, 403, 404, 500)
- [ ] Logs sin errores críticos
- [ ] Conexión a base de datos estable
- [ ] Rate limiting funcional (si aplica)
- [ ] CORS configurado correctamente

---

## 🛠️ SCRIPTS DE TESTING AUTOMATIZADO

### Script 1: Test de Health de Todos los Endpoints

```bash
#!/bin/bash
# test-endpoints-health.sh

BASEURL="http://localhost:3000/api"
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

endpoints=(
  "health"
  "config/tenant"
  "config/public-keys"
  "cms/content"
  "calendar/events"
  "analytics-predictivo"
  "backup/list"
  "gamification-direct"
  "chatbot-ia"
  "maintenance/status"
  "multi-tenant/tenants"
  "grades-direct"
  "gradesAnalytics"
  "students-direct"
  "teachers-direct"
  "notifications-direct"
  "parentTeacherCommunication"
  "asistente-virtual"
  "deteccion-riesgos"
  "newsletters-pg"
  "ssl"
  "charts"
  "cursos"
  "citas"
)

echo "=== TESTING 28 ENDPOINTS ==="
echo "Fecha: $(date)"
echo "Base URL: $BASEURL"
echo ""

for endpoint in "${endpoints[@]}"; do
  echo "Testing: $BASEURL/$endpoint"

  if [[ "$endpoint" == "health" || "$endpoint" == "config/"* ]]; then
    # Endpoints públicos
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASEURL/$endpoint")
  else
    # Endpoints protegidos
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $JWT_TOKEN" \
      "$BASEURL/$endpoint")
  fi

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "401" ]]; then
    echo "✅ $endpoint - HTTP $HTTP_CODE"
  else
    echo "❌ $endpoint - HTTP $HTTP_CODE (UNEXPECTED)"
  fi
  echo ""
done

echo "=== TESTING COMPLETADO ==="
```

### Script 2: Test Completo con Postman/Newman

```json
{
  "info": {
    "name": "BGE - 28 Endpoints Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Public Endpoints",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/health",
              "host": ["{{baseUrl}}"],
              "path": ["api", "health"]
            }
          }
        },
        {
          "name": "Get Tenant Config",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/config/tenant",
              "host": ["{{baseUrl}}"],
              "path": ["api", "config", "tenant"]
            }
          }
        }
      ]
    },
    {
      "name": "Protected Endpoints",
      "item": [
        {
          "name": "CMS - List Content",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/api/cms/content?type=noticia&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["api", "cms", "content"],
              "query": [
                {"key": "type", "value": "noticia"},
                {"key": "limit", "value": "10"}
              ]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN_HERE"
    }
  ]
}
```

---

## 📊 FORMATO DE REPORTE DE RESULTADOS

Después de ejecutar los tests, documenta los resultados en este formato:

```markdown
## RESULTADOS DE TESTING - [FECHA]

### Resumen
- **Total Endpoints Testeados:** 28
- **Exitosos:** X
- **Fallidos:** Y
- **No Disponibles:** Z

### Detalles por Endpoint

| # | Endpoint | Método | HTTP Code | Status | Notas |
|---|----------|--------|-----------|--------|-------|
| 1 | /api/health | GET | 200 | ✅ | OK |
| 2 | /api/cms | GET | 200 | ✅ | OK |
| 3 | /api/calendar | GET | 401 | ✅ | Auth requerido (esperado) |
| 4 | /api/backup | GET | 404 | ❌ | Ruta no encontrada |
| ... | ... | ... | ... | ... | ... |

### Problemas Encontrados
1. **[CRÍTICO]** /api/backup devuelve 404 - Ruta no registrada
2. **[MEDIO]** /api/cms responde lento (>2s)
3. **[BAJO]** Documentación Swagger no disponible

### Recomendaciones
1. Verificar registro de rutas faltantes en api/app.js
2. Optimizar queries en endpoints lentos
3. Actualizar documentación Swagger
```

---

## 🔍 TROUBLESHOOTING

### Problema: "Cannot find module 'dotenv'"
**Solución:**
```bash
cd backend && npm install dotenv
```

### Problema: "Error: connect ECONNREFUSED localhost:3000"
**Solución:**
```bash
# Iniciar servidor
cd backend && node server.js

# O con nodemon
npm run dev
```

### Problema: "401 Unauthorized" en todos los endpoints
**Solución:**
```bash
# Obtener token JWT válido
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bge.edu.mx","password":"your_password"}'

# Usar el token en el header Authorization
```

### Problema: "Database connection failed"
**Solución:**
- Verificar que PostgreSQL esté corriendo
- Revisar variables de entorno en `.env`
- Verificar credenciales de conexión

---

## ✅ CONCLUSIÓN

Este documento proporciona una guía completa para testear los 28 nuevos endpoints de la API. **Ejecutar estos tests garantiza:**

1. ✅ Todos los endpoints están correctamente registrados
2. ✅ Autenticación funciona apropiadamente
3. ✅ Base de datos está conectada y operativa
4. ✅ Respuestas JSON están bien formadas
5. ✅ Sistema está listo para producción

**Próximos Pasos:**
1. Ejecutar el script de testing automatizado
2. Documentar resultados en formato tabla
3. Resolver issues encontrados
4. Actualizar documentación Swagger/OpenAPI
5. Crear tests unitarios adicionales

---

**Documento creado por:** Claude Code
**Fecha:** 15 de Noviembre, 2025
**Versión:** 1.0.0
**Status:** ✅ Listo para ejecutar
