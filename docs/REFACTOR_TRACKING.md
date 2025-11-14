# 📊 Tracking de Refactorización onclick → data-action (Pattern B)

**Iniciado:** 14 Noviembre 2025
**Usuario:** Claude Code (Anthropic)
**Estado:** EN PROGRESO
**Branch:** refactor/csp-onclick-pattern-b-top10

---

## 🎯 Top 10 Archivos (Pattern B: onclick con parámetros)

| # | Archivo | Instancias | Complejidad | Estado | Validado | Fecha Inicio | Fecha Fin |
|----|---------|-----------|-------------|--------|----------|-------------|-----------|
| 1 | dashboard-manager-2025.js | 7 (REAL) | 🟢 BAJA | ✅ Completado | ✅ | 14 Nov 2025 | 14 Nov 2025 |
| 2 | admin-dashboard.js | 20-25 | 🟡 MEDIA | ⏳ Pendiente | ❌ | - | - |
| 3 | professional-forms.js | 15-20 | 🟢 BAJA | ⏳ Pendiente | ❌ | - | - |
| 4 | academic-reports-manager.js | 12-15 | 🟡 MEDIA | ⏳ Pendiente | ❌ | - | - |
| 5 | bge-notification-admin.js | 12-15 | 🟡 MEDIA | ⏳ Pendiente | ❌ | - | - |
| 6 | admin-dashboard-executive.js | 10-15 | 🟡 MEDIA | ⏳ Pendiente | ❌ | - | - |
| 7 | citas-manager.js | 8-10 | 🟢 BAJA | ⏳ Pendiente | ❌ | - | - |
| 8 | accessibility-auditor-system.js | 8-10 | 🔴 ALTA | ⏳ Pendiente | ❌ | - | - |
| 9 | appointments.js | 8-10 | 🟢 BAJA | ⏳ Pendiente | ❌ | - | - |
| 10 | admin-dashboard-events.js | 3-5 | 🟢 BAJA | ⏳ Pendiente | ❌ | - | - |

---

## 📈 Estadísticas Globales

- **Total Archivos:** 10
- **Total Instancias (estimado):** 158-183 (ajustado)
- **Completadas:** 7
- **En Progreso:** 0
- **Validadas:** 7
- **Porcentaje Completado:** ~4% (7/165 estimado)

---

## 📝 Notas de Progreso

### Sesión 1 - 14 Nov 2025
- ✅ FASE 0: Preparación completada
- ✅ Rama creada: refactor/csp-onclick-pattern-b-top10
- ✅ Backup de 9/10 archivos realizado
- ⚠️  admin-students.js no existe → Reemplazado con admin-dashboard-events.js (3-5 instancias)
- 📂 Backup location: backup/onclick-refactor-2025-11-14/
- 🎯 Próximo: Comenzar con dashboard-manager-2025.js (Archivo #1)

---

## 🔄 Cambios por Archivo

### [COMPLETADO] Archivo #1: dashboard-manager-2025.js ✅
- **Inicio:** 14 Nov 2025
- **Fin:** 14 Nov 2025
- **Instancias REALES:** 7 (NO 25-30 como estimado)
- **Complejidad:** 🟢 BAJA (ajustada de ALTA)
- **Estado:** ✅ COMPLETADO
- **Commit:** d698622
- **Duración:** ~1 hora (mucho menos que las 3-4h estimadas)
- **Cambios:**
  - Event listener agregado (73 líneas, 3479-3549)
  - 7 onclick refactorizados a data-action
  - Sintaxis validada con node -c
  - Push exitoso a GitHub
- **Handlers Refactorizados:**
  1. onclick="location.reload()" → data-action="reload-page"
  2. onclick="adminDashboard.viewRequestDetails('${id}')" → data-action="viewRequestDetails-${id}"
  3. onclick="adminDashboard.approveRequest('${id}')" → data-action="approveRequest-${id}"
  4. onclick="adminDashboard.rejectRequest('${id}')" → data-action="rejectRequest-${id}"
  5. onclick="adminDashboard.revokeUserAccess('${user.email}')" → data-action="revokeUserAccess-${user.email}"
  6. onclick="adminDashboard.restoreUserAccess('${user.email}')" → data-action="restoreUserAccess-${user.email}"
  7. onclick="adminDashboard.viewUserDetails('${user.email}')" → data-action="viewUserDetails-${user.email}"

### [PRÓXIMO] Archivo #2: admin-dashboard.js
- **Estimado:** 20-25 instancias
- **Complejidad:** 🟡 MEDIA
- **Estado:** ⏳ Pendiente
- **Notas:** Segundo archivo más grande, estimar 2-3 horas

---

## ✅ Checklist de Validación (Por Archivo)

- [ ] Análisis completo de onclick patterns
- [ ] Event listener centralizado creado
- [ ] Todos los onclick refactorizados
- [ ] Sintaxis validada con `node -c`
- [ ] Sincronizado a /js/ (Protocolo BGE)
- [ ] Testing manual en navegador
- [ ] Commit realizado
- [ ] Tracking actualizado

---

**Última Actualización:** 14 Nov 2025 - FASE 0 Completada
