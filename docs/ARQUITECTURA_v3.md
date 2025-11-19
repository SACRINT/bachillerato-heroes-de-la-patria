# ARQUITECTURA BGE v3.0
## Bachillerato General Estatal "Héroes de la Patria"
**Fecha**: 19 Noviembre 2025
**Versión**: 3.0.0-dev
**Rama**: feature/24-week-autonomous-development

---

## 1. RESUMEN EJECUTIVO

BGE es una plataforma educativa integral con arquitectura **Service Layer + Multi-Tenant** desplegada en **Vercel** con **PostgreSQL** en **Neon**. El sistema soporta múltiples instituciones educativas con aislamiento de datos mediante Row-Level Security (RLS).

### Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos JS Backend | 155 (84 routes + 49 services + 22 middleware) |
| Archivos JS Frontend | 314 |
| Páginas HTML | 38 |
| Archivos CSS | 13 |
| Líneas código principal | ~3,540 (api/app.js + server.js + database-access.js) |
| Migraciones SQL | 12 |
| Seeds SQL | 8 |
| Dependencias producción | 38 |
| Dependencias desarrollo | 28 |

---

## 2. ESTRUCTURA DE DIRECTORIOS

```
bachillerato-heroes-de-la-patria/
├── api/                    # Serverless functions (Vercel) - 93 KB
│   ├── app.js              # Express app principal (1,424 líneas)
│   ├── index.js            # Entry point serverless
│   └── debug-*.js          # Endpoints de debugging
├── backend/                # Servidor Express + lógica de negocio - 4.7 MB
│   ├── server.js           # Servidor local (499 líneas)
│   ├── routes/             # 84 archivos de rutas
│   ├── services/           # 49 servicios de negocio
│   ├── middleware/         # 22 middlewares
│   ├── data/               # Data Access Layer
│   ├── migrations/         # 12 migraciones SQL
│   ├── seeds/              # 8 seeds de datos
│   └── scripts/            # Scripts de automatización
├── public/                 # Frontend estático - 129 MB
│   ├── js/                 # 314 archivos JavaScript
│   ├── css/                # 13 archivos CSS
│   ├── *.html              # 38 páginas HTML
│   └── assets/             # Imágenes, fuentes, iconos
├── partials/               # Componentes HTML reutilizables
│   ├── header.html
│   └── footer.html
├── templates/              # Plantillas de email
├── docs/                   # Documentación técnica - 1.9 MB
├── __tests__/              # Suite de testing Jest
└── no_usados/              # Código archivado (276 archivos)
```

---

## 3. PATRÓN ARQUITECTÓNICO

### 3.1 Service Layer Pattern + MVC

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Cliente   │ →  │  Middleware     │ →  │   Routes    │
│  (Browser)  │    │   Pipeline      │    │             │
└─────────────┘    └─────────────────┘    └──────┬──────┘
                                                  │
                                                  ↓
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│  Response   │ ←  │    Services     │ ←  │     DAL     │
│   (JSON)    │    │  (Lógica Neg.)  │    │ (database-  │
└─────────────┘    └─────────────────┘    │  access.js) │
                                          └──────┬──────┘
                                                  │
                                                  ↓
                                          ┌─────────────┐
                                          │ PostgreSQL  │
                                          │   (Neon)    │
                                          └─────────────┘
```

### 3.2 Flujo de Request HTTP

1. **Cliente** → HTTP Request
2. **Vercel Edge** → `/api/index.js`
3. **Express App** (`api/app.js`)
4. **Middleware Pipeline**:
   - CORS
   - Helmet (Security Headers)
   - Rate Limiting
   - Cookie Parser
   - JSON Parser
   - Tenant Context
   - Auth Middleware (JWT verify)
5. **Route Handler** (`/backend/routes/*`)
6. **Service Layer** (`/backend/services/*`)
7. **DAL** (`/backend/data/database-access.js`)
8. **PostgreSQL** (Neon)
9. **Response** ← JSON

---

## 4. BACKEND

### 4.1 Rutas (84 archivos)

#### Autenticación y Usuarios
| Archivo | Propósito |
|---------|-----------|
| `auth.js` | Login, registro, Google OAuth |
| `admin.js` | Panel administrativo |
| `students.js` | Gestión de estudiantes |
| `teachers.js` | Gestión de docentes |
| `parents.js` | Portal de padres |

#### Contenido y CMS
| Archivo | Propósito |
|---------|-----------|
| `noticias.js` | Gestión de noticias |
| `eventos.js` | Calendario de eventos |
| `avisos.js` | Avisos institucionales |
| `cms.js` | Sistema de gestión de contenido |
| `digital-library.js` | Biblioteca digital |

#### IA/ML
| Archivo | Propósito |
|---------|-----------|
| `ai-database.js` | Base de datos IA |
| `real-ai.js` | Integración OpenAI |
| `chatbot-ia.js` | Chatbot inteligente |
| `analytics-predictivo.js` | Análisis predictivo |
| `recomendaciones-ml.js` | Motor de recomendaciones |
| `deteccion-riesgos.js` | Detección de riesgos académicos |

#### Multi-Tenancy
| Archivo | Propósito |
|---------|-----------|
| `tenants.js` | Gestión de tenants |
| `tenant-admin.js` | Admin de tenants |
| `multi-tenant.js` | Configuración multi-tenant |
| `config.js` | Configuración por tenant |

#### Comunicación
| Archivo | Propósito |
|---------|-----------|
| `notifications.js` | Notificaciones |
| `notifications-realtime.js` | Socket.IO notifications |
| `messaging.js` | Sistema de mensajería |
| `parentTeacherCommunication.js` | Comunicación padres-maestros |
| `newsletters.js` | Boletines informativos |

#### Académico
| Archivo | Propósito |
|---------|-----------|
| `grades.js` | Calificaciones |
| `gradesAnalytics.js` | Analíticas de calificaciones |
| `calendar.js` | Calendario académico |
| `inscriptions.js` | Inscripciones |
| `cursos.js` | Gestión de cursos |
| `google-classroom.js` | Integración Google Classroom |

#### GDPR/Compliance
| Archivo | Propósito |
|---------|-----------|
| `dsar.js` | Data Subject Access Requests |
| `right-to-erasure.js` | Derecho al olvido |
| `consents.js` | Gestión de consentimientos |

### 4.2 Servicios (49 archivos)

#### Core
- `authService.js` - Autenticación y JWT
- `emailService.js` - Envío de emails (Nodemailer)
- `uploadService.js` - Gestión de archivos
- `backupService.js` - Backups automáticos
- `cache-service.js` - Sistema de cache

#### IA
- `openai-service.js` - Integración OpenAI
- `realAIService.js` - Procesamiento IA
- `localIAProcessor.js` - IA local
- `aiDatabaseIntegration.js` - BD para IA

#### Multi-Tenant
- `tenant-config-service.js` - Configuración por tenant
- `tenant-onboarding-service.js` - Onboarding tenants
- `tenant-audit-log.js` - Auditoría por tenant

#### Comunicación
- `notificationService.js` - Notificaciones
- `notification-service-realtime.js` - Realtime
- `pushNotificationService.js` - Push notifications
- `webSocketService.js` - WebSocket
- `socket-service.js` - Socket.IO

#### Reportes
- `ReportService.js` - Generación reportes
- `ExportService.js` - Exportación datos
- `analyticsService.js` - Analytics
- `gradesAnalyticsService.js` - Analytics calificaciones

#### GDPR
- `dsar-service.js` - DSAR
- `right-to-erasure-service.js` - Borrado
- `consent-management-service.js` - Consentimientos
- `audit-logging-service.js` - Auditoría

### 4.3 Middlewares (22 archivos)

#### Seguridad
| Middleware | Propósito |
|------------|-----------|
| `auth.js` | Autenticación JWT |
| `security.js` | Seguridad general |
| `csp-strict-mode.js` | CSP estricto |
| `csrf-protection.js` | Protección CSRF |
| `cors-secure.js` | CORS seguro |
| `session-security.js` | Seguridad de sesión |

#### Multi-Tenancy
| Middleware | Propósito |
|------------|-----------|
| `tenant-context.js` | Contexto de tenant |
| `tenant-context-advanced.js` | Tenant avanzado |

#### Performance y Cache
| Middleware | Propósito |
|------------|-----------|
| `cache.js` | Cache básico |
| `cache-middleware.js` | Cache middleware |
| `cache-headers.js` | Cache headers |
| `redis-cache.js` | Redis cache |
| `http-cache.js` | HTTP cache |

#### Otros
| Middleware | Propósito |
|------------|-----------|
| `rate-limiter-advanced.js` | Rate limiting |
| `input-validation.js` | Validación entrada |
| `roles.js` | Control de roles/RBAC |
| `api-versioning.js` | Versionado API |
| `errorHandler.js` | Manejo de errores |
| `logger.js` | Logging |
| `prometheus-metrics.js` | Métricas |
| `audit-logger.js` | Auditoría |

### 4.4 Data Access Layer (DAL)

**Archivo principal**: `backend/data/database-access.js` (1,617 líneas)

```javascript
// Estructura del DAL
const dal = {
  // Usuarios
  getUserByEmail(email),
  getUserById(id),
  createUser(userData),
  updateUser(id, data),

  // Estudiantes
  getAllStudents(),
  getStudentById(id),
  createStudent(data),
  updateStudent(id, data),
  deleteStudent(id),

  // Docentes
  getAllTeachers(),
  getTeacherById(id),
  createTeacher(data),

  // Calificaciones
  getGradesByStudent(studentId),
  getGradesByTeacher(teacherId),
  saveGrade(data),

  // Noticias
  getAllNews(),
  getNewsById(id),
  createNews(data),

  // Tenants
  getTenantByDomain(domain),
  createTenant(data),

  // Pending Approvals
  getPendingApprovals(),
  approveRequest(id),
  rejectRequest(id),

  // ... 100+ funciones más
};
```

---

## 5. FRONTEND

### 5.1 Scripts JavaScript (314 archivos)

#### Core/Framework
- `main.js` - Cargador principal (loadHeaderFooter)
- `config.js` - Configuración global
- `api-client.js` - Cliente API unificado
- `context-manager.js` - Gestor de contexto
- `bge-framework-core.js` - Core del framework BGE

#### Autenticación
- `unified-auth-system-v2.js` - Sistema de auth unificado (2,000+ líneas)
- `auth-interface.js` - Interfaz de login
- `auth-api-bridge.js` - Bridge API auth
- `auth-context-bridge.js` - Bridge contexto auth

#### Dashboard y Admin
- `dashboard-manager-2025.js` - Manager principal dashboard
- `admin-dashboard.js` - Dashboard administrativo
- `dashboard-charts.js` - Gráficas Chart.js
- `dashboard-personalizer.js` - Personalización
- `approvals-manager.js` - Gestor aprobaciones

#### Sistemas de IA
- `bge-chatbot-ia-avanzado.js` - Chatbot IA
- `ai-tutor-personalizado.js` - Tutor IA
- `ai-recommendation-engine.js` - Motor recomendaciones
- `ai-progress-dashboard.js` - Dashboard progreso IA

#### Multi-Tenant
- `bge-multi-tenant-system.js` - Sistema multi-tenant
- `tenant-config-loader.js` - Cargador config tenant

### 5.2 Estilos CSS (13 archivos)

| Archivo | Propósito |
|---------|-----------|
| `style.css` | Estilos principales |
| `dark-mode.css` | Modo oscuro |
| `themes.css` | Sistema de temas |
| `unified-auth-system-v2.css` | Estilos auth |
| `header-styles.css` | Header |
| `footer-styles.css` | Footer |
| `index-animations.css` | Animaciones |

### 5.3 Páginas HTML (38 archivos)

#### Principales
- `index.html` - Home
- `admin-dashboard.html` - Dashboard admin
- `estudiantes.html` - Portal estudiantes
- `docentes.html` - Portal docentes
- `padres.html` - Portal padres
- `egresados.html` - Portal egresados

#### Servicios
- `citas.html` - Sistema de citas
- `calendario.html` - Calendario
- `calificaciones.html` - Calificaciones
- `biblioteca.html` - Biblioteca digital
- `chatbot.html` - Chatbot IA
- `mensajeria.html` - Sistema mensajería
- `pagos.html` - Pagos en línea

#### Legales
- `aviso-privacidad.html`
- `terminos.html`
- `privacidad.html`
- `transparencia.html`
- `normatividad.html`
- `reglamento.html`

---

## 6. BASE DE DATOS

### 6.1 PostgreSQL (Neon)

**Versión**: PostgreSQL 17.x
**Host**: Neon (serverless)
**SSL**: Requerido

### 6.2 Tablas Principales

```sql
-- Usuarios y Autenticación
usuarios (id, uuid, email, password_hash, role, status, nombre, ...)
roles (id, name, permissions)
sessions (id, user_id, token, expires_at)

-- Académico
estudiantes (id, matricula, nombre, grupo, generacion, ...)
docentes (id, nombre, especialidad, email, ...)
calificaciones (id, estudiante_id, materia, parcial, calificacion, ...)
cursos (id, nombre, docente_id, semestre, ...)

-- Comunicación
notificaciones (id, usuario_id, titulo, mensaje, leida, created_at)
mensajes (id, remitente_id, destinatario_id, contenido, ...)
newsletters (id, titulo, contenido, estado, fecha_publicacion)

-- Contenido
noticias (id, titulo, contenido, estado, fecha_publicacion, ...)
avisos (id, titulo, contenido, tipo, estado, ...)
eventos (id, titulo, fecha_inicio, fecha_fin, ...)

-- Multi-Tenancy
tenants (id, domain, name, status, config_json, ...)
tenant_settings (id, tenant_id, key, value)

-- Servicios
citas (id, usuario_id, fecha_solicitada, hora_solicitada, estado, ...)
suscriptores_notificaciones (id, email, email_confirmado, ...)
bolsa_trabajo (id, nombre, email, cv_path, ...)
egresados (id, nombre, email, generacion, ...)

-- Aprobaciones
pending_approvals (id, form_type, form_data, status, created_at)

-- Financiero
ingresos (id, tenant_id, concepto, monto, fecha, ...)
gastos (id, tenant_id, concepto, monto, fecha, ...)
pagos_pendientes (id, estudiante_id, concepto, monto, ...)

-- GDPR
audit_logs (id, user_id, action, entity, timestamp)
consents (id, user_id, consent_type, granted, timestamp)
```

### 6.3 Índices de Performance (40+)

```sql
-- Usuarios
idx_usuarios_email (usuarios.email)
idx_usuarios_role (usuarios.role)
idx_usuarios_status (usuarios.status)
idx_usuarios_email_status (usuarios.email, status)

-- Citas
idx_citas_fecha (citas.fecha_solicitada)
idx_citas_estado (citas.estado)
idx_citas_usuario (citas.usuario_id)
idx_citas_fecha_estado (citas.fecha_solicitada, estado)

-- Noticias
idx_noticias_estado (noticias.estado)
idx_noticias_fecha (noticias.fecha_publicacion)
idx_noticias_estado_fecha (noticias.estado, fecha_publicacion DESC)

-- Notificaciones
idx_notificaciones_usuario (notificaciones.usuario_id)
idx_notificaciones_leida (notificaciones.leida)
idx_notificaciones_usuario_leida (notificaciones.usuario_id, leida)

-- Tenants
idx_tenants_domain (tenants.domain)
idx_tenants_status (tenants.status)
```

### 6.4 Row-Level Security (RLS)

```sql
-- Política para estudiantes
CREATE POLICY tenant_isolation_estudiantes ON estudiantes
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::int);

-- Política para calificaciones
CREATE POLICY tenant_isolation_calificaciones ON calificaciones
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::int);
```

---

## 7. SEGURIDAD

### 7.1 Autenticación

- **JWT Tokens**: Access token + Refresh token
- **Google OAuth 2.0**: Verificación server-side
- **bcrypt**: Hashing de contraseñas (cost factor 12)
- **Session management**: Cookie httpOnly + secure

### 7.2 Autorización (RBAC)

```javascript
// 7 roles definidos
const roles = [
  'super_admin',
  'admin',
  'docente',
  'estudiante',
  'padre',
  'egresado',
  'invitado'
];

// 40+ permisos granulares
const permissions = [
  'users.read', 'users.write', 'users.delete',
  'students.read', 'students.write',
  'grades.read', 'grades.write',
  'reports.generate',
  'tenants.manage',
  // ...
];
```

### 7.3 Seguridad HTTP

```javascript
// Content Security Policy
const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https:', "'unsafe-inline'"],
  'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https:'],
  'font-src': ["'self'", 'https:', 'data:'],
  'frame-src': ["'self'", 'https:'],
};

// Otros headers
app.use(helmet({
  contentSecurityPolicy: csp,
  hsts: { maxAge: 31536000 },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));
```

### 7.4 Rate Limiting

```javascript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 7.5 Sanitización XSS

- **DOMPurify**: Sanitización de HTML en frontend
- **Input validation**: Joi schemas en backend
- **Prepared statements**: Prevención SQL injection

---

## 8. SISTEMAS IMPLEMENTADOS

### 8.1 Multi-Tenancy

```
┌─────────────────────────────────────────┐
│            Super Admin                   │
│  - Gestionar todos los tenants          │
│  - Dashboard global                      │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Tenant A│ │ Tenant B│ │ Tenant C│
│ BGE Uno │ │ BGE Dos │ │ BGE Tres│
└─────────┘ └─────────┘ └─────────┘
    │           │           │
    RLS         RLS         RLS
    ↓           ↓           ↓
┌─────────────────────────────────────────┐
│           PostgreSQL (Neon)              │
│         Row-Level Security               │
└─────────────────────────────────────────┘
```

### 8.2 Sistema de IA

- **OpenAI Integration**: GPT-4 para chatbot educativo
- **Motor de Recomendaciones**: Sugerencias de cursos/materiales
- **Análisis Predictivo**: Detección de riesgos académicos
- **Tutor Personalizado**: Asistencia individualizada

### 8.3 Real-Time (Socket.IO)

```javascript
// Namespaces
/notifications  - Notificaciones en tiempo real
/chat          - Mensajería instantánea
/dashboard     - Updates de dashboard
/grades        - Actualizaciones de calificaciones

// Eventos
'notification:new'
'message:received'
'grade:updated'
'user:online'
```

### 8.4 PWA

- **Service Worker**: Caching offline
- **Web Push**: Notificaciones push
- **Manifest**: Instalación como app
- **Background Sync**: Sincronización offline

### 8.5 GDPR Compliance

- **DSAR**: Exportar datos personales
- **Right to Erasure**: Eliminar datos
- **Consent Management**: Gestión de consentimientos
- **Audit Logging**: Registro de acciones

---

## 9. TECNOLOGÍAS

### 9.1 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | >=18.0.0 | Runtime |
| Express.js | 4.18.2 | Framework web |
| PostgreSQL | 17.x | Base de datos |
| Socket.IO | 4.8.1 | Real-time |
| JWT | 9.0.2 | Autenticación |
| Helmet | 7.1.0 | Seguridad HTTP |
| Nodemailer | 7.0.6 | Email |
| OpenAI | 4.104.0 | IA/ML |
| Puppeteer | 24.30.0 | PDF generation |
| Sharp | 0.34.4 | Image processing |

### 9.2 Frontend

| Tecnología | Propósito |
|------------|-----------|
| Bootstrap 5.3.2 | UI Framework |
| Chart.js | Gráficas |
| TinyMCE | Editor WYSIWYG |
| DOMPurify | XSS Sanitization |
| FullCalendar | Calendario |

### 9.3 Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| Vercel | Deployment serverless |
| Neon | PostgreSQL hosted |
| GitHub Actions | CI/CD |
| Docker | Containerization |

---

## 10. CONFIGURACIÓN

### 10.1 package.json

```json
{
  "name": "bachillerato-heroes-patria",
  "version": "1.0.1",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node backend/server.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "build": "echo 'Skipping webpack...'"
  }
}
```

### 10.2 vercel.json

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ],
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### 10.3 Variables de Entorno

```env
# Base de Datos
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Autenticación
JWT_SECRET=<512-bit-secret>
SESSION_SECRET=<512-bit-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=<email>
SMTP_PASS=<app-password>

# APIs
OPENAI_API_KEY=<api-key>
TINYMCE_API_KEY=<api-key>
```

---

## 11. TESTING

### 11.1 Jest Configuration

```javascript
// jest.config.cjs
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.js']
};
```

### 11.2 Tests Implementados

- **Unit Tests**: DAL functions (42+ tests)
- **Integration Tests**: API endpoints
- **E2E Tests**: Flujos completos (pendiente)

---

## 12. DEPLOYMENT

### 12.1 Flujo de Deployment

```
1. git push origin main
2. GitHub Actions → Run tests
3. Vercel → Build
4. Vercel → Deploy to edge
5. Neon → Migrations (manual)
```

### 12.2 Entornos

| Entorno | URL | Base de Datos |
|---------|-----|---------------|
| Desarrollo | localhost:3000 | bge_dev |
| Staging | staging.bge.vercel.app | bge_staging |
| Producción | bge.vercel.app | bge_prod |

---

## 13. PRÓXIMOS PASOS (Plan 24 Semanas)

### Fase 1: Foundation (Semanas 1-4)
- [x] Índices PostgreSQL
- [x] Jest Testing Setup
- [x] Documentación Arquitectura
- [ ] Service Layer (StudentService, GradesService)
- [ ] Frontend Optimization
- [ ] API Standardization

### Fase 2: Security (Semanas 5-8)
- [ ] Rate Limiting avanzado
- [ ] CSRF Protection
- [ ] Auth Hardening
- [ ] E2E Tests

### Fase 3: Features (Semanas 9-12)
- [ ] Real-time notifications
- [ ] Reporting system
- [ ] Analytics dashboard

### Fase 4: Multi-Tenancy (Semanas 13-16)
- [ ] RLS completo
- [ ] Tenant onboarding
- [ ] Super admin dashboard

### Fase 5: DevOps (Semanas 17-20)
- [ ] Docker
- [ ] Kubernetes
- [ ] CI/CD completo
- [ ] Monitoring

### Fase 6: Enterprise (Semanas 21-24)
- [ ] ML features
- [ ] Mobile optimization
- [ ] PWA avanzado
- [ ] v4.0.0 release

---

## 14. ANEXOS

### A. Comandos Útiles

```bash
# Iniciar servidor local
npm start

# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Lint
npm run lint
```

### B. Referencias

- [Documentación Vercel](https://vercel.com/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Socket.IO](https://socket.io/docs/)
- [OpenAI API](https://platform.openai.com/docs/)

---

**Documento generado automáticamente**
**Arquitecto IA - Plan 24 Semanas**
**SEMANA 1 - TAREA 1.3**
