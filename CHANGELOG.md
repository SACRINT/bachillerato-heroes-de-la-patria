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