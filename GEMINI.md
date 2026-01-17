**Last Updated:** 15 de Enero de 2026 (Metaverse UI & Interaction: Semana 7)

### Core Directives

- I am the lead agent for the 'ProyectoHP' project.
- I must orchestrate sub-agents using `doc/task/context.md` when necessary.
- Changes to the API (`api/app.js`) must be done incrementally due to Vercel deployment sensitivity.
- **Metaverse Development (Semanas 1-7):** Se ha implementado el núcleo completo del Metaverso Educativo incluyendo:
  - Motor 3D (React Three Fiber + Rapier Physics)
  - Sistema de Avatar con controles WASD
  - Multiplayer básico con Socket.io
  - **[NUEVO]** UI Sistema completo: HUD, Chat en tiempo real, Prompts de Interacción, Panel de Lecciones
  - **[NUEVO]** Sistema de Interacción: Raycasting + Objetos Interactuables (LessonBoard)
- **🎉 FASE 1 COMPLETADA (Semanas 1-10):** Metaverse Core Alpha lista. Features adicionales:
  - **Semana 8:** UI Diegética (HologramPanel, ChatBubble3D, Minimap Radar, Emojis, Onboarding)
  - **Semana 9:** Quality Settings (Low/Med/High/Ultra), FPS Monitor, Throttler
  - **Semana 10:** Photo Mode, Bug Report System
- `429 Too Many Requests` on Dashboard Load: SOLVED. Architected and IMPLEMENTED a solution to prevent the frontend from bombarding the server. Created a new consolidated API endpoint (`/api/admin/dashboard-summary`) to bundle all necessary statistics into a single, efficient API call. Refactored `js/admin-dashboard-stats.js` to use this new endpoint, reducing initial load requests from 7+ to just 1.
- Architectural Cleanup (Phase 1 & 2):
  - Deleted `_legacy/` folder (removed 6 outdated files).
  - Consolidated `admin-dashboard.js` (removed duplicates and unused `admin-dashboard-advanced.js`).
  - Refactored `context-manager.js` to remove redundant auth logic; deleted `auth-context-bridge.js`.
  - Deleted obsolete `stats-counter.js`.
- `.md` files should not be pushed to the Git repository.

---

### Project Status & Checklist

**🎉 METAVERSE CORE MVP (13 Enero 2026):**
Se ha desplegado la infraestructura base del Metaverso Educativo (Fase 1, Semanas 1-6).

- **Engine:** React Three Fiber + Vite + TypeScript.
- **World:** Terreno procedural con físicas (Rapier) y vegetación instanciada.
- **Networking:** Multiplayer funcional con Socket.io (Sync de posición e interpolación de lag).
- **Avatar:** Controlador cinemático con estados de animación y cámara en 3a persona.

**🎉 AUDITORÍA DICIEMBRE 2025 + ACTUALIZACIÓN ENERO 2026:**
Se confirmó la implementación completa de Credenciales de Padres y se finalizó la Optimización de Rendimiento del Dashboard (Stats).

---

✅ **COMPLETADO - Verificado en Auditoría (5 Dic 2025 + 12 Ene 2026):**

| Categoría | Item | Estado | Notas |
|-----------|------|--------|-------|
| **P1-Crítico** | Sistema de Calificaciones | ✅ | grades.js (769 líneas), grades.dao.js, GradesService.js |
| **P1-Crítico** | Credenciales de Padres | ✅ | Backend y Frontend verificados. Endpoint `/generate` activo. |
| **P1-Crítico** | Optimización Dashboard (Stats) | ✅ | Endpoint `/dashboard-summary` creado y conectado. |
| **P2-Alto** | Rango de Años Dinámico | ✅ | `populateGraduationYears()` (2000-año actual) |
| **P2-Alto** | Upload de Archivos | ✅ | uploads.js (/image, /document, /multiple) |
| **P2-Alto** | Validación Forms CV | ✅ | Sin falsos positivos |
| **P3-Medio** | CSP Compliance | ✅ | **0 handlers inline en HTML** |
| **P3-Medio** | Forms Egresados | ✅ | egresados.dao.js, form-handlers completos |
| **Infra** | Multi-Tenancy | ✅ | tenant-auto-updater.js |
| **Infra** | Logging GDPR | ✅ | devLogger.js implementado |

---

✅ **REFACTORIZACIÓN DAL COMPLETADA (5 Dic 2025):**

- [x] **21 pool.query eliminados de rutas**
- [x] **0 pool.query directos restantes**
- [x] **15 DAOs activos** (HealthDAO nuevo, AnalyticsDAO y ContactDAO extendidos)
- [x] **New Admin Stats Endpoint** integrado con 7 DAOs.

**Rutas refactorizadas:** health.js, ai-chatbot.js, recommendations.js, ml-predictions.js, predictive-analytics.js, contact.js, admin.ts.

---

### 🧪 TESTING FRAMEWORK (Actualizado Dic 2025)

**Tests Pasando (180 tests):**

| Archivo | Tests | Estado |
|---------|-------|--------|
| `dal.test.js` | 31 | ✅ |
| `student.service.test.js` | 20 | ✅ |
| `grades.test.js` | 16 | ✅ |
| `emotional-analytics.service.test.js` | 5 | ✅ (Nuevo) |
| `integrated-services.test.js` | 35 | ✅ |
| `emailService.test.js` | 26 | ✅ (Refactorizado con DI) |
| `security-advanced.dao.test.js` | 20 | ✅ |
| `collaboration.dao.test.js` | 14 | ✅ |
| `collaborative-editing.dao.test.js` | 15 | ✅ |

**Frontend (Semana 14):**

- Monitor de emociones implementado en `estudiantes.html` con Chart.js.
- Modal de intervención implementado en `adaptive-lesson.html`.
- Widget de registro de ánimo en sidebar.

**Patrón de Mock para DAOs:**

```javascript
// Mock ANTES del import
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn(),
    query: jest.fn(),
    getPool: jest.fn()
}));
// Import DESPUÉS
const myDAO = require('../../data/my.dao');
```

**EmailService refactorizado** con inyección de dependencias:

```javascript
// Test usa factory method
emailService = EmailService.createTestInstance({
    nodemailerModule: mockNodemailer,
    fsModule: mockFs,
    handlebarsModule: mockHandlebars
});
```

---

✅ **HISTORIAL DE SESIONES:**

- **15 Ene 2026 (Noche):** ✅ FASE 2 BLOCKCHAIN COMPLETADA (100%).
  - Smart Contracts: ERC-20 (IACoin), SBT (Identity), NFT (AcademyCredential).
  - Backend: Web3 API, Faucet System, SVG Diploma Generator, BlockchainService (ethers.js).
  - Frontend: Wallet Context, Connection UI, Portfolio Assets View.
  - Security: Pausable Pattern implementation & Security Tests suite.
- **13 Ene 2026:** ✅ METAVERSE CORE (S1-S6). Implementación "Speedrun" de Engine 3D, Físicas Rapier y Multiplayer Socket.io en una sesión.
- **12 Ene 2026:** ✅ Optimización Dashboard Completa (Endpoint `/dashboard-summary` + Frontend), Credenciales Padres verificadas, Cleanup final.
- **5 Dic 2025 (Noche):** ✅ REFACTORIZACIÓN DAL COMPLETA - 21 pool.query eliminados, 180 tests pasando.
- **5 Dic 2025 (PM):** Auditoría completa de prioridades. 7/8 ya implementadas.
- **5 Dic 2025 (AM):** Refactorización EmailService (DI), ~128 tests pasando.
- **4 Dic 2025:** CSP migration (estudiantes.html, citas.html), tests DAL.
- **Sesiones anteriores:** Multi-tenancy, logging GDPR, recuperación de scripts.
