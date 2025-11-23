# SOC2 (CC7.1/CC9.1): Pista de Auditoría para Cambio de Roles

**Fecha:** 23 de Noviembre de 2025
**Feature:** `audit-trail-for-role-changes`
**Tarea:** Semana 28 - SOC2 Security Audit

---

## 1. Resumen de la Funcionalidad

Para cumplir con los criterios de control de SOC2, específicamente **CC7.1 (Monitoreo)** y **CC9.1 (Gestión de Cambios)**, se ha implementado una nueva funcionalidad que crea una pista de auditoría inmutable para uno de los eventos de seguridad más críticos: **la modificación de roles de usuario**.

A partir de ahora, cada vez que un administrador cambie el rol de un usuario (por ejemplo, de `estudiante` a `admin`), la acción quedará registrada permanentemente en la base de datos.

---

## 2. Implementación Técnica

La implementación se realizó en dos capas del backend: la capa de **Servicio** y la capa de **Rutas (API)**.

### a. Modificación en `authService.js` (Capa de Servicio)

Se añadió un nuevo método a la clase `AuthService` para manejar la lógica de negocio de la actualización del rol.

-   **Nuevo Método:** `async updateUserRole(userId, newRole)`
-   **Responsabilidades:**
    1.  Validar que el `newRole` sea uno de los roles permitidos en el sistema (`admin`, `docente`, `estudiante`, `padre_familia`).
    2.  Ejecutar la consulta `UPDATE usuarios SET role = $1 WHERE id = $2` de forma segura.
    3.  Devolver el registro del usuario actualizado.
    4.  Manejar errores si el usuario no se encuentra o si el rol es inválido.

### b. Nuevo Endpoint en `admin.js` (Capa de API)

Se creó un nuevo endpoint para exponer esta funcionalidad de forma segura a través de la API.

-   **Nuevo Endpoint:** `PUT /api/admin/users/:id/role`
-   **Seguridad:**
    -   Requiere un token de autenticación válido (`authenticateToken`).
    -   Requiere que el usuario que realiza la acción tenga el rol de `admin` (`requireAdmin`).
-   **Flujo de Ejecución:**
    1.  Valida que el rol enviado en el cuerpo de la solicitud (`req.body.role`) sea válido.
    2.  Obtiene el `userId` del administrador que realiza la acción desde el token JWT (`req.user.userId`).
    3.  **Obtiene el estado actual del usuario** de la base de datos para saber cuál era su `oldRole`.
    4.  Llama a `authService.updateUserRole()` para ejecutar el cambio en la base de datos.
    5.  **Llama a `AuditLoggingService.logRoleChanged()`**, pasándole todos los detalles relevantes:
        -   ID del usuario modificado.
        -   Rol antiguo.
        -   Rol nuevo.
        -   ID del administrador que realizó el cambio.
        -   ID del tenant (si aplica).
    6.  Devuelve una respuesta exitosa con los datos del usuario actualizado.

---

## 3. Relevancia para SOC2

Esta implementación aborda directamente varios puntos de control de SOC2:

-   **CC7.1 (Monitoreo de Controles):** El sistema ahora monitorea activamente los cambios en los controles de acceso lógicos (roles de usuario). El `AuditLoggingService` actúa como el mecanismo de monitoreo.
-   **CC9.1 (Autorización de Cambios):** Al restringir el endpoint a `requireAdmin`, se asegura que solo usuarios autorizados puedan realizar cambios en la infraestructura lógica del sistema.
-   **Trazabilidad:** Cada cambio de rol queda ligado a un administrador específico, una marca de tiempo, y contiene el "antes" y el "después" del cambio, proveyendo una pista de auditoría completa y auditable.

Esta es una pieza fundamental para demostrar que la organización tiene controles robustos sobre quién puede acceder a qué información y cómo se gestionan esos permisos a lo largo del tiempo.
