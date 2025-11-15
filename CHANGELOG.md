## [2.27.0] - 2025-11-14 (XSS REMEDIATION: DOMPURIFY SANITIZATION PHASE 2.4)

### 🛡️ PLAN DETALLADO: Sanitización XSS con DOMPurify (62 archivos, 613 riesgos)
- ✅ **Plan Completo Creado:** `docs/FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md` (500+ líneas)
- ✅ **Quick Start Guide:** `docs/INICIO_RAPIDO_SANITIZACION_62_ARCHIVOS.md` (5 minutos)
- ✅ **Copy-Paste Patterns:** `docs/PATRONES_DOMPURIFY_COPY_PASTE.md` (10 patrones listos)
- ✅ **Auditoría XSS:** Identificados 62 archivos prioridad MEDIA (6-14 riesgos cada uno)
- 🔍 **Riesgos Identificados:** 613 puntos XSS (innerHTML: 533, insertAdjacent: 80)
- 📅 **Timeline:** 4-5 semanas (25-32 horas, 4 fases de prioridad)
- **Status:** PLAN LISTO PARA EJECUCIÓN (usuario puede comenzar SEMANA 1 inmediatamente)

**Fase 1 (Semana 1, 6-8h):** 5 CRÍTICOS con 134 riesgos
  - dashboard-manager-2025.js (34)
  - professional-forms.js (34)
  - admin.bundle.js (34)
  - forms.bundle.js (17)
  - features.bundle.js (16)

---

## [2.26.0] - 2025-11-14 (CSP COMPLIANCE: PATTERN B REFACTORING)

### 🎉 HITO MAYOR: Refactorización Completa onclick → data-action (Pattern B)
- ✅ 10/10 archivos procesados (100% completado en 1 sola sesión de 7 horas)
- ✅ 41 onclick handlers refactorizados a data-action attributes
- ✅ 100% CSP Compliant - Eliminados todos los inline event handlers con parámetros

---

## [2.25.4] - 2025-11-14 (FIX: ARQUITECTURA Y TINYMCE)

### FIXES CRÍTICOS: Arquitectura Corregida y Solución Definitiva de TinyMCE
- ✅ **Scripts `defer`:** Solucionado error `Cannot read properties of null (reading 'addEventListener')` agregando `defer` a scripts en `admin-dashboard.html`.
- ✅ **CSP Unificada:** Eliminadas definiciones de CSP conflictivas en `api/app.js` y `backend/server.js`, dejando `vercel.json` como única fuente de verdad.
- ✅ **Rutas Sincronizadas:** Corregidas rutas de Calendar y Google OAuth que daban 404 en producción.
- ✅ **Solución TinyMCE:** Implementada URL absoluta del CDN en `tinymce-config.js` para asegurar la carga correcta de plugins y temas.

---