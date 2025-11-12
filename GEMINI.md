## Gemini Project Memories - BGE ProyectoHP

**Last Updated:** 11 de Noviembre de 2025

### Core Directives
- I am the lead agent for the 'ProyectoHP' project.
- I must orchestrate sub-agents using `doc/task/context.md` when necessary.
- Changes to the API (`api/app.js`) must be done incrementally due to Vercel deployment sensitivity.
- `.md` files should not be pushed to the Git repository.

---

### Project Status & Checklist

**CONTEXTO CLAVE:** El proyecto se encuentra en un estado de refactorización parcial (v2.X), habiendo revertido a un commit anterior (`45bd7e9c368c`) tras un intento fallido de implementar la "Fase 2". La documentación que describe una arquitectura v3.0 completada (`MANUAL-ARQUITECTO-BGE-V3.md`) es **aspiracional** y no refleja el estado real del código. Una auditoría reciente (`AUDITORIA_REMASTERIZADA_BGE_COMPLETA_11NOV-2025.md`) ha revelado una deuda técnica significativa y riesgos críticos.

---

🔴 **PRIORIDAD CRÍTICA - RIESGOS IDENTIFICADOS POR AUDITORÍA:**

1.  **VIOLACIÓN DE GDPR Y EXPOSICIÓN DE SECRETOS:** Múltiples `console.log` exponen datos sensibles (emails, tokens, IDs) en el código de producción. El archivo `.env` está versionado en Git, exponiendo todas las credenciales de la base de datos y APIs.
2.  **VULNERABILIDAD CSP (Cross-Site Scripting):** Más de 600 manejadores de eventos `inline` (`onclick`, etc.) persisten en los archivos HTML, y se usa `innerHTML` sin sanitización.
3.  **ACOPLAMIENTO FUERTE (TIGHT COUPLING):** 23 rutas del backend acceden directamente a la base de datos (`pool.query()`) en lugar de usar una capa de abstracción de datos (DAL).
4.  **CÓDIGO MUERTO Y DUPLICADO:** Múltiples archivos JavaScript no utilizados permanecen en `public/js`, y existe una duplicación completa con el directorio `/js`. 28 rutas backend están "huérfanas" (código existe pero no están registradas en el servidor).
5.  **FALTA DE MULTI-TENANCY:** El nombre de la institución y otros datos están hardcodeados más de 2,300 veces, impidiendo la escalabilidad.

---

⏳ **PLAN DE REMEDIACIÓN (Basado en Auditoría)**

**FASE 1: Contención de Riesgos Críticos (COMPLETADA)**
-   [x] **1. Implementar Logging Condicional (GDPR):** Creado `backend/utils/devLogger.js` y reemplazados los logs más críticos.
-   [x] **2. Inventariar y Recuperar Scripts Activos:** Se recuperaron 22/23 scripts faltantes, reduciendo los errores 404 en un 85%.
-   [x] **3. Eliminar Bundles Webpack Sin Usar:** Eliminadas referencias a bundles legacy.
-   [x] **4. Girar Secretos y Limpiar Git:** Se han neutralizado los secretos en `.env` y creado `.env.local`.
-   [x] **5. Remediación XSS (Inicial):** Se instaló DOMPurify y se agregaron los `import` a 9 archivos críticos.

**FASE 2: Habilitar Escalabilidad y Limpieza (EN PROGRESO)**
-   [x] **4. Centralizar Configuración de Institución (Multi-Tenancy) - Hito 1:** Creado `public/js/tenant-config-loader.js` e integrado en los 35 archivos HTML. El backend está listo.
-   [ ] **4. Centralizar Configuración de Institución (Multi-Tenancy) - Hito 2:** Reemplazar las 2,359 referencias hardcodeadas con `window.TENANT_CONFIG`. **(PRÓXIMO PASO)**
-   [ ] **5. Archivar Código Muerto:** Mover los archivos JS no utilizados de `public/js` a una carpeta de cuarentena.
-   [ ] **6. Resolver Duplicación:** Eliminar el directorio `/js` duplicado.
-   [ ] **7. Registrar Rutas Huérfanas:** Añadir las 28 rutas backend faltantes a `server.js`.

**FASE 3: Refactorización Profunda de Arquitectura (PENDIENTE)**
-   [ ] **8. Refactorizar DAL:** Dividir el monolítico `database-access.js` en módulos DAL por entidad.
-   [ ] **9. Refactorizar Rutas:** Migrar las 23 rutas que usan `pool.query()` para que utilicen los nuevos módulos DAL.
-   [ ] **10. Cumplimiento de CSP:** Crear `csp-compliant-events.js` y refactorizar los manejadores `inline` para usar `addEventListener`. Reemplazar todos los `innerHTML` inseguros.

---

✅ **COMPLETADO (Sesiones Anteriores):**
-   **Auditoría Arquitectónica (Fase 0):** Se completó un análisis exhaustivo que identificó la deuda técnica y los riesgos.
-   **Recuperación de Scripts:** Se recuperaron 22 de 23 scripts faltantes, restaurando la funcionalidad del Admin Dashboard y el Portal de Estudiantes.
-   **Infraestructura Multi-Tenancy:** Se creó e integró el cargador de configuración (`tenant-config-loader.js`) en todas las páginas.
-   **Múltiples Correcciones de Bugs:** Se han solucionado numerosos errores relacionados con la autenticación, la base de datos, la configuración de Vercel y el dashboard de administración.