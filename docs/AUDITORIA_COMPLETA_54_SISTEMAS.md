# Auditoría Completa de Arquitectura: 54 Sistemas BGE

**Fecha:** 03 Diciembre 2025
**Objetivo:** Verificar cumplimiento de patrones de **Independencia y Exportabilidad** (Service Layer, DAO, Event Bus).

---

## 🚨 Resumen Ejecutivo: Estado Crítico

Tras una auditoría exhaustiva del código fuente, se ha determinado que la afirmación de que "21 sistemas ya fueron refactorizados" se refiere a una organización básica de archivos, **NO** a una arquitectura desacoplada y exportable.

**Resultado de la Auditoría:**
*   **Total de Sistemas:** 54
*   **Cumplen Estándar de Exportabilidad:** 1 (`StudentService`)
*   **Requieren Refactorización (o Re-refactorización):** 53

**El Problema:**
La mayoría de los servicios "refactored" (ej. `AuthService`, `CalendarService`, `AITutorService`) contienen consultas SQL directas (`executeQuery`) y lógica mezclada, lo que impide llevarlos a otros proyectos sin arrastrar toda la base de datos específica de BGE.

---

## 🏆 El Estándar de Oro: `StudentService` (Modelo a Seguir)

El único sistema que actualmente cumple con los requisitos para ser exportable es el **Sistema de Estudiantes** (refactorizado en Semana 33).

**¿Por qué es exportable?**
1.  ✅ **Service Layer Puro:** `StudentService.js` solo contiene lógica de negocio. No sabe qué base de datos se usa.
2.  ✅ **DAO Pattern:** `StudentDAO.js` maneja el SQL. Si te llevas el sistema a un proyecto con MongoDB, solo reescribes el DAO.
3.  ✅ **Event Bus:** Emite eventos (`student:created`) para que otros sistemas reaccionen sin estar atados a él.

---

## 📋 Auditoría Detallada por Categoría

### A. Autenticación y Seguridad (6 Sistemas) - ❌ TODOS FALLAN
*Aunque funcionan, están fuertemente acoplados a la tabla `usuarios` de PostgreSQL.*

| Sistema | Estado Arquitectura | Problema Principal | Acción Requerida |
|---------|---------------------|--------------------|------------------|
| **AuthService** | ❌ Monolítico | SQL directo en servicio. Fallback JSON mezclado. | Extraer `UserDAO`. Implementar `EventBus`. |
| **Authorization** | ❌ Acoplado | Middleware accede a DB directamente. | Crear `PermissionService` y `RoleDAO`. |
| **Security** | ⚠️ Parcial | Configuración CSP bien, pero lógica dispersa. | Centralizar en `SecurityService`. |
| **GDPR** | ❌ Acoplado | SQL directo para borrar datos. | Usar DAOs de cada entidad para borrado. |
| **Encryption** | ✅ Aceptable | Es una utilidad, no requiere DAO. | Mantener como utilidad independiente. |
| **2FA** | ❌ Incompleto | Lógica mezclada en rutas. | Mover a `TwoFactorService`. |

### B. Gestión Académica (10 Sistemas) - ⚠️ 1 PASA / 9 FALLAN

| Sistema | Estado Arquitectura | Problema Principal | Acción Requerida |
|---------|---------------------|--------------------|------------------|
| **StudentService** | ✅ **CORRECTO** | **Cumple con los 3 patrones.** | **Ninguna. Listo para exportar.** |
| **GradesService** | ❌ Monolítico | SQL directo. Dependencia dura de Students. | Crear `GradeDAO`. Usar eventos. |
| **Attendance** | ❌ Legacy | Sin Service Layer. SQL en rutas. | Crear `AttendanceService` y DAO. |
| **Calendar** | ❌ Monolítico | Crea tablas en el servicio. SQL directo. | Crear `EventDAO`. Eliminar DDL del servicio. |
| **Reports** | ❌ Acoplado | Queries complejas hardcodeadas. | Abstraer queries a `ReportDAO`. |
| **Parent/Teacher** | ❌ Legacy | SQL en rutas. | Crear servicios y DAOs. |
| **Appointments** | ❌ Monolítico | SQL directo. | Crear `AppointmentDAO`. |
| **Tasks** | ❌ Inexistente | No implementado. | Implementar desde cero con patrones. |
| **Courses** | ❌ Legacy | SQL en rutas. | Crear `CourseService` y DAO. |
| **Exams** | ❌ Inexistente | No implementado. | Implementar desde cero con patrones. |

### C. Inteligencia Artificial (6 Sistemas) - ❌ TODOS FALLAN
*Los servicios de IA actuales son wrappers de OpenAI con SQL directo para guardar historial.*

| Sistema | Estado Arquitectura | Problema Principal | Acción Requerida |
|---------|---------------------|--------------------|------------------|
| **Chatbot** | ❌ Acoplado | SQL directo para historial. | Crear `ConversationDAO`. |
| **AI Tutor** | ❌ Monolítico | SQL directo masivo. Lógica compleja mezclada. | Crear `TutorSessionDAO` y `ProfileDAO`. |
| **Content Gen** | ⚠️ Script | Es un script, no un servicio. | Convertir a `ContentService`. |
| **Predictive** | ❌ Legacy | SQL en rutas. | Crear `PredictionService`. |
| **Risk Detection** | ❌ Legacy | SQL en rutas. | Crear `RiskDAO`. |
| **Virtual Asst** | ❌ Legacy | SQL en rutas. | Crear servicio. |

*(Las categorías D, E, F, G, H, I, J siguen el mismo patrón: SQL directo o lógica en rutas)*

---

## 🛠️ Plan Maestro de Refactorización (Re-Refactorización)

Para lograr la meta de **"Sistemas Exportables"**, debemos procesar los 53 sistemas restantes.

### Fase 1: El Núcleo (Core Systems) - Prioridad Crítica
*Sin esto, nada es exportable.*
1.  **AuthService:** Separar `UserDAO`. Eliminar lógica de JSON fallback del servicio (mover a DAO).
2.  **GradesService:** Implementar `GradeDAO`. Desacoplar de `StudentService` usando IDs genéricos.
3.  **TeacherService:** Crear desde cero (actualmente no existe como tal).

### Fase 2: Soporte Académico
1.  **CalendarService:** Limpiar el servicio. Mover creación de tablas a scripts de migración. Crear `EventDAO`.
2.  **AttendanceService:** Crear servicio y DAO.
3.  **NotificationService:** Crear sistema de canales abstractos (Email, Push).

### Fase 3: Capa de Inteligencia
1.  **AITutorService:** Refactorizar masivamente. Separar lógica de gamificación, sesión y perfiles en DAOs distintos.
2.  **ChatbotService:** Abstraer almacenamiento de historial.

---

## 📝 Ejemplo de Transformación Requerida

**ACTUAL (No Exportable - `CalendarService.js`):**
```javascript
async getEvents(filters) {
    // SQL directo atado a PostgreSQL/MySQL
    const [rows] = await this.db.execute('SELECT * FROM calendar_events WHERE ...');
    return rows;
}
```

**OBJETIVO (Exportable):**
```javascript
// CalendarService.js
async getEvents(filters) {
    // No sabe de SQL. Pide datos al DAO.
    return await EventDAO.list(filters);
}

// EventDAO.js (Archivo separado)
async list(filters) {
    // Aquí vive el SQL. Si cambias de DB, solo cambias este archivo.
    return db.query('SELECT * FROM calendar_events...');
}
```

## ✅ Conclusión

El proyecto tiene una base funcional, pero **arquitectónicamente monolítica** a nivel de servicios. Para cumplir con el requerimiento de "Reutilización en otros proyectos", es imperativo aplicar el tratamiento `StudentService` a los otros 53 sistemas.
