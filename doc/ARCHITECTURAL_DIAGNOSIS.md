# 🏗️ DIAGNÓSTICO ARQUITECTÓNICO - BGE ProyectoHP

**Fecha:** 11 de Enero de 2026  
**Versión:** 1.0  
**Objetivo:** Transformar el proyecto de un sistema monolítico frágil a una plataforma SaaS multitenant modular y escalable.

---

## 📊 MÉTRICAS ACTUALES DEL PROYECTO

| Categoría | Cantidad | Observación |
|-----------|----------|-------------|
| **Páginas HTML** | 71 | Alto número para una SPA |
| **Scripts JS Frontend** | 380 | ⚠️ CRÍTICO - Excesivo |
| **Rutas Backend (.ts)** | 177 | ⚠️ CRÍTICO - Fragmentado |
| **Servicios Backend** | 262 | ⚠️ CRÍTICO - Sin consolidar |
| **DAOs** | 80 | Razonable |
| **Archivos >50KB** | 20+ | Monolíticos |
| **Archivos Duplicados** | 30+ | Código repetido |
| **node_modules** | ~197 MB | Dependencias infladas |

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. FRAGMENTACIÓN EXCESIVA DE RUTAS (177 archivos .ts)

**Síntoma:** El backend tiene 177 archivos de rutas TypeScript separados.

**Impacto:**

- Difícil mantener consistencia
- Endpoints duplicados o inconsistentes
- Alto riesgo de regresiones
- Carga cognitiva extrema para desarrolladores

**Ejemplo de Fragmentación:**

```
backend/routes/
├── auth.ts
├── auth-2fa.ts
├── auth-google.ts
├── auth-webauthn.ts      <- 4 archivos para un solo dominio
├── grades.ts
├── grades-advanced.ts
├── grades-reports.ts     <- 3 archivos para un solo dominio
└── ... (170+ más)
```

**Solución Propuesta:**

- Consolidar por **dominio de negocio** (máximo 15-20 archivos de rutas)
- Un archivo por bounded context: `auth.routes.ts`, `grades.routes.ts`, etc.

---

### 2. EXPLOSIÓN DE SERVICIOS (262 archivos)

**Síntoma:** 262 archivos de servicios sin patrón claro.

**Impacto:**

- Servicios con responsabilidades superpuestas
- Dependencias circulares
- Imposible identificar el servicio correcto para una tarea

**Ejemplo de Duplicación Conceptual:**

```
backend/services/
├── AIService.js
├── ai-service.js
├── AITutorService.js
├── ai-tutor.service.js
├── openai-service.js        <- 5+ servicios para IA
├── GradesService.js
├── grades.service.js
├── GradesReportService.js   <- 3+ servicios para calificaciones
└── ... (250+ más)
```

**Solución Propuesta:**

- Reducir a máximo 30-40 servicios consolidados
- Un servicio por dominio con métodos claros
- Eliminar servicios duplicados

---

### 3. FRONTEND MONOLÍTICO Y DUPLICADO

**Síntoma:** 380 archivos JavaScript en frontend, 30+ duplicados confirmados.

**Archivos Duplicados Detectados:**

| Archivo | Copias | Acción |
|---------|--------|--------|
| `admin-dashboard.js` | 2 | Consolidar |
| `mobile-student-dashboard.js` | 2 | Consolidar |
| `context-manager.js` | 2 | Consolidar |
| `api-client.js` | 2 | Consolidar |
| `main.js` | 2 | Consolidar |
| `script.js` | 2 | Consolidar |

**Archivos Grandes (Monolíticos):**

| Archivo | Tamaño | Problema |
|---------|--------|----------|
| `dashboard-manager-2025.js` | 148KB | Demasiadas responsabilidades |
| `bge-security-module.js` | 99KB | Monolítico |
| `chatbot.js` | 93KB | Acoplado |
| `unified-auth-system-v2.js` | 86KB | Complejo |

---

### 4. ACOPLAMIENTO ENTRE MÓDULOS

**Síntoma:** Cambios en un módulo rompen otros sistemas.

**Dependencias Ocultas Identificadas:**

```
unified-auth-system-v2.js
    ├── Depende de: config.js
    ├── Depende de: context-manager.js
    ├── Depende de: api-client.js
    ├── Modifica: localStorage (varios keys)
    └── Eventos globales: 'auth:login', 'auth:logout'
         └── dashboard-manager.js escucha estos eventos
         └── chatbot.js escucha estos eventos
         └── gamification.js escucha estos eventos
         └── ... (efecto cascada)
```

**Riesgo:** Cualquier cambio en autenticación puede romper 10+ sistemas.

---

### 5. AUSENCIA DE ARQUITECTURA MULTITENANT

**Estado Actual:**

- El sistema asume una sola escuela
- Configuración hardcodeada en múltiples lugares
- Datos no aislados por tenant
- Sin concepto de "organización"

**Evidencia:**

```javascript
// Encontrado en múltiples archivos:
const SCHOOL_NAME = "BGE Héroes de la Patria";
const API_URL = "/api"; // Sin tenant ID
```

---

## 📋 CLASIFICACIÓN DE CÓDIGO

### ✅ CÓDIGO FUNCIONAL Y EN USO

| Módulo | Archivos Clave | Estado |
|--------|---------------|--------|
| **Autenticación** | `unified-auth-system-v2.js`, `auth.ts` | Funcional, necesita refactor |
| **Calificaciones** | `grades-manager.js`, `grades.ts` | Funcional |
| **Citas** | `appointments.js`, `citas.ts` | Funcional |
| **Inscripciones** | `inscriptions-client.js`, `inscriptions.ts` | Funcional |
| **Mensajería** | `messaging-manager.js`, `messaging.ts` | Recién integrado ✅ |
| **Foros** | `community-viewer.js`, `forums.ts` | Recién integrado ✅ |
| **Encuestas** | `polls-manager.js`, `polls.ts` | Funcional |

### ⚠️ CÓDIGO PARCIALMENTE FUNCIONAL

| Módulo | Problema | Acción |
|--------|----------|--------|
| **Portal de Padres** | Múltiples scripts (parent-portal.js, parents-portal-manager.js) | Consolidar en uno |
| **Gamificación** | Fragmentado en 5+ archivos | Consolidar |
| **Biblioteca Digital** | Endpoints posiblemente desincronizados | Verificar |
| **Portal Docentes** | UI existe, conexión parcial | Completar integración |

### ❌ CÓDIGO NO FUNCIONAL / MUERTO

| Categoría | Cantidad | Ubicación |
|-----------|----------|-----------|
| **Archivos en _quarantine** | 53 | `public/js/_quarantine/` |
| **Servicios sin uso** | ~50+ | `backend/services/` |
| **Rutas no registradas** | ~30+ | `backend/routes/` |

### 🔁 CÓDIGO DUPLICADO

| Tipo | Cantidad | Impacto |
|------|----------|---------|
| Scripts frontend duplicados | 30+ | Alto |
| Servicios con nombres similares | 20+ | Alto |
| DAOs con funciones repetidas | 10+ | Medio |

### 🧪 CÓDIGO EXPERIMENTAL

| Módulo | Estado | Decisión Necesaria |
|--------|--------|-------------------|
| `emerging-technologies.js` | Incompleto | Eliminar o completar |
| `ar-education-system.js` | Incompleto | Eliminar o completar |
| `ai-machine-learning.js` | Parcial | Evaluar necesidad |

---

## 🗺️ MAPA DE MÓDULOS Y DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │   index    │ │  padres    │ │ estudiantes│ │   admin    │   │
│  │   .html    │ │   .html    │ │   .html    │ │   .html    │   │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘   │
│        │              │              │              │           │
│  ┌─────▼──────────────▼──────────────▼──────────────▼──────┐   │
│  │                 380 SCRIPTS JS                           │   │
│  │    (Fragmentados, Duplicados, Acoplados)                 │   │
│  └─────────────────────────┬────────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE API (Express)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              177 ARCHIVOS DE RUTAS                      │    │
│  │    (Fragmentados por endpoint, sin consolidar)          │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │             262 SERVICIOS                               │    │
│  │    (Duplicados, superpuestos, sin patrón claro)         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              80 DAOs + PostgreSQL                       │    │
│  │    (Mejor estructurado, pero aún fragmentado)           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARQUITECTURA OBJETIVO (SaaS MULTITENANT)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │     SPA MODULAR (Vite + ES Modules)                     │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  Auth   │ │ Grades  │ │ Forums  │ │ Gamify  │       │    │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  │       ↓           ↓           ↓           ↓             │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │        API Client Unificado (1 archivo)          │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ /api/v1/{tenantId}/...
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Tenant Resolution → Auth → Rate Limit → Routing       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXTS (~15)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Auth   │ │ Grades  │ │ Forums  │ │ Parents │ │ Gamify  │  │
│  │ Context │ │ Context │ │ Context │ │ Context │ │ Context │  │
│  │─────────│ │─────────│ │─────────│ │─────────│ │─────────│  │
│  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │  │
│  │ Service │ │ Service │ │ Service │ │ Service │ │ Service │  │
│  │ DAO     │ │ DAO     │ │ DAO     │ │ DAO     │ │ DAO     │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │     PostgreSQL con Row-Level Security (RLS)             │    │
│  │     Aislamiento por tenant_id en todas las tablas       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 PLAN DE LIMPIEZA POR FASES

### FASE 1: PREPARACIÓN (Semana 1-2)

**Objetivo:** Establecer base segura para refactorización

| Tarea | Riesgo | Prioridad |
|-------|--------|-----------|
| Crear suite de tests E2E para flujos críticos | Bajo | 🔴 Alta |
| Documentar dependencias actuales | Bajo | 🔴 Alta |
| Configurar CI/CD con tests automáticos | Bajo | 🔴 Alta |
| Crear backup de código actual | Bajo | 🔴 Alta |

### FASE 2: LIMPIEZA SEGURA (Semana 3-4)

**Objetivo:** Eliminar código muerto sin riesgo

| Tarea | Archivos | Riesgo |
|-------|----------|--------|
| Eliminar carpeta `_quarantine` | 53 archivos | Bajo |
| Eliminar archivos `.backup` y `.tmp` | ~20 archivos | Bajo |
| Eliminar servicios huérfanos | ~30 archivos | Medio |
| Consolidar scripts duplicados | 30 archivos | Medio |

### FASE 3: CONSOLIDACIÓN (Semana 5-8)

**Objetivo:** Reducir fragmentación

| Módulo | De | A | Riesgo |
|--------|-----|---|--------|
| Rutas Backend | 177 archivos | ~20 archivos | Alto |
| Servicios | 262 archivos | ~40 archivos | Alto |
| Frontend JS | 380 archivos | ~50 módulos | Alto |

### FASE 4: MULTITENANT (Semana 9-12)

**Objetivo:** Habilitar arquitectura SaaS

| Tarea | Complejidad |
|-------|-------------|
| Agregar `tenant_id` a todas las tablas | Alta |
| Implementar RLS en PostgreSQL | Alta |
| Crear middleware de resolución de tenant | Media |
| Migrar configuración a base de datos | Media |

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Archivos JS Frontend | 380 | <60 |
| Rutas Backend | 177 | <25 |
| Servicios Backend | 262 | <50 |
| Tiempo de build | ? | <30s |
| Cobertura de tests | ~0% | >70% |
| Código duplicado | Alto | <5% |

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper funcionalidad existente | Alta | Crítico | Tests E2E antes de refactor |
| Dependencias ocultas | Alta | Alto | Documentar antes de eliminar |
| Resistencia al cambio | Media | Medio | Cambios incrementales |
| Tiempo insuficiente | Media | Alto | Priorizar por valor |

---

## 📌 PRÓXIMOS PASOS INMEDIATOS

1. ☐ Revisar y aprobar este diagnóstico
2. ☐ Crear suite de tests E2E para flujos críticos
3. ☐ Eliminar carpeta `_quarantine` (53 archivos seguros de eliminar)
4. ☐ Consolidar scripts duplicados (empezar por `admin-dashboard.js`)
5. ☐ Crear mapa detallado de dependencias frontend

---

**Documento preparado por:** Gemini AI Agent  
**Próxima revisión:** Después de aprobación del plan
