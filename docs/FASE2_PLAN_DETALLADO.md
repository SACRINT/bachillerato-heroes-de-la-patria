# 🚀 FASE 2: Plan de Implementación Detallado

## Estabilización y Sistemas Críticos (Calificaciones y Padres)

**Semanas 9-16 (Febrero - Marzo 2026)**

---

## 📋 Índice de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Semana 9-10: Sistema de Calificaciones](#semana-9-10)
3. [Semana 11-12: Credenciales de Padres](#semana-11-12)
4. [Semana 13-14: Testing de Integración](#semana-13-14)
5. [Semana 15-16: Estabilización y CI/CD](#semana-15-16)
6. [Checklist de Entregables](#checklist)

---

## 📊 Resumen Ejecutivo {#resumen-ejecutivo}

| Aspecto | Detalle |
| :--- | :--- |
| **Duración** | 8 semanas (40 días hábiles) |
| **Horas estimadas** | ~320 horas de desarrollo |
| **Objetivo principal** | Implementar módulos de Calificaciones y Padres + 70% Coverage |
| **Riesgo principal** | Complejidad de la base de datos de calificaciones |

### Estado Inicial (Post-Fase 1)

* ✅ **Servicios:** 100% Refactorizados (Service + DAO Pattern).
* ✅ **Framework de Testing:** Configurado (Jest).
* ✅ **Documentación:** Arquitectura base documentada.
* ⏳ **Sistemas:** Calificaciones y Padres pendientes de implementación real.

### Estado Meta (Fin de Fase 2)

* ✅ **Calificaciones:** Sistema completo CRUD + Captura Admin + Boletas.
* ✅ **Padres:** Portal de acceso, vinculación con alumnos.
* ✅ **Tests:** Cobertura > 70% (Unitarios + Integración).
* ✅ **Deploy:** Pipeline CI/CD robusto con Staging.

---

## 📅 SEMANA 9-10: Sistema de Calificaciones {#semana-9-10}

### 🎯 Objetivo

Diseñar e implementar el sistema completo de captura y consulta de calificaciones.

### Tareas Específicas

#### Día 1-2: Diseño de Base de Datos

* [ ] Diseñar esquema relacional: `calificaciones`, `materias`, `periodos`, `profesores_materias`.
* [ ] Crear script de migración SQL (`backend/migrations/0xx_create_grades_schema.sql`).
* [ ] Verificar integridad referencial (Foreign Keys).

#### Día 3-5: Backend Core (DAO + Service)

* [ ] Implementar `GradesDAO`:
  * `createGrade()`, `updateGrade()`, `getGradesByStudent()`.
  * `getGradesByGroup()`, `calculateAverage()`.
* [ ] Implementar `GradesService`:
  * Validaciones de rangos (0-10).
  * Lógica de bloqueo por periodo cerrado.
  * Cálculo de promedios automáticos.

#### Día 6-8: API y Frontend Admin

* [ ] Crear endpoints: `POST /api/grades`, `GET /api/grades/student/:id`.
* [ ] Implementar formulario de captura masiva en Dashboard (`public/admin/calificaciones.html`).
* [ ] Implementar lógica de guardado en lote (Batch Insert).

#### Día 9-10: Reportes (Boletas)

* [ ] Generar PDF de boleta usando `puppeteer` o `pdfkit`.
* [ ] Endpoint de descarga de boleta.
* [ ] Vista de alumno para consultar historial.

---

## 📅 SEMANA 11-12: Sistema de Credenciales de Padres {#semana-11-12}

### 🎯 Objetivo

Permitir el acceso a padres de familia para monitorear a sus hijos.

### Tareas Específicas

#### Día 1-2: Autenticación de Padres

* [ ] Migración: Tabla `padres_credenciales` y tabla pivote `padres_alumnos`.
* [ ] Actualizar `AuthService` para soportar rol `parent`.
* [ ] Implementar `ParentsDAO`.

#### Día 3-5: Gestión de Cuentas (Admin)

* [ ] Panel para crear cuentas de padres masivamente.
* [ ] Generación de contraseñas temporales.
* [ ] Sistema de vinculación Padre <-> Alumno (por CURP/Matrícula).

#### Día 6-8: Portal del Padre

* [ ] Crear vista `public/padres/login.html`.
* [ ] Crear Dashboard Padre (`public/padres/dashboard.html`).
* [ ] Widgets: Asistencia, Calificaciones, Avisos.

#### Día 9-10: First-Login Flow

* [ ] Forzar cambio de contraseña en primer inicio.
* [ ] Verificación de datos de contacto.

---

## 📅 SEMANA 13-14: Testing de Integración {#semana-13-14}

### 🎯 Objetivo

Alcanzar 70% de cobertura y asegurar estabilidad entre módulos.

### Tareas Específicas

* [ ] **Tests de Integración (API):** Usar `supertest` para probar endpoints completos.
  * Flujo Login -> Obtener Token -> Consultar Datos.
* [ ] **Tests de Módulos Críticos:**
  * `GradesService`: Escenarios de bordes (promedios, decimales).
  * `AuthService`: Renovación de tokens, roles.
* [ ] **Mocking Avanzado:** Simular DB para tests rápidos.

---

## 📅 SEMANA 15-16: Estabilización y CI/CD {#semana-15-16}

### 🎯 Objetivo

Preparar el entorno para despliegues seguros y automatizados.

### Tareas Específicas

* [ ] **Configurar GitHub Actions:**
  * Pipeline de Test en cada Push.
  * Linting automático.
* [ ] **Entorno de Staging:**
  * Configurar base de datos de prueba en Vercel/Neon.
  * Deploy automático de rama `develop` a Staging.
* [ ] **Logging y Monitoreo:**
  * Refinar `devLogger` para producción.
  * Configurar alertas de error 500.

---

## ✅ CHECKLIST FINAL DE FASE 2 {#checklist}

### Sistema de Calificaciones

- [ ] Tablas de calificaciones creadas en BD.
* [ ] Endpoints CRUD funcionales.
* [ ] Captura de calificaciones por profesor/admin funcional.
* [ ] Generación de boletas PDF.

### Credenciales de Padres

- [ ] Login de padres funcional.
* [ ] Vinculación Padre-Alumno correcta.
* [ ] Dashboard de padre muestra datos del alumno correcto.

### Calidad

- [ ] Test Coverage > 70%.
* [ ] Pipeline CI/CD pasando en verde.
* [ ] Cero bugs críticos reportados en Staging.
