# 📋 Plan de Gestión de Cambios

**Versión:** 1.0
**Fecha:** 23 de Noviembre de 2025
**Documento:** `docs/soc2/04-change-management-plan.md`
**Cumplimiento:** SOC2 CC9.1, CC9.2

---

## 1. Propósito y Alcance

El propósito de este Plan de Gestión de Cambios es asegurar que todas las modificaciones al sistema BGE Héroes de la Patria se realicen de manera controlada, sistemática y segura. El objetivo es minimizar el riesgo de interrupciones del servicio, vulnerabilidades de seguridad y errores funcionales.

Este plan aplica a todos los cambios en el código fuente, la infraestructura, la base de datos y la configuración del sistema.

---

## 2. Roles y Responsabilidades

| Rol | Responsable(s) | Responsabilidades Clave |
| :--- | :--- | :--- |
| **Solicitante (Requester)** | Cualquier miembro del equipo, usuario final. | Identifica la necesidad de un cambio y crea la solicitud inicial (ej. un ticket). |
| **Desarrollador (Developer)** | Arquitecto IA, Ingenieros de Software. | Diseña, desarrolla y prueba el cambio en una rama de feature separada. |
| **Revisor (Reviewer)** | Otro Desarrollador o el Líder Técnico. | Realiza la revisión del código (Pull Request) para asegurar calidad y seguridad. |
| **Aprobador (Approver)** | Líder Técnico, Dueño del Producto (PM). | Da la aprobación final para que el cambio sea mergeado a la rama principal. |
| **Encargado del Despliegue (Deployer)**| Proceso automatizado (Vercel/GitHub Actions). | Realiza el merge del código a `main` y supervisa el despliegue a producción. |

---

## 3. Proceso Estándar de Gestión de Cambios

Todo cambio no urgente debe seguir este ciclo de vida de 7 pasos.

### Paso 1: Solicitud de Cambio (Request)
- Se crea un ticket o issue en el sistema de seguimiento (ej. GitHub Issues) detallando el cambio propuesto, la justificación y el impacto esperado.
- El Aprobador revisa y prioriza la solicitud.

### Paso 2: Desarrollo (Develop)
- El Desarrollador crea una nueva rama en Git desde la rama `main` (ej. `feature/update-user-role`).
- Todo el desarrollo y las modificaciones se realizan exclusivamente en esta rama.
- Se deben incluir o actualizar los tests unitarios y de integración relevantes.

### Paso 3: Pruebas (Test)
- El Desarrollador ejecuta todos los tests automatizados en su entorno local para asegurar que no hay regresiones.
- Se realizan pruebas manuales del flujo afectado para verificar la funcionalidad.
- **Criterio de Salida:** 100% de los tests existentes deben pasar.

### Paso 4: Revisión (Review)
- El Desarrollador crea un **Pull Request (PR)** en GitHub, comparando su rama de feature con la rama `main`.
- La descripción del PR debe incluir:
    - Un resumen del cambio.
    - Un enlace al ticket o issue original.
    - Un resumen de las pruebas realizadas.
- Se asigna al menos un Revisor para que analice el código en busca de errores, vulnerabilidades y adherencia a las buenas prácticas.

### Paso 5: Aprobación (Approve)
- El Revisor deja comentarios y solicita cambios si es necesario.
- Una vez que el Revisor está satisfecho, aprueba el PR.
- El Aprobador final da el visto bueno para el merge, confirmando que el cambio se alinea con los objetivos del proyecto.
- **Criterio de Salida:** Se requiere al menos una aprobación de un Revisor.

### Paso 6: Despliegue (Deploy)
- El Encargado del Despliegue (o el Desarrollador, con permiso) realiza el "Merge" del Pull Request a la rama `main`.
- **El merge a `main` dispara automáticamente el pipeline de CI/CD** (ej. en Vercel).
- El pipeline ejecuta los tests una última vez antes de desplegar a producción.
- Si el pipeline falla, el cambio se revierte automáticamente y se notifica al equipo.

### Paso 7: Verificación (Verify)
- Después de un despliegue exitoso, el Desarrollador y el Aprobador verifican que el cambio funciona como se esperaba en el entorno de producción.
- Se monitorean los logs y las métricas de rendimiento durante un período para detectar cualquier anomalía.
- Una vez verificado, el ticket o issue original se marca como "Cerrado" o "Resuelto".

---

## 4. Proceso de Cambio de Emergencia

Para bugs críticos que afectan la disponibilidad o seguridad del sistema en producción.

1.  **Identificación:** Se declara una emergencia y se notifica al Líder de Incidente.
2.  **Hotfix:** Un desarrollador crea una rama `hotfix/nombre-del-bug` directamente desde `main`.
3.  **Desarrollo Rápido:** Se implementa la corrección mínima necesaria para resolver el problema.
4.  **Revisión Acelerada:** Se requiere una revisión y aprobación verbal o por chat del Líder Técnico.
5.  **Despliegue Inmediato:** El hotfix se mergea a `main` y se despliega inmediatamente.
6.  **Post-Mortem:** Después de que la emergencia ha sido contenida, se debe crear un PR formal desde la rama de hotfix a `main` (aunque ya esté mergeada) para documentar el cambio, y se debe seguir la Fase 6 del IRP (Lecciones Aprendidas).

---
Este documento formaliza el proceso de desarrollo seguro y controlado, asegurando la estabilidad y la integridad del sistema BGE en todo momento.
