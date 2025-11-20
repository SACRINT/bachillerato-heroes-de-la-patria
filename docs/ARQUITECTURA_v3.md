# ARQUITECTURA DEL SISTEMA BGE v3.0

**Fecha:** 20 Noviembre 2025
**Versión:** 3.0.0
**Estado:** En desarrollo hacia v4.0.0 Enterprise

---

## 1. VISIÓN GENERAL

BGE Héroes de la Patria es una plataforma educativa moderna para bachilleratos en México, con sistema de gamificación IACoins que incentiva el aprendizaje mediante recompensas para uso de IA.

### 1.1 Objetivos Arquitectónicos
- **Escalabilidad:** Multi-tenancy para múltiples escuelas
- **Seguridad:** CSP compliant, OWASP Top 10 hardened
- **Rendimiento:** <200ms response time, Lighthouse >80
- **Mantenibilidad:** Código modular, >70% test coverage

---

## 2. ESTRUCTURA DE CARPETAS

\`\`\`
bachillerato-heroes-de-la-patria/
├── api/                          # Vercel Serverless Functions
│   ├── app.js                    # Express app principal (~1400 líneas)
│   └── index.js                  # Entry point Vercel
├── backend/                      # Lógica del servidor
│   ├── data/                     # Data Access Layer
│   ├── middleware/               # Express middlewares
│   ├── routes/                   # API endpoints (~85 archivos)
│   ├── services/                 # Business logic (~25 servicios)
│   ├── migrations/               # SQL migrations
│   └── __tests__/                # Jest tests
├── public/                       # Frontend estático
│   ├── css/                      # Estilos
│   ├── js/                       # Scripts frontend (~300 archivos)
│   └── *.html                    # Páginas (~35 archivos)
├── docs/                         # Documentación
└── no_usados/                    # Código archivado
\`\`\`

---

## 3. ARQUITECTURA DE CAPAS

- **Frontend:** HTML5 + Bootstrap 5 + Vanilla JS
- **API Layer:** Express.js + Vercel Serverless
- **Middleware:** JWT Auth, Rate Limiting, CORS/CSP, Tenant Context
- **Service Layer:** StudentService, GradesService, NotificationService
- **DAL:** database-access.js + executeQuery()
- **Database:** Neon PostgreSQL (Serverless)

---

## 4. DEPENDENCIAS PRINCIPALES

### Backend
- express, pg, bcrypt, jsonwebtoken, express-validator, nodemailer

### Frontend
- bootstrap 5.3.2, chart.js, dompurify, tinymce

### Testing
- jest, supertest

---

## 5. BASE DE DATOS

### Tablas Principales
- usuarios, estudiantes, docentes, materias
- calificaciones, iacoins_*, pending_approvals
- audit_logs, tenants

### Índices
- Migración 004: 30+ índices
- Migración 005: 50+ índices adicionales
- Mejora esperada: 40-70%

---

## 6. SEGURIDAD

- CSP Headers
- JWT Auth con expiración
- Rate Limiting
- Input Validation
- XSS Prevention (DOMPurify)
- SQL Injection Prevention
- CORS configurado

---

## 7. APIs PRINCIPALES

### IACoins
- GET/POST /api/iacoins/balance, transactions, earn, spend
- GET /api/iacoins/challenges, leaderboard

### Calificaciones
- CRUD /api/grades

### Admin
- /api/admin/students, teachers, approvals

---

## 8. DEPLOYMENT

- **Hosting:** Vercel (Serverless)
- **Database:** Neon PostgreSQL
- **CDN:** Vercel Edge

---

## 9. MÉTRICAS

| Métrica | Valor |
|---------|-------|
| Archivos JS backend | ~85 |
| Archivos JS frontend | ~300 |
| Servicios | ~25 |
| Páginas HTML | ~35 |
| Tablas BD | ~50 |
| Índices BD | ~80+ |
| Tests | ~40+ |

---

**Última actualización:** 20 Noviembre 2025
