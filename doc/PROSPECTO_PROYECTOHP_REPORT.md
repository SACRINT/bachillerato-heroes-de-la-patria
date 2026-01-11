# Auditoría Técnica y Plan de Escalado - ProyectoHP

**Fecha de Auditoría:** 10 de Enero de 2026
**Estado Actual:** Funcional pero con Deuda Técnica Moderada/Alta en Backend

## 1. Resumen Ejecutivo

El proyecto ha avanzado significativamente con la implementación del **Orquestador de IA** y la consolidación de rutas críticas. Sin embargo, para escalar verticalmente de manera segura, es imperativo desacoplar la lógica de acceso a datos (SQL) de los controladores (Rutas HTTP). La auditoría ha revelado inconsistencias en convenciones de nombres, código duplicado en servicios y manejo manual de conexiones a base de datos que ponen en riesgo la estabilidad bajo carga.

## 2. Hallazgos Críticos

### A. Capa de Rutas (`backend/routes`) - **Alta Deuda Técnica**

* **Acoplamiento SQL:** Múltiples controladores (`messaging.js`, `polls.js`, `store.js`) contienen consultas SQL complejas (`JOINs`, `TRANSACTION Management`) directamente en el handler de la petición.
  * *Riesgo:* Dificulta testing, reutilización y mantenimiento. Fugas de conexiones si `client.release()` falla.
* **Archivos Duplicados/Muertos:** Presencia de carpetas `js_backup`, `archived` y archivos redundantes como `chatbot.js`, `chatbot-ia.js` (ya mitigado en server, pero los archivos persisten).
* **Mezcla de Lenguajes:** Archivos `.ts` compilados a `.js` conviven, generando confusión sobre cuál es la "fuente de la verdad".

### B. Capa de Servicios (`backend/services`) - **Inconsistencia**

* **Explosión de Archivos:** 800+ archivos listados. Muchos parecen ser artefactos de compilación (`.d.ts`, `.map`) o versiones duplicadas con diferente casing.
* **Duplicidad de Servicios:** Existencia simultánea de `AITutorService.js` (PascalCase) y `ai-tutor.service.js` (kebab-case).

### C. Capa de Datos (`backend/data`) - **Subutilizada**

* Aunque existen DAOs (`audit-log.dao.js`, `messaging.dao.js` potencialmente inexistente o no usado), muchos controladores los ignoran y reescriben las consultas.

## 3. Plan de Acción Recomendado (Siguientes Pasos)

### Fase 1: Limpieza y Estandarización (Inmediato)

1. **Eliminación de Código Muerto:** Borrar carpetas `backend/routes/js_backup`, `backend/routes/archived` y archivos de rutas desactivadas (`chatbot.js`, `chatbot-ia.js`).
2. **Unificación de Servicios:** Decidir una convención de nombres (recomendado: `nombre-servicio.service.js`) y fusionar/eliminar duplicados (ej. unificar `AITutorService` en `ai-tutor.service.js`).

### Fase 2: Refactorización DAO (Escalabilidad Vertical)

1. **Migrar SQL de Controladores a DAOs:**
    * Identificar controladores críticos con más SQL (ej. `messaging.js`).
    * Extraer consultas a `backend/data/messaging.dao.js`.
    * Implementar patrón `TransactionManager` para manejar `BEGIN/COMMIT/ROLLBACK` de forma segura y centralizada.
2. **Server Cleanup:** Continuar comentando/eliminando rutas legacy en `server.js` una vez migradas.

### Fase 3: Optimización Frontend

1. **Auditoría de Scripts Inline:** Revisar HTMLs en `public/` para mover scripts inline a archivos `.js` externos y minificables.
2. **Gestión de Dependencias:** Verificar que no se carguen versiones duplicadas de librerías (ej. jQuery, Bootstrap) en el mismo HTML.

## 4. Prioridades de Ejecución

1. **Refactorizar `messaging.js`:** Es un candidato ideal para establecer el patrón correcto (Controller -> Service -> DAO) debido a su complejidad actual.
2. **Limpieza de `backend/services`:** Reducir el ruido visual eliminando duplicados obvios.

---
**Nota:** El nuevo Orquestador de IA ya sigue buenas prácticas (`AIService` -> `PredictiveAnalyticsService` -> DAOs). El objetivo es replicar este éxito en el resto del backend.Realiza
