# 🗓️ Plan Estratégico de 60 Semanas - BGE Héroes de la Patria

**Documento:** Plan Maestro de Refactorización y Modernización  
**Fecha de Inicio:** Diciembre 2025  
**Fecha Estimada de Finalización:** Febrero 2027  
**Versión:** 1.0

---

## 📊 Resumen Ejecutivo

Este plan detalla la estrategia de trabajo para las próximas **60 semanas**, dividido en **5 fases principales**. El objetivo es transformar el proyecto de un estado de deuda técnica significativa a una arquitectura moderna, escalable y mantenible.

### Métricas Actuales del Proyecto

| Métrica | Estado Actual | Meta Final |
|---------|---------------|------------|
| Servicios con patrón DAO | 51/54 (94%) | 54/54 (100%) |
| Cobertura de tests | ~5% | 70%+ |
| Eventos inline (CSP) | 600+ | 0 |
| Referencias hardcodeadas | 2,300+ | 0 |
| Código TypeScript | 0% | 80%+ |
| Documentación | Parcial | Completa |

---

## 🎯 Visión General de Fases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 1        │  FASE 2        │  FASE 3        │  FASE 4        │ FASE 5 │
│  Semanas 1-8   │  Semanas 9-16  │  Semanas 17-28 │  Semanas 29-45 │ 46-60  │
│                │                │                │                │        │
│  Completar     │  Estabilizar   │  Refactorizar  │  Migrar a TS   │ TS     │
│  Refactorización│  y Testing    │  Frontend      │  (Backend)     │Frontend│
│                │                │                │                │        │
│  ████████████  │  ████████████  │  ████████████  │  ████████████  │████████│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 📋 FASE 1: Completar Refactorización de Servicios

## Semanas 1-8 (Diciembre 2025 - Enero 2026)

### 🎯 Objetivos de la Fase

- Completar la refactorización de los 3 servicios pendientes
- Establecer framework de testing
- Documentar arquitectura Service + DAO
- Corregir bugs críticos identificados

---

### 📅 Semana 1-2: Finalizar Servicios Pendientes

#### Tareas Técnicas

| ID | Tarea | Prioridad | Horas Est. | Entregable |
|----|-------|-----------|------------|------------|
| 1.1 | Analizar `AdvancedSecurityService` (1114 líneas) | Alta | 4h | Documento de análisis |
| 1.2 | Crear `security-advanced.dao.js` si aplica | Alta | 6h | DAO funcional |
| 1.3 | Refactorizar `AdvancedSecurityService` | Alta | 8h | Servicio limpio |
| 1.4 | Analizar `RealTimeCollaborationService` (995 líneas) | Alta | 4h | Documento de análisis |
| 1.5 | Determinar si necesita DAO o es in-memory | Media | 2h | Decisión documentada |
| 1.6 | Refactorizar/documentar servicio | Alta | 6h | Servicio documentado |
| 1.7 | Analizar `collaborative-editing-service` | Media | 3h | Documento de análisis |
| 1.8 | Completar refactorización pendiente | Media | 5h | Servicio completo |

#### Criterios de Aceptación

- [ ] 54/54 servicios analizados y documentados
- [ ] Todos los servicios que usan BD tienen DAO
- [ ] Cero `pool.query()` directo en servicios

---

### 📅 Semana 3-4: Framework de Testing

#### Tareas Técnicas

| ID | Tarea | Prioridad | Horas Est. | Entregable |
|----|-------|-----------|------------|------------|
| 2.1 | Instalar y configurar Jest | Alta | 2h | `jest.config.js` |
| 2.2 | Configurar Supertest para API | Alta | 2h | Setup funcional |
| 2.3 | Crear estructura de carpetas de tests | Alta | 1h | `/tests` organizado |
| 2.4 | Escribir tests para 5 DAOs críticos | Alta | 12h | 50+ tests |
| 2.5 | Configurar GitHub Actions CI/CD | Media | 4h | Pipeline funcional |
| 2.6 | Escribir tests para servicios auth | Alta | 8h | 30+ tests |
| 2.7 | Configurar coverage mínimo (50%) | Media | 2h | Threshold configurado |
| 2.8 | Documentar guía de testing | Media | 3h | `TESTING.md` |

#### DAOs Críticos para Testing

```
1. auth.dao.js          - Autenticación de usuarios
2. grades.dao.js        - Calificaciones
3. students.dao.js      - Estudiantes
4. tenant.dao.js        - Multi-tenancy
5. audit.dao.js         - Auditoría y seguridad
```

#### Criterios de Aceptación

- [ ] Jest ejecutando correctamente
- [ ] Mínimo 100 tests unitarios
- [ ] Coverage > 50% en DAOs críticos
- [ ] CI/CD ejecutando tests en cada PR

---

### 📅 Semana 5-6: Corrección de Bugs Críticos

#### Bugs Identificados por Auditoría

| ID | Bug | Severidad | Archivo Afectado | Horas Est. |
|----|-----|-----------|------------------|------------|
| 3.1 | Console.log expone datos sensibles (GDPR) | Crítica | 15+ archivos | 8h |
| 3.2 | Dashboard 500 errors en `/api/avisos/stats` | Alta | `avisos.routes.js` | 4h |
| 3.3 | Subscriber growth chart no funciona | Media | `dashboard-stats.js` | 3h |
| 3.4 | Forms muestran error falso | Media | `bolsa-trabajo.html` | 2h |
| 3.5 | Upload de archivos no funcional | Alta | `/api/upload` | 6h |
| 3.6 | Rango de años dinámico en forms | Baja | Múltiples forms | 3h |
| 3.7 | Chatbot flotante (YA CORREGIDO) | Media | `chatbot.js` | ✅ |

#### Criterios de Aceptación

- [ ] Cero console.log con datos sensibles
- [ ] Dashboard cargando sin errores 500
- [ ] Upload funcional en formularios

---

### 📅 Semana 7-8: Documentación y Consolidación

#### Tareas de Documentación

| ID | Tarea | Prioridad | Horas Est. | Entregable |
|----|-------|-----------|------------|------------|
| 4.1 | Actualizar `ARCHITECTURE.md` | Alta | 4h | Doc completo |
| 4.2 | Documentar patrón Service + DAO | Alta | 3h | Guía de desarrollo |
| 4.3 | Crear diagramas de arquitectura | Media | 4h | Diagramas Mermaid |
| 4.4 | Documentar API endpoints | Alta | 6h | OpenAPI/Swagger |
| 4.5 | Escribir guía de contribución | Media | 3h | `CONTRIBUTING.md` |
| 4.6 | Actualizar README principal | Media | 2h | README actualizado |
| 4.7 | Crear changelog de fase 1 | Baja | 2h | `CHANGELOG.md` |
| 4.8 | Review y retrospectiva de fase | Alta | 3h | Documento de cierre |

#### Criterios de Aceptación

- [ ] Documentación actualizada al 100%
- [ ] Diagramas de arquitectura completos
- [ ] OpenAPI spec para endpoints públicos

---

### 📊 Métricas de Éxito - Fase 1

| KPI | Meta | Cómo Medir |
|-----|------|------------|
| Servicios completos | 54/54 | Checklist actualizado |
| Tests unitarios | 100+ | Jest coverage report |
| Coverage DAOs | > 50% | Jest coverage |
| Bugs críticos | 0 | Issue tracker |
| Documentación | 100% | Review de docs |

---

# 📋 FASE 2: Estabilización y Testing Avanzado

## Semanas 9-16 (Febrero - Marzo 2026)

### 🎯 Objetivos de la Fase

- Implementar funcionalidades pendientes críticas
- Aumentar cobertura de tests a 70%+
- Estabilizar sistema de calificaciones
- Implementar sistema de credenciales de padres

---

### 📅 Semana 9-10: Sistema de Calificaciones

#### Tareas Técnicas

| ID | Tarea | Prioridad | Horas Est. |
|----|-------|-----------|------------|
| 5.1 | Diseñar esquema BD para calificaciones | Alta | 4h |
| 5.2 | Crear migración PostgreSQL | Alta | 3h |
| 5.3 | Implementar `grades.dao.js` completo | Alta | 6h |
| 5.4 | Implementar endpoints CRUD calificaciones | Alta | 8h |
| 5.5 | Crear formulario captura (admin) | Alta | 8h |
| 5.6 | Implementar consulta de boletas | Media | 6h |
| 5.7 | Tests de integración | Alta | 6h |
| 5.8 | Documentar API de calificaciones | Media | 3h |

---

### 📅 Semana 11-12: Sistema de Credenciales de Padres

#### Tareas Técnicas

| ID | Tarea | Prioridad | Horas Est. |
|----|-------|-----------|------------|
| 6.1 | Diseñar tabla `padres_credenciales` | Alta | 3h |
| 6.2 | Crear migración PostgreSQL | Alta | 2h |
| 6.3 | Implementar `parents.dao.js` | Alta | 5h |
| 6.4 | Crear panel admin para gestión | Alta | 8h |
| 6.5 | Implementar flujo first-login | Alta | 6h |
| 6.6 | Implementar reset de contraseña | Media | 4h |
| 6.7 | Vincular padre → estudiante | Alta | 5h |
| 6.8 | Tests de integración | Alta | 5h |

---

### 📅 Semana 13-14: Testing de Integración

#### Áreas de Testing

| Módulo | Tests Requeridos | Cobertura Meta |
|--------|------------------|----------------|
| Autenticación | 40 tests | 90% |
| Calificaciones | 30 tests | 85% |
| Estudiantes | 25 tests | 80% |
| Padres | 20 tests | 80% |
| Dashboard Admin | 35 tests | 75% |
| API Pública | 50 tests | 85% |

---

### 📅 Semana 15-16: Estabilización y CI/CD

#### Tareas

| ID | Tarea | Prioridad | Horas Est. |
|----|-------|-----------|------------|
| 7.1 | Configurar staging environment | Alta | 6h |
| 7.2 | Implementar health checks | Alta | 4h |
| 7.3 | Configurar monitoring básico | Media | 5h |
| 7.4 | Implementar logging estructurado | Alta | 6h |
| 7.5 | Configurar Vercel preview deployments | Media | 3h |
| 7.6 | Documentar proceso de deploy | Media | 3h |
| 7.7 | Performance testing básico | Media | 6h |
| 7.8 | Review y cierre de fase | Alta | 4h |

---

### 📊 Métricas de Éxito - Fase 2

| KPI | Meta |
|-----|------|
| Cobertura de tests | > 70% |
| Sistema calificaciones | 100% funcional |
| Sistema padres | 100% funcional |
| Tiempo de deploy | < 5 minutos |
| Uptime staging | > 99% |

---

# 📋 FASE 3: Refactorización de Frontend

## Semanas 17-28 (Abril - Junio 2026)

### 🎯 Objetivos de la Fase

- Eliminar 600+ eventos inline (CSP compliance)
- Consolidar archivos JS duplicados
- Implementar multi-tenancy en frontend
- Modernizar estructura de componentes

---

### 📅 Semana 17-20: CSP Compliance

#### Tareas

| ID | Tarea | Horas Est. |
|----|-------|------------|
| 8.1 | Inventariar todos los eventos inline | 4h |
| 8.2 | Crear `event-handler-registry.js` | 8h |
| 8.3 | Migrar páginas principales (index, login) | 12h |
| 8.4 | Migrar páginas de estudiantes | 10h |
| 8.5 | Migrar páginas de admin | 12h |
| 8.6 | Migrar páginas restantes | 16h |
| 8.7 | Verificar CSP en todos los navegadores | 6h |
| 8.8 | Documentar patrón de eventos | 3h |

---

### 📅 Semana 21-24: Consolidación de JS

#### Archivos a Consolidar

```
/js (legacy) → Eliminar
/public/js  → Mantener y organizar

Estructura propuesta:
public/js/
├── core/           # Funcionalidad base
├── components/     # Componentes reutilizables
├── pages/          # Scripts específicos por página
├── utils/          # Utilidades
└── vendor/         # Librerías externas
```

#### Tareas

| ID | Tarea | Horas Est. |
|----|-------|------------|
| 9.1 | Auditar archivos duplicados | 4h |
| 9.2 | Crear estructura de carpetas | 2h |
| 9.3 | Migrar core scripts | 12h |
| 9.4 | Migrar components | 10h |
| 9.5 | Migrar page scripts | 14h |
| 9.6 | Eliminar código muerto | 8h |
| 9.7 | Actualizar imports en HTML | 10h |
| 9.8 | Verificar funcionalidad | 8h |

---

### 📅 Semana 25-28: Multi-tenancy Frontend

#### Tareas

| ID | Tarea | Horas Est. |
|----|-------|------------|
| 10.1 | Implementar `TENANT_CONFIG` completo | 8h |
| 10.2 | Reemplazar 2,300+ referencias hardcoded | 20h |
| 10.3 | Crear sistema de temas por tenant | 12h |
| 10.4 | Implementar assets dinámicos | 8h |
| 10.5 | Testing multi-tenant | 10h |
| 10.6 | Documentar configuración tenant | 4h |

---

### 📊 Métricas de Éxito - Fase 3

| KPI | Meta |
|-----|------|
| Eventos inline | 0 |
| Archivos JS duplicados | 0 |
| Referencias hardcoded | 0 |
| CSP Score | A+ |
| Bundle size reduction | -30% |

---

# 📋 FASE 4: Migración a TypeScript (Backend)

## Semanas 29-45 (Julio - Octubre 2026)

### 🎯 Objetivos de la Fase

- Migrar 100% del backend a TypeScript
- Implementar tipos estrictos
- Mejorar developer experience

---

### 📅 Semana 29-32: Setup y DAOs

#### Setup Inicial

```typescript
// tsconfig.json (backend)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Orden de Migración DAOs

1. `types/models.ts` - Interfaces de modelos
2. `types/database.ts` - Tipos de BD
3. `data/*.dao.ts` - DAOs (44 archivos)

---

### 📅 Semana 33-38: Migración de Servicios

#### Orden de Migración

```
1. Services simples (auth, grades, students)
2. Services medianos (appointments, newsletter)
3. Services complejos (analytics, notifications)
4. Services con WebSocket (realtime, collaboration)
```

---

### 📅 Semana 39-42: Migración de Routes

#### Orden de Migración

```
1. Routes de autenticación
2. Routes de API pública
3. Routes de admin
4. Routes de WebSocket
```

---

### 📅 Semana 43-45: Testing y Optimización

#### Tareas

| ID | Tarea | Horas Est. |
|----|-------|------------|
| 11.1 | Actualizar todos los tests a TS | 20h |
| 11.2 | Configurar ts-jest | 4h |
| 11.3 | Type coverage analysis | 6h |
| 11.4 | Resolver any types | 15h |
| 11.5 | Performance profiling | 8h |
| 11.6 | Documentar tipos públicos | 6h |

---

### 📊 Métricas de Éxito - Fase 4

| KPI | Meta |
|-----|------|
| Archivos TypeScript backend | 100% |
| Strict mode | Habilitado |
| `any` types | < 5% |
| Type coverage | > 90% |
| Build time | < 30s |

---

# 📋 FASE 5: Migración Frontend a TypeScript

## Semanas 46-60 (Noviembre 2026 - Febrero 2027)

### 🎯 Objetivos de la Fase

- Migrar frontend a TypeScript
- Implementar build system moderno
- Documentación completa
- Preparar para producción

---

### 📅 Semana 46-50: Setup y Componentes

#### Build System

```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'public/dist',
    rollupOptions: {
      input: {
        main: 'src/main.ts',
        admin: 'src/admin.ts',
        // ...
      }
    }
  }
});
```

---

### 📅 Semana 51-55: Migración de Scripts

#### Componentes a Migrar

```
1. Core utilities
2. Form handlers
3. Dashboard components
4. Chatbot
5. Search system
6. Calendar
7. Charts/Analytics
```

---

### 📅 Semana 56-58: Testing y QA

#### Checklist de QA

- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Performance audit
- [ ] Security audit
- [ ] SEO audit

---

### 📅 Semana 59-60: Documentación Final

#### Entregables

1. **Technical Documentation**
   - Architecture overview
   - API documentation
   - Database schema
   - Deployment guide

2. **Developer Guide**
   - Setup instructions
   - Coding standards
   - Testing guide
   - Contribution guide

3. **User Documentation**
   - Admin manual
   - Teacher guide
   - Student guide
   - Parent guide

---

### 📊 Métricas de Éxito - Fase 5

| KPI | Meta |
|-----|------|
| TypeScript coverage (frontend) | > 95% |
| Lighthouse score | > 90 |
| Accessibility score | > 95 |
| Documentation completeness | 100% |
| Production ready | ✅ |

---

# 🏁 Resumen de Entregables por Fase

| Fase | Duración | Entregable Principal |
|------|----------|---------------------|
| 1 | 8 semanas | 54 servicios refactorizados + 100 tests |
| 2 | 8 semanas | Sistema calificaciones + padres funcional |
| 3 | 12 semanas | Frontend CSP-compliant + Multi-tenant |
| 4 | 17 semanas | Backend 100% TypeScript |
| 5 | 15 semanas | Frontend TS + Documentación completa |

---

# 📌 Notas Importantes

> ⚠️ **Flexibilidad**: Este plan es una guía. Los tiempos pueden ajustarse según las necesidades reales del proyecto.

> 💡 **Iterativo**: Cada fase incluye una retrospectiva para ajustar el plan de las siguientes fases.

> 🔄 **Priorización**: Las tareas pueden reordenarse si surgen bugs críticos o nuevos requisitos.

---

**Documento creado:** Diciembre 4, 2025  
**Próxima revisión:** Al finalizar Fase 1  
**Responsable:** Equipo de Desarrollo BGE
