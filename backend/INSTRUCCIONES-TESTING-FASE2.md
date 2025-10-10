# 🧪 INSTRUCCIONES DE TESTING - SISTEMA DE REGISTRO DE USUARIOS - FASE 2

## 📋 RESUMEN DE IMPLEMENTACIÓN

Se ha implementado completamente el backend para el Sistema de Registro de Usuarios según las especificaciones de la FASE 2.

### ✅ ARCHIVOS CREADOS/MODIFICADOS:

#### 1. **Almacenamiento JSON**
- `backend/data/registration-requests.json` - Almacenamiento de solicitudes

#### 2. **Utilidades**
- `backend/utils/passwordGenerator.js` - Generador de contraseñas temporales seguras

#### 3. **Rutas**
- `backend/routes/auth.js` - Endpoint de solicitud de registro (POST /api/auth/request-registration)
- `backend/routes/admin.js` - **NUEVO** - Rutas de administración:
  - GET `/api/admin/pending-registrations`
  - GET `/api/admin/all-registrations`
  - POST `/api/admin/approve-registration`
  - POST `/api/admin/reject-registration`
  - GET `/api/admin/registration-stats`

#### 4. **Configuración**
- `backend/server.js` - Agregadas rutas de admin
- `backend/.env` - Variable SESSION_SECRET agregada
- `backend/data/usuarios.json` - Contraseña de admin actualizada

#### 5. **Testing**
- `backend/test-registration-system.js` - Suite completa de pruebas automatizadas

---

## 🚀 CÓMO INICIAR EL SERVIDOR

### Opción 1: Iniciar manualmente
```bash
cd C:\03BachilleratoHeroesWeb\backend
npm install
node server.js
```

### Opción 2: Con nodemon (desarrollo)
```bash
cd C:\03BachilleratoHeroesWeb\backend
npm run dev
```

### Verificar que el servidor esté activo:
```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🧪 TESTING MANUAL DE ENDPOINTS

### CREDENCIALES DE ADMINISTRADOR

```
Username: admin
Password: Admin123!@#
Email: admin@heroespatria.edu.mx
```

---

### TEST 1: Login de Administrador

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!@#"
  }'
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@heroespatria.edu.mx",
    "role": "admin",
    "permissions": [...]
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "accessTokenExpiry": 1696301200,
    "refreshTokenExpiry": 1696905200,
    "tokenType": "Bearer"
  }
}
```

**GUARDAR EL accessToken para las siguientes pruebas**

---

### TEST 2: Enviar Solicitud de Registro Válida

**Endpoint:** `POST /api/auth/request-registration`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Juan Carlos Pérez García",
    "email": "juan.perez@bge.edu.mx",
    "requestedRole": "docente",
    "reason": "Necesito acceso al sistema para gestionar las calificaciones de mis grupos de matemáticas de tercero y quinto semestre. También requiero actualizar el material didáctico disponible.",
    "phone": "3312345678"
  }'
```

**Respuesta Esperada (201):**
```json
{
  "success": true,
  "message": "Solicitud de registro enviada exitosamente",
  "requestId": "req_1696291200000_1",
  "data": {
    "id": "req_1696291200000_1",
    "email": "juan.perez@bge.edu.mx",
    "status": "pending",
    "createdAt": "2025-10-02T..."
  }
}
```

---

### TEST 3: Rechazar Email No Institucional

**Endpoint:** `POST /api/auth/request-registration`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "María López Hernández",
    "email": "maria.lopez@gmail.com",
    "requestedRole": "estudiante",
    "reason": "Este es un motivo de prueba que debe tener al menos cincuenta caracteres para pasar la validación del sistema y poder enviar correctamente.",
    "phone": "3312345678"
  }'
```

**Respuesta Esperada (400):**
```json
{
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "email",
      "message": "Solo se permiten correos institucionales (@bge.edu.mx, @bgeheroespatria.edu.mx)"
    }
  ]
}
```

---

### TEST 4: Rechazar Motivo Muy Corto

**Endpoint:** `POST /api/auth/request-registration`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/request-registration \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Pedro Ramírez Sánchez",
    "email": "pedro.ramirez@bge.edu.mx",
    "requestedRole": "estudiante",
    "reason": "Motivo corto",
    "phone": "3312345678"
  }'
```

**Respuesta Esperada (400):**
```json
{
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "reason",
      "message": "El motivo debe tener entre 50 y 1000 caracteres"
    }
  ]
}
```

---

### TEST 5: Rechazar Solicitud Duplicada

**Enviar dos veces la misma solicitud con el mismo email**

**Respuesta Esperada en segundo intento (409):**
```json
{
  "success": false,
  "error": "Solicitud duplicada",
  "message": "Ya existe una solicitud pendiente para este email. Por favor espera a que sea revisada."
}
```

---

### TEST 6: Obtener Solicitudes Pendientes (Requiere Autenticación)

**Endpoint:** `GET /api/admin/pending-registrations`

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/pending-registrations \
  -H "Authorization: Bearer {TU_ACCESS_TOKEN}"
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "count": 2,
  "requests": [
    {
      "id": "req_1696291200000_1",
      "fullName": "Juan Carlos Pérez García",
      "email": "juan.perez@bge.edu.mx",
      "requestedRole": "docente",
      "reason": "Necesito acceso...",
      "phone": "3312345678",
      "status": "pending",
      "createdAt": "2025-10-02T...",
      "reviewedBy": null,
      "reviewedAt": null,
      "reviewNotes": null
    }
  ],
  "totalRequests": 2,
  "timestamp": "2025-10-02T..."
}
```

---

### TEST 7: Intentar Acceso Sin Autenticación

**Endpoint:** `GET /api/admin/pending-registrations`

**Request (sin header Authorization):**
```bash
curl -X GET http://localhost:3000/api/admin/pending-registrations
```

**Respuesta Esperada (401):**
```json
{
  "success": false,
  "error": "Token de acceso requerido",
  "message": "Header Authorization requerido con formato: Bearer <token>"
}
```

---

### TEST 8: Aprobar Solicitud

**Endpoint:** `POST /api/admin/approve-registration`

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/approve-registration \
  -H "Authorization: Bearer {TU_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req_1696291200000_1",
    "reviewNotes": "Solicitud aprobada - perfil académico válido"
  }'
```

**Respuesta Esperada (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 4,
    "email": "juan.perez@bge.edu.mx",
    "username": "juan.perez",
    "role": "docente",
    "temporaryPassword": "BGE2024xY7z!"
  },
  "request": {
    "id": "req_1696291200000_1",
    "status": "approved",
    "reviewedAt": "2025-10-02T..."
  },
  "notice": "IMPORTANTE: Guarda la contraseña temporal y envíala al usuario de forma segura. Esta es la única vez que se mostrará."
}
```

---

### TEST 9: Rechazar Solicitud

**Endpoint:** `POST /api/admin/reject-registration`

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/reject-registration \
  -H "Authorization: Bearer {TU_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req_1696291200000_2",
    "reviewNotes": "Motivo insuficiente para otorgar acceso al sistema. Se requiere mayor justificación."
  }'
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "message": "Solicitud rechazada exitosamente",
  "request": {
    "id": "req_1696291200000_2",
    "email": "estudiante@bge.edu.mx",
    "status": "rejected",
    "reviewedBy": "admin@heroespatria.edu.mx",
    "reviewedAt": "2025-10-02T...",
    "reviewNotes": "Motivo insuficiente..."
  }
}
```

---

### TEST 10: Obtener Estadísticas

**Endpoint:** `GET /api/admin/registration-stats`

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/registration-stats \
  -H "Authorization: Bearer {TU_ACCESS_TOKEN}"
```

**Respuesta Esperada (200):**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "pending": 2,
    "approved": 2,
    "rejected": 1,
    "byRole": {
      "docente": 2,
      "estudiante": 2,
      "administrativo": 1
    },
    "recent": {
      "last24h": 5,
      "last7days": 5
    }
  },
  "timestamp": "2025-10-02T..."
}
```

---

## 🤖 TESTING AUTOMATIZADO

### Ejecutar Suite Completa de Pruebas

```bash
cd C:\03BachilleratoHeroesWeb\backend

# Asegurarse de que el servidor esté corriendo
node server.js

# En otra terminal, ejecutar tests
node test-registration-system.js
```

**Resultado Esperado:**
```
╔══════════════════════════════════════════════════════════╗
║  🧪 TESTING SISTEMA DE REGISTRO DE USUARIOS - FASE 2   ║
╚══════════════════════════════════════════════════════════╝

🧪 TEST 1: Login de administrador
✅ Login exitoso - Token obtenido
ℹ️  Usuario: admin@heroespatria.edu.mx (admin)

🧪 TEST 2: Enviar solicitud de registro válida
✅ Solicitud válida aceptada
ℹ️  Request ID: req_...

... (continúa con todos los tests)

════════════════════════════════════════════════════════════
║                    RESUMEN DE PRUEBAS                    ║
════════════════════════════════════════════════════════════
  Tests ejecutados: 10
  ✅ Exitosos: 10
  ❌ Fallidos: 0
  📊 Tasa de éxito: 100.00%
════════════════════════════════════════════════════════════

🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE

✅ El sistema está listo para FASE 3 (Dashboard)
```

---

## 📊 VALIDACIONES IMPLEMENTADAS

### Solicitud de Registro:
- ✅ Nombre completo: 5-200 caracteres, solo letras
- ✅ Email institucional: @bge.edu.mx o @bgeheroespatria.edu.mx
- ✅ Rol: docente, estudiante o administrativo
- ✅ Motivo: 50-1000 caracteres
- ✅ Teléfono: 10 dígitos (opcional)
- ✅ Rate limiting: 3 solicitudes por hora por IP
- ✅ Prevención de duplicados

### Seguridad:
- ✅ Contraseñas temporales generadas con alta complejidad
- ✅ Sanitización de inputs (prevención XSS)
- ✅ Autenticación JWT requerida para rutas admin
- ✅ Verificación de rol de administrador
- ✅ Logging de todas las operaciones

---

## 🔒 SEGURIDAD IMPLEMENTADA

1. **Rate Limiting**: 3 solicitudes de registro por hora por IP
2. **Validación de Email Institucional**: Solo dominios permitidos
3. **Sanitización de Inputs**: Prevención de ataques XSS
4. **Contraseñas Temporales Seguras**:
   - Mínimo 12 caracteres
   - Mayúsculas, minúsculas, números y símbolos
   - No caracteres ambiguos (0, O, 1, I, l)
5. **Hash de Contraseñas**: bcrypt con 12 rounds
6. **Autenticación JWT**: Tokens de acceso y refresh
7. **Verificación de Permisos**: Middleware requireAdmin

---

## 📁 ESTRUCTURA DE DATOS

### Archivo: `registration-requests.json`
```json
{
  "requests": [
    {
      "id": "req_1696291200000_1",
      "fullName": "Juan Carlos Pérez García",
      "email": "juan.perez@bge.edu.mx",
      "requestedRole": "docente",
      "reason": "Motivo del registro...",
      "phone": "3312345678",
      "status": "pending",  // pending | approved | rejected
      "createdAt": "2025-10-02T10:00:00.000Z",
      "reviewedBy": null,  // email del admin que revisó
      "reviewedAt": null,  // timestamp de revisión
      "reviewNotes": null,  // notas del revisor
      "ipAddress": "::1"  // IP desde donde se envió
    }
  ],
  "lastId": 1
}
```

---

## 🎯 PRÓXIMOS PASOS - FASE 3

### Dashboard de Administración (Frontend)

1. **Interfaz de Solicitudes Pendientes**
   - Tabla con filtros por rol, fecha, estado
   - Búsqueda por email/nombre
   - Paginación

2. **Vista Detallada de Solicitud**
   - Información completa del solicitante
   - Botones Aprobar/Rechazar
   - Campo para notas de revisión

3. **Notificaciones en Tiempo Real**
   - Alerta cuando hay nuevas solicitudes
   - Badge con contador de pendientes

4. **Estadísticas Visuales**
   - Gráficas de solicitudes por rol
   - Tendencia de aprobaciones/rechazos
   - Métricas de tiempo de respuesta

5. **Sistema de Notificaciones por Email**
   - Enviar email al aprobar con contraseña temporal
   - Notificación de rechazo con motivo
   - Email de bienvenida al sistema

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "SESSION_SECRET environment variable is required"
Asegurarse de que existe el archivo `.env` con:
```
JWT_SECRET=heroes_patria_jwt_secret_key_2024_super_secure
SESSION_SECRET=heroes_patria_session_secret_2024_super_secure
```

### Error: "Address already in use :::3000"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error de login: "Credenciales inválidas"
Verificar que el archivo `backend/data/usuarios.json` tenga el admin con la contraseña correcta:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@heroespatria.edu.mx",
  "password_hash": "$2a$12$ZWeJ78zYqEXmVCfGtRNjUuBUNP//8Wj413nkhRY0sJ3Qazh81CV0q",
  "role": "admin",
  "active": true
}
```

Contraseña: `Admin123!@#`

---

## 📞 SOPORTE

Para dudas o problemas:
- Revisar logs del servidor: `backend/server.log`
- Verificar archivo de solicitudes: `backend/data/registration-requests.json`
- Revisar archivo de usuarios: `backend/data/usuarios.json`

---

**🎉 FASE 2 COMPLETADA EXITOSAMENTE**

El sistema está listo para integración con el frontend y avanzar a la FASE 3.
