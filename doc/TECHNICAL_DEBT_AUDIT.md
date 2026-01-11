# 🛠️ REPORTE DE AUDITORÍA TÉCNICA: DEUDA Y SIMPLIFICACIÓN

## 1. ESTADO DE LA FRAGMENTACIÓN (RUTAS)

**Hallazgo Crítico:** El servidor registra más de **150 rutas** individuales en el inicio.

- **Riesgo:** Alta ocupación de memoria, dificultad de depuración y tiempos de inicio lentos.
- **Ejemplo de Redundancia:** Tienes `ai-tutor`, `ai-tutor-v2`, `ai-tutor-alpha`, `asistente-virtual` y `tutorV2Routes`. Todos parecen cumplir funciones similares.

> [!IMPORTANT]
>
> ### Propuesta: Consolidación de API
>
> Debemos agrupar rutas por "Dominio de Negocio" en lugar de por "Semana de Desarrollo".
>
> - `v1/auth/*` (Login, Register, 2FA, WebAuthn)
> - `v1/learning/*` (Tutor, Planes, Grupos)
> - `v1/admin/*` (Analytics, MLOps, Gestión de Ciclos)

---

## 2. LA "TRAMPA DE LA IA" (SOBRE-SERVICIOS)

Tienes servicios de IA para casi cada semana del año. Muchos de estos son "huérfanos" o dependen de lógica que vive en múltiples lugares.

- **Observación:** El archivo `server.js` importa archivos directamente de carpetas como `ai/analytics`, `ai/tutor`, `ai/evaluation`, etc.
- **Acción:** Centralizar la lógica de IA en un solo `AIService` genérico que use inyección de dependencias para modelos específicos. Esto reducirá el costo de mantenimiento y facilitará la optimización de tokens.

---

## 3. EL "GOLDEN PATH" (FUERTE PERO FRÁGIL)

| Proceso | Estado Actual | Observación Técnica |
|---------|---------------|---------------------|
| **Autenticación** | ✅ Muy Robusto | Incluye 2FA y WebAuthn. Es de nivel profesional. |
| **Inscripciones** | ⚠️ Básico | La lógica de validación es buena, pero falta integración con el sistema de pagos/finanzas en el flujo principal. |
| **Calificaciones** | 🟠 Complejo | Mezcla lógica de Service Layer con acceso directo a DAOs. |

---

## 4. PRIORIDADES DE SIMPLIFICACIÓN (Q1 2026)

1. **Unificar el Engine de IA:** Pasar de 15 servicios de IA a **1 Orquestador de IA**.
2. **Limpieza de "Rutas Muertas":** Eliminar o comentar rutas de features experimentales que no se usan activamente.
3. **Standarización de Respuesta:** Asegurar que todos los endpoints devuelvan el mismo formato de error sanitizado (ya tienes los utils, pero no todos los usan).

---

## Conclusión de la Auditoría

La base es sólida, pero el crecimiento ha sido horizontal y desordenado (*Spaghetti Architecture*). Para que el proyecto crezca a 10 escuelas, necesitamos una **Re-arquitectura Vertical**.

**¿Procedemos con la creación de un "Orquestador de IA" para simplificar los servicios de Tutor y Analytics?**
