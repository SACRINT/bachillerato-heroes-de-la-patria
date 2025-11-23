# GDPR: Política de Retención de Datos - Limpieza de Logs

**Fecha:** 23 de Noviembre de 2025
**Feature:** `data-retention-policy`
**Tarea:** Semana 27 - GDPR Compliance

---

## 1. Resumen de la Funcionalidad

Se ha implementado un sistema automatizado para cumplir con los principios de **minimización de datos** y **limitación del plazo de conservación** del GDPR (Artículos 5.1(c) y 5.1(e)).

Este sistema ejecuta una tarea programada diariamente que elimina de forma permanente los registros de la tabla `logs_sistema` que han superado un período de retención definido.

- **Política Actual:** Conservar los logs del sistema por **90 días**.
- **Frecuencia de Ejecución:** Diaria, a las 3:00 AM (hora del servidor).
- **Impacto:** Reduce la exposición de datos históricos y mantiene la base de datos optimizada.

---

## 2. Implementación Técnica

La implementación se compone de tres partes principales:

### a. `dataRetentionService.js` (Nuevo Servicio)

- **Ubicación:** `backend/services/dataRetentionService.js`
- **Propósito:** Contiene la lógica de negocio para las políticas de retención.
- **Función Clave:** `cleanupSystemLogs()`
  - Ejecuta la consulta `DELETE FROM logs_sistema WHERE created_at < NOW() - INTERVAL '90 days'`.
  - Registra en el log la cantidad de registros eliminados para auditoría.
  - Diseñado para ser extensible con más políticas a futuro (ej. `anonymizeInactiveUsers`).

### b. `schedulerService.js` (Servicio Existente)

- **Ubicación:** `backend/services/schedulerService.js`
- **Propósito:** Orquesta la ejecución de tareas programadas (cron jobs).
- **Funcionamiento:** Es un planificador simple basado en memoria que verifica cada minuto si debe ejecutar una tarea.

### c. `server.js` (Integración)

- **Ubicación:** `backend/server.js`
- **Cambios:**
  1.  Se **importan** los servicios `schedulerService` y `dataRetentionService`.
  2.  Se **programa** la tarea `cleanup-system-logs` para que se ejecute con la expresión cron `0 3 * * *` (todos los días a las 3:00 AM).
  3.  Se **inicia** el `schedulerService` para que comience a monitorear y ejecutar las tareas programadas.

---

## 3. Verificación y Monitoreo

- **Logs de Inicio:** Al arrancar el servidor, se podrá ver un mensaje en la consola confirmando que la tarea ha sido programada:
  ```
  [Scheduler] Configurando tarea de limpieza de logs (GDPR)...
  [Scheduler] Job "cleanup-system-logs" programado: 0 3 * * *
  [Scheduler] Servicio iniciado
  ```
- **Logs de Ejecución:** Cada día a las 3:00 AM, la consola del servidor registrará el resultado de la operación:
  ```
  [Scheduler] Iniciando tarea programada: Limpieza de Logs del Sistema.
  [DataRetention] Limpieza completada. Se eliminaron X registros de log antiguos.
  ```
  o
  ```
  [DataRetention] No se encontraron registros de log para eliminar.
  ```

---

## 4. Relevancia para GDPR

- **Minimización de Datos (Art. 5.1(c)):** Asegura que solo se procesen y almacenen los datos necesarios. Al eliminar logs antiguos, nos deshacemos de información que ya no es relevante para la operación diaria.
- **Limitación del Plazo de Conservación (Art. 5.1(e)):** Impide que los datos personales se conserven indefinidamente. La política de 90 días establece un límite claro y automatizado.
- **Seguridad del Tratamiento (Art. 32):** Al reducir la cantidad de datos almacenados, se reduce la superficie de ataque y el impacto potencial de una brecha de seguridad.

Esta implementación es un paso fundamental para robustecer el cumplimiento del proyecto con las normativas de protección de datos.
