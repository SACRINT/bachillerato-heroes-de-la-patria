# SOC2 (CC7.1): Alertas de Seguridad para Eventos Críticos

**Fecha:** 23 de Noviembre de 2025
**Feature:** `security-alerting-system`
**Tarea:** Semana 28 - SOC2 Security Audit

---

## 1. Resumen de la Funcionalidad

Para fortalecer el criterio **CC7.1 (Monitoreo de Controles)** de SOC2, se ha implementado un sistema de alertas de seguridad en tiempo real. Este sistema notifica proactivamente a los administradores cuando ocurren eventos de alta sensibilidad que podrían impactar la seguridad del sistema.

La primera alerta implementada se dispara cuando un usuario es promovido al rol de **`admin`**.

---

## 2. Flujo de la Alerta

El sistema de alertas se ha integrado directamente en el `AuditLoggingService` para asegurar que cada evento crítico auditado pueda, si es necesario, generar una notificación.

1.  **Evento Crítico:** Un administrador utiliza el endpoint `PUT /api/admin/users/:id/role` para cambiar el rol de un usuario.
2.  **Registro de Auditoría:** La función `AuditLoggingService.logRoleChanged()` es invocada para guardar un registro permanente de este cambio en la tabla `audit_logs`.
3.  **Condición de Alerta:** Dentro de `logRoleChanged`, el sistema verifica si `newRole === 'admin'`.
4.  **Recopilación de Datos:** Si la condición es verdadera, el servicio consulta la base de datos para obtener los detalles del administrador que realizó el cambio y del usuario que fue modificado.
5.  **Envío de Email:** Se utiliza el `emailService` para enviar un correo electrónico de alerta a la dirección especificada en la variable de entorno `ADMIN_EMAIL`.
6.  **Plantilla Dedicada:** El correo utiliza una nueva plantilla HTML (`security-alert-role-change.hbs`) diseñada para comunicar la información de forma clara y urgente.

---

## 3. Implementación Técnica

### a. `audit-logging-service.js` (Modificado)
- Se inyectó el `emailService`.
- La función `logRoleChanged` ahora contiene la lógica condicional para disparar el correo electrónico.
- Se agregó un manejo de errores robusto para el envío de correos, asegurando que un fallo en el email no impida que el evento de auditoría se registre correctamente.
- Se verifica la existencia de la variable de entorno `ADMIN_EMAIL` antes de intentar el envío.

### b. `security-alert-role-change.hbs` (Nueva Plantilla)
- **Ubicación:** `backend/templates/emails/security-alert-role-change.hbs`
- **Contenido:** Una plantilla HTML profesional que detalla:
    - La acción realizada (Cambio de Rol a Administrador).
    - Quién realizó el cambio (ID y email del admin).
    - Sobre quién se realizó el cambio (ID y email del usuario).
    - El rol anterior y el nuevo rol.
    - La fecha y hora del evento.
    - La dirección IP de origen (funcionalidad a mejorar en el futuro).

### c. Requisito de Configuración
- Se ha introducido una nueva variable de entorno: `ADMIN_EMAIL`.
- **Acción Requerida:** El administrador del sistema debe configurar esta variable en el archivo `.env.local` y en el entorno de producción (Vercel) para designar quién recibirá estas alertas críticas.
- **Ejemplo:** `ADMIN_EMAIL=tu_correo_de_admin@dominio.com`

---

## 4. Relevancia para SOC2

-   **CC7.1 (Monitoreo):** El sistema ahora no solo registra, sino que **monitorea activamente** los cambios y **genera alertas** sobre actividades que podrían afectar el cumplimiento de los controles de seguridad.
-   **CC7.2 (Alertas de Seguridad):** Esta implementación es la base del sistema de alertas. Genera notificaciones para el personal responsable cuando se detectan modificaciones anómalas o críticas en los controles de acceso.
-   **Respuesta a Incidentes:** Las alertas en tiempo real reducen drásticamente el tiempo de detección de una posible actividad maliciosa, permitiendo una respuesta a incidentes mucho más rápida.

Con esta funcionalidad, el proyecto da un paso importante hacia un sistema de monitoreo proactivo y cumple con uno de los pilares de la certificación SOC2.
