# 🗺️ MAPA DE MÓDULOS Y DEPENDENCIAS

**Fecha:** 11 de Enero de 2026  
**Objetivo:** Documentar las dependencias entre módulos para una refactorización segura.

---

## 📊 RESUMEN DE MÓDULOS

| Dominio | Frontend Files | Backend Routes | Services | DAOs | Estado |
|---------|----------------|----------------|----------|------|--------|
| **Autenticación** | 8 | 5 | 6 | 2 | ⚠️ Fragmentado |
| **Calificaciones** | 5 | 3 | 4 | 2 | ✅ Funcional |
| **Mensajería** | 2 | 1 | 2 | 1 | ✅ Integrado |
| **Foros/Comunidad** | 2 | 1 | 1 | 1 | ✅ Integrado |
| **Encuestas** | 1 | 1 | 1 | 1 | ✅ Funcional |
| **Portal Padres** | 6 | 1 | 2 | 2 | ⚠️ Duplicado |
| **Portal Docentes** | 4 | 2 | 3 | 2 | ⚠️ Parcial |
| **Gamificación** | 5 | 3 | 4 | 2 | ⚠️ Fragmentado |
| **Biblioteca Digital** | 2 | 1 | 1 | 1 | ⚠️ Verificar |
| **Citas** | 2 | 2 | 2 | 1 | ✅ Funcional |
| **Admin Dashboard** | 10+ | 5 | 8 | 3 | ⚠️ Monolítico |
| **IA/Chatbot** | 5 | 4 | 8 | 2 | ⚠️ Fragmentado |

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Archivos Involucrados

```
FRONTEND:
├── unified-auth-system-v2.js (86KB) 🔴 Monolítico
├── admin-auth.js
├── parent-auth.js
├── google-auth-integration.js (74KB)
├── intelligent-login-system.js
├── advanced-authentication-system.js (x2 duplicado)
├── biometric-auth.js
└── session-manager.js

BACKEND:
├── routes/auth.ts
├── routes/auth-2fa.ts (deprecado?)
├── routes/auth-google.ts (necesario?)
├── routes/auth-webauthn.ts
└── routes/admin.ts (parte de auth)

SERVICES:
├── auth.service.js
├── authService.js (wrapper)
├── AuthService.js (legacy?)
├── GoogleAuthService.js
├── SessionService.js
└── TokenService.js

DAOs:
├── user.dao.js
└── session.dao.js
```

### Dependencias Críticas

```
unified-auth-system-v2.js
    │
    ├─► localStorage keys:
    │       ├── 'bge_auth_token'
    │       ├── 'bge_user_data'
    │       ├── 'bge_session_id'
    │       └── 'bge_remember_me'
    │
    ├─► Eventos emitidos:
    │       ├── 'auth:login'
    │       ├── 'auth:logout'
    │       ├── 'auth:session-expired'
    │       └── 'auth:token-refreshed'
    │
    ├─► Dependencias:
    │       ├── config.js (API_URL)
    │       ├── context-manager.js
    │       └── api-client.js
    │
    └─► Consumidores (ALTO RIESGO):
            ├── dashboard-manager-2025.js
            ├── chatbot.js
            ├── gamification.js
            ├── admin-dashboard.js
            ├── grades-manager.js
            └── ... (15+ archivos)
```

### Recomendación

- **Prioridad:** 🔴 Alta
- **Acción:** Crear AuthModule centralizado, eliminar duplicados
- **Riesgo de cambio:** CRÍTICO - 15+ archivos dependen de esto

---

## 📊 SISTEMA DE CALIFICACIONES

### Archivos Involucrados

```
FRONTEND:
├── grades-manager.js
├── grades-platform.js
├── grades-viewer.js
├── grades-export.js
└── grades-analytics.js

BACKEND:
├── routes/grades.ts (principal)
├── routes/grades-reports.ts
└── routes/grades-analytics.ts

SERVICES:
├── GradesService.js
├── grades.service.js (wrapper)
├── GradesReportService.js
└── GradeCalculatorService.js

DAOs:
├── grades.dao.js
└── students.dao.js (relacionado)
```

### Dependencias

```
grades-manager.js
    │
    ├─► API Endpoints:
    │       ├── GET /api/grades
    │       ├── GET /api/grades/:studentId
    │       ├── POST /api/grades
    │       └── GET /api/grades/report/:studentId
    │
    ├─► Dependencias:
    │       ├── api-client.js
    │       └── auth (token)
    │
    └─► Consumidores:
            ├── parent-portal.js (lectura)
            ├── teacher-portal.js (escritura)
            └── admin-reports.js
```

### Recomendación

- **Prioridad:** 🟡 Media
- **Acción:** Consolidar 5 archivos frontend en 2 (viewer + manager)
- **Riesgo de cambio:** Medio

---

## 💬 SISTEMA DE MENSAJERÍA

### Archivos Involucrados

```
FRONTEND:
├── messaging-manager.js ✅
└── messaging-viewer.js

BACKEND:
└── routes/messaging.ts ✅ (recién actualizado)

SERVICES:
├── MessagingService.js
└── NotificationService.js (relacionado)

DAOs:
└── messaging.dao.js
```

### Estado

- **Recién integrado:** 11-ENE-2026
- **Endpoints agregados:** 4 (conversation details, messages, mark-read, typing)
- **Riesgo:** Bajo

---

## 🎮 SISTEMA DE GAMIFICACIÓN

### Archivos Involucrados

```
FRONTEND:
├── advanced-gamification-system.js (66KB) 🔴
├── gamification-center.js
├── leaderboard.js
├── achievements.js
├── challenges.js
└── iacoins-dashboard.js

BACKEND:
├── routes/gamification.ts
├── routes/gamification-ext.ts
├── routes/iacoins.ts
└── routes/wallet.ts

SERVICES:
├── GamificationService.js
├── IACoinsService.js
├── AchievementService.js
└── LeaderboardService.js

DAOs:
├── gamification.dao.js
└── wallet.dao.js
```

### Dependencias Críticas

```
advanced-gamification-system.js
    │
    ├─► Depende de:
    │       ├── auth (userId, token)
    │       ├── grades-manager.js (métricas)
    │       └── attendance.js (métricas)
    │
    ├─► Eventos:
    │       ├── 'gamification:xp-earned'
    │       ├── 'gamification:achievement-unlocked'
    │       └── 'gamification:level-up'
    │
    └─► Impacta:
            ├── dashboard (widgets)
            ├── profile (badges)
            └── store (IACoins)
```

### Recomendación

- **Prioridad:** 🟡 Media
- **Acción:** Modularizar en sistema independiente
- **Riesgo de cambio:** Alto (afecta XP y rewards)

---

## 👨‍👩‍👧 PORTAL DE PADRES

### Archivos Involucrados

```
FRONTEND:
├── parent-portal.js 🔴 (usa datos mock)
├── parents-portal-manager.js ✅ (integrado con API)
├── parent-auth.js
├── parent-manager.js
├── parent-teacher-chat.js
└── parent-teacher-communication.js

BACKEND:
└── routes/parents.ts ✅ (913 líneas, completo)

SERVICES:
├── ParentsService.js
└── ParentNotificationService.js

DAOs:
├── parents.dao.js
└── parent-credentials.dao.js
```

### Problema Identificado

```
DUPLICACIÓN CRÍTICA:
├── parent-portal.js → Usa datos MOCK
└── parents-portal-manager.js → Usa API real

AMBOS coexisten pero solo uno está conectado correctamente.
```

### Recomendación

- **Prioridad:** 🔴 Alta
- **Acción:** Eliminar parent-portal.js, usar parents-portal-manager.js
- **Riesgo de cambio:** Medio

---

## 🤖 SISTEMA DE IA/CHATBOT

### Archivos Involucrados

```
FRONTEND:
├── chatbot.js (93KB) 🔴
├── bge-chatbot-ia-avanzado.js
├── ai-tutor-personalizado.js (x2)
├── ai-generador-contenido.js (x2)
└── ai-analisis-predictivo.js (x2)

BACKEND:
├── routes/ai-tutor.ts
├── routes/ai-chatbot.ts
├── routes/ai-gateway.ts (nuevo - orquestador)
└── routes/real-ai.ts

SERVICES:
├── AIService.js ✅ (orquestador nuevo)
├── ai-tutor.service.js
├── ChatbotService.js
├── OpenAIService.js
├── LocalIAProcessor.js
├── AITutorService.js (duplicado)
├── ai-service.js (duplicado)
└── openai-service.js (eliminado)

DAOs:
├── ai-conversations.dao.js
└── ai-recommendations.dao.js
```

### Estado

- **Recién refactorizado:** Nuevo AIService como orquestador
- **Duplicados pendientes:** 6+ servicios a consolidar
- **Riesgo:** Alto (afecta chatbot y tutor)

---

## 📱 ADMIN DASHBOARD

### Archivos Involucrados

```
FRONTEND:
├── dashboard-manager-2025.js (148KB) 🔴 CRÍTICO
├── admin-dashboard.js (x2 duplicado)
├── admin-dashboard-advanced.js
├── admin-risk-dashboard.js
├── admin-student-manager.js
├── admin-grades-manager.js
├── admin-user-manager.js
├── admin-reports.js
├── admin-analytics.js
└── admin-notifications.js

BACKEND:
├── routes/admin.ts
├── routes/dashboard.ts
├── routes/super-admin-dashboard.ts
├── routes/reports.ts
└── routes/analytics.ts

SERVICES:
├── AdminService.js
├── DashboardService.js
├── ReportsService.js
├── AnalyticsService.js
└── ... (5+ más)
```

### Problema Principal

```
dashboard-manager-2025.js (148KB)
    └── Contiene:
            ├── Gestión de widgets
            ├── Gráficas
            ├── Estadísticas
            ├── Notificaciones
            ├── Usuarios
            ├── Reportes
            └── ... (demasiadas responsabilidades)
```

### Recomendación

- **Prioridad:** 🔴 Alta
- **Acción:** Dividir en 10+ módulos independientes
- **Riesgo de cambio:** MUY ALTO

---

## 🔄 DEPENDENCIAS GLOBALES CRÍTICAS

### Archivos que TODO depende de ellos

| Archivo | Consumidores | Riesgo de Modificación |
|---------|--------------|----------------------|
| `config.js` | 50+ | 🔴 CRÍTICO |
| `api-client.js` | 40+ | 🔴 CRÍTICO |
| `context-manager.js` | 30+ | 🔴 CRÍTICO |
| `unified-auth-system-v2.js` | 25+ | 🔴 CRÍTICO |
| `main.js` | 20+ | 🟠 ALTO |
| `theme-manager.js` | 15+ | 🟡 MEDIO |

### LocalStorage Keys Globales

| Key | Usado Por | Propósito |
|-----|-----------|-----------|
| `bge_auth_token` | Auth, API calls | JWT Token |
| `bge_user_data` | Dashboard, Profile | User info |
| `bge_dark_mode` | Theme | Preferencia |
| `bge_tenant_config` | Multi-tenant | Config |
| `parent_session` | Parent Portal | Session |

---

## 📋 ORDEN DE REFACTORIZACIÓN SEGURO

```
FASE 1: SIN RIESGO
├── Eliminar _quarantine/ (53 archivos)
├── Eliminar archivos .backup y .tmp
└── Eliminar servicios huérfanos sin uso

FASE 2: RIESGO BAJO
├── Consolidar archivos duplicados (admin-dashboard.js x2)
├── Consolidar parent-portal.js y parents-portal-manager.js
└── Eliminar scripts experimentales (ar-education, etc.)

FASE 3: RIESGO MEDIO
├── Modularizar gamification (5 archivos → 2)
├── Modularizar AI services (8 → 2)
└── Consolidar rutas backend (177 → 25)

FASE 4: RIESGO ALTO
├── Refactorizar dashboard-manager-2025.js (148KB → 10 módulos)
├── Refactorizar unified-auth-system-v2.js
└── Implementar arquitectura ES Modules
```

---

## ⚠️ ARCHIVOS QUE NO SE DEBEN TOCAR SIN TESTS

| Archivo | Razón | Tests Necesarios |
|---------|-------|------------------|
| `unified-auth-system-v2.js` | 25+ dependientes | Login, Logout, Session |
| `config.js` | 50+ dependientes | Configuración básica |
| `api-client.js` | 40+ dependientes | Todas las llamadas API |
| `dashboard-manager-2025.js` | Core de admin | Dashboard completo |
| `grades-manager.js` | Funcionalidad crítica | CRUD calificaciones |

---

**Próximo paso:** Crear tests E2E para flujos críticos antes de cualquier refactorización de riesgo alto.
