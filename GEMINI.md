## Gemini Project Memories - BGE ProyectoHP

**Last Updated:** 5 de Diciembre de 2025 (Auditoría Completa)

### Core Directives

- I am the lead agent for the 'ProyectoHP' project.
- I must orchestrate sub-agents using `doc/task/context.md` when necessary.
- Changes to the API (`api/app.js`) must be done incrementally due to Vercel deployment sensitivity.
- `.md` files should not be pushed to the Git repository.

---

### Project Status & Checklist

**🎉 AUDITORÍA DICIEMBRE 2025:** Se realizó una auditoría completa del código. La mayoría de las prioridades listadas como "pendientes" ya estaban implementadas.

---

✅ **COMPLETADO - Verificado en Auditoría (5 Dic 2025):**

| Categoría | Item | Estado | Notas |
|-----------|------|--------|-------|
| **P1-Crítico** | Sistema de Calificaciones | ✅ | grades.js (769 líneas), grades.dao.js, GradesService.js |
| **P1-Crítico** | Credenciales de Padres | ✅ | parents.js (1011 líneas), auth completo |
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

**Rutas refactorizadas:** health.js, ai-chatbot.js, recommendations.js, ml-predictions.js, predictive-analytics.js, contact.js, y todas las demás.

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

- **5 Dic 2025 (Noche):** ✅ REFACTORIZACIÓN DAL COMPLETA - 21 pool.query eliminados, 180 tests pasando.
- **5 Dic 2025 (PM):** Auditoría completa de prioridades. 7/8 ya implementadas.
- **5 Dic 2025 (AM):** Refactorización EmailService (DI), ~128 tests pasando.
- **4 Dic 2025:** CSP migration (estudiantes.html, citas.html), tests DAL.
- **Sesiones anteriores:** Multi-tenancy, logging GDPR, recuperación de scripts.
