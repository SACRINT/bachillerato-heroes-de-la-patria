# 🚨 Plan de Respuesta a Incidentes de Seguridad (IRP)

**Versión:** 1.0
**Fecha:** 23 de Noviembre de 2025
**Documento:** `docs/soc2/03-incident-response-plan.md`
**Cumplimiento:** SOC2 CC8.1

---

## 1. Propósito y Alcance

Este Plan de Respuesta a Incidentes (IRP) establece los procedimientos que el Bachillerato General "Héroes de la Patria" seguirá para responder a incidentes de seguridad de la información. El objetivo es proporcionar una guía sistemática para detectar, contener, erradicar y recuperarse de incidentes, minimizando el impacto y previniendo futuras ocurrencias.

Este plan aplica a todos los sistemas, datos, y personal involucrado en la plataforma BGE.

---

## 2. Roles y Responsabilidades

### Equipo de Respuesta a Incidentes (ERI)

El ERI es el grupo principal responsable de ejecutar este plan.

| Rol | Nombre/Contacto | Responsabilidades Clave |
| :--- | :--- | :--- |
| **Líder de Incidente (Incident Lead)** | `[Nombre, ej: Director de TI]` | Coordina toda la respuesta, toma de decisiones, comunicación. |
| **Analista de Seguridad (Security Analyst)** | `[Nombre, ej: Administrador de Sistemas]` | Investigación técnica, análisis de logs, identificación de la causa raíz. |
| **Líder de Comunicaciones (Comms Lead)** | `[Nombre, ej: Coordinador Académico]` | Gestiona la comunicación interna y externa (si es necesario). |
| **Asesor Legal (Legal Counsel)** | `[Nombre, ej: Abogado Externo]` | Proporciona guía sobre obligaciones legales y de notificación. |

---

## 3. Niveles de Severidad de Incidentes

Los incidentes se clasificarán para priorizar la respuesta.

| Nivel | Descripción | Ejemplo | Tiempo de Respuesta |
| :--- | :--- | :--- | :--- |
| **1 - Crítico** | Compromiso masivo de datos, sistema principal caído, pérdida financiera significativa. | Fuga de datos de todos los estudiantes; Ransomware. | Inmediata (< 15 min) |
| **2 - Alto** | Compromiso de un sistema importante, acceso no autorizado a datos sensibles. | Cuenta de administrador comprometida, base de datos de calificaciones alterada. | Urgente (< 1 hora) |
| **3 - Medio** | Funcionalidad degradada, intento de acceso no autorizado fallido. | Endpoint de API mostrando errores 500, intento de inyección SQL bloqueado. | Normal (< 8 horas) |
| **4 - Bajo** | Violación menor de política, actividad de escaneo de bajo nivel. | Un usuario comparte su contraseña. | Programada (< 24 horas) |

---

## 4. Ciclo de Vida de la Respuesta a Incidentes

El ERI seguirá el siguiente ciclo de vida basado en el estándar del NIST.

### Fase 1: Preparación
- **Capacitación:** El ERI recibe capacitación anual sobre este plan.
- **Herramientas:** Se asegura el acceso a sistemas de logging (Kibana, Vercel Logs), base de datos (Neon), y herramientas de comunicación.
- **Simulacros:** Se realizan simulacros de respuesta a incidentes trimestralmente.

### Fase 2: Detección y Análisis
- **Detección:** Los incidentes pueden ser detectados a través de:
    - **Alertas automáticas** (ej: email de cambio de rol a admin).
    - Monitoreo de logs (Prometheus, Grafana, ELK).
    - Reportes de usuarios o personal.
- **Análisis Inicial:** El primer respondiente crea un ticket de incidente, asigna un nivel de severidad inicial y notifica al Líder de Incidente.

### Fase 3: Contención
- **Objetivo:** Limitar el alcance y el daño del incidente.
- **Acciones Inmediatas:**
    - Aislar los sistemas afectados (ej: desconectar un servidor de la red).
    - Invalidar credenciales comprometidas (ej: forzar cierre de sesión, resetear contraseñas).
    - Bloquear direcciones IP de origen malicioso.
    - Realizar una instantánea (snapshot) de los sistemas afectados para análisis forense.

### Fase 4: Erradicación
- **Objetivo:** Eliminar la causa raíz del incidente.
- **Acciones:**
    - Identificar y eliminar malware o código malicioso.
    - Parchear las vulnerabilidades explotadas.
    - Reconstruir sistemas desde una copia de seguridad segura si es necesario.
    - Asegurarse de que el atacante ya no tiene acceso.

### Fase 5: Recuperación
- **Objetivo:** Restaurar los sistemas a su estado normal de operación.
- **Acciones:**
    - Restaurar datos desde backups limpios.
    - Volver a poner los sistemas en línea de forma controlada.
    - Monitorear de cerca los sistemas para asegurar que el incidente no recurra.
    - Confirmar que la funcionalidad ha sido completamente restaurada.

### Fase 6: Actividades Post-Incidente (Lecciones Aprendidas)
- **Objetivo:** Aprender del incidente para prevenir futuras ocurrencias.
- **Acciones (dentro de las 2 semanas posteriores):**
    - Realizar una reunión de post-mortem.
    - Crear un reporte final del incidente que incluya:
        - Resumen ejecutivo.
        - Línea de tiempo detallada.
        - Causa raíz.
        - Impacto.
        - Acciones tomadas.
        - **Lecciones aprendidas y plan de acción para mejoras.**
    - Actualizar este IRP si es necesario.

---

## 5. Playbooks de Incidentes Comunes

### Playbook: Acceso No Autorizado a Cuenta de Administrador

- **Detección:** Alerta de seguridad por cambio de rol, o reporte de actividad sospechosa.
- **Contención:**
    1.  Invalidar inmediatamente todas las sesiones del presunto admin comprometido (`POST /api/auth/invalidate-user-sessions`).
    2.  Forzar el reseteo de la contraseña de la cuenta.
    3.  Desactivar temporalmente la cuenta si la actividad persiste.
- **Erradicación:**
    1.  Analizar `audit_logs` para identificar todas las acciones realizadas por la cuenta comprometida.
    2.  Revertir cualquier cambio no autorizado (ej: restaurar roles de otros usuarios).
- **Recuperación:**
    1.  Comunicarse con el dueño legítimo de la cuenta.
    2.  Asistir en la creación de una nueva contraseña segura y la configuración de 2FA.
    3.  Reactivar la cuenta.
- **Post-Incidente:** Analizar cómo se obtuvo la credencial (phishing, fuerza bruta) y fortalecer los controles de login.

---

## 6. Información de Contacto del ERI

| Rol | Contacto Primario | Contacto Secundario |
| :--- | :--- | :--- |
| **Líder de Incidente** | `[email@institucion.com]` | `[telefono]` |
| **Analista de Seguridad** | `[email@institucion.com]` | `[telefono]` |
| **Líder de Comunicaciones**| `[email@institucion.com]` | `[telefono]` |
| **Asesor Legal** | `[email@firmalegal.com]` | `[telefono]` |

---
Este documento debe ser revisado y actualizado anualmente o después de cada incidente crítico.
