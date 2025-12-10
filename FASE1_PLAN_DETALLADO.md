# 🚀 FASE 1: Plan de Implementación Detallado

## Completar Refactorización de Servicios + Testing

### Semanas 1-8 (Diciembre 2025 - Enero 2026)

---

## 📋 Índice de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Semana 1-2: Finalizar Servicios](#semana-1-2)
3. [Semana 3-4: Framework de Testing](#semana-3-4)
4. [Semana 5-6: Corrección de Bugs](#semana-5-6)
5. [Semana 7-8: Documentación](#semana-7-8)
6. [Checklist de Entregables](#checklist)

---

## 📊 Resumen Ejecutivo {#resumen-ejecutivo}

| Aspecto | Detalle |
|---------|---------|
| **Duración** | 8 semanas (40 días hábiles) |
| **Horas estimadas** | ~200 horas de desarrollo |
| **Objetivo principal** | 54/54 servicios + 100+ tests |
| **Riesgo principal** | Servicios complejos sin BD |

### Estado Inicial

```
✅ Completados: 51/54 servicios (94%)
⏳ Pendientes:  3 servicios
📊 Tests:       ~5% cobertura
🐛 Bugs:        7 críticos identificados
```

### Estado Meta (Fin de Fase 1)

```
✅ Servicios:   54/54 (100%)
✅ Tests:       100+ unitarios
✅ Coverage:    >50% en DAOs críticos
✅ Bugs:        0 críticos
✅ Docs:        Arquitectura documentada
```

---

## 📅 SEMANA 1-2: Finalizar Servicios Pendientes {#semana-1-2}

### 🎯 Objetivo

Completar el análisis y refactorización de los 3 servicios pendientes.

---

### Día 1-2: AdvancedSecurityService (1114 líneas)

#### Análisis Inicial

```
📁 Archivo: backend/services/AdvancedSecurityService.js
📏 Líneas: 1114
🔍 Tipo: Servicio de seguridad avanzada
```

#### Tareas Específicas

| # | Tarea | Tiempo | Criterio de Éxito |
|---|-------|--------|-------------------|
| 1.1.1 | Leer y analizar todo el archivo | 2h | Entender 100% de la lógica |
| 1.1.2 | Identificar dependencias de BD | 1h | Lista de queries SQL |
| 1.1.3 | Crear `security-advanced.dao.js` si aplica | 3h | DAO con métodos CRUD |
| 1.1.4 | Refactorizar servicio para usar DAO | 4h | Sin pool.query() |
| 1.1.5 | Agregar JSDoc a funciones públicas | 1h | Documentación inline |
| 1.1.6 | Crear 5 tests básicos | 2h | Tests pasando |

#### Preguntas a Responder

- [ ] ¿Usa base de datos o solo memoria?
- [ ] ¿Qué entidades maneja?
- [ ] ¿Hay lógica que pueda extraerse a utilidades?
- [ ] ¿Se puede dividir en servicios más pequeños?

---

### Día 3-4: RealTimeCollaborationService (995 líneas)

#### Análisis Inicial

```
📁 Archivo: backend/services/RealTimeCollaborationService.js
📏 Líneas: 995
🔍 Tipo: Servicio de colaboración en tiempo real
```

#### Tareas Específicas

| # | Tarea | Tiempo | Criterio de Éxito |
|---|-------|--------|-------------------|
| 1.2.1 | Analizar arquitectura WebSocket | 2h | Diagrama de flujo |
| 1.2.2 | Identificar si usa BD o solo memoria | 1h | Decisión documentada |
| 1.2.3 | Si usa BD: crear `collaboration.dao.js` | 3h | DAO funcional |
| 1.2.4 | Refactorizar o documentar decisión | 4h | Código limpio |
| 1.2.5 | Agregar manejo de errores robusto | 2h | Try-catch completos |
| 1.2.6 | Documentar eventos WebSocket | 1h | Lista de eventos |

#### Decisión Esperada

```javascript
// Si es in-memory (probable):
// - Documentar que NO necesita DAO
// - Marcar como "N/A" en checklist
// - Agregar comentarios explicativos

// Si usa BD:
// - Crear collaboration.dao.js
// - Refactorizar igual que otros servicios
```

---

### Día 5: collaborative-editing-service

#### Análisis Inicial

```
📁 Archivo: backend/services/collaborative-editing-service.js
📏 Líneas: ~500 (estimado)
🔍 Tipo: Servicio de edición colaborativa
```

#### Tareas Específicas

| # | Tarea | Tiempo | Criterio de Éxito |
|---|-------|--------|-------------------|
| 1.3.1 | Analizar relación con RealTime service | 1h | Entender dependencias |
| 1.3.2 | Determinar necesidad de DAO | 1h | Decisión documentada |
| 1.3.3 | Refactorizar o documentar | 3h | Código limpio |
| 1.3.4 | Asegurar compatibilidad | 2h | Sin errores |

---

### 📋 Entregables Semana 1-2

| Entregable | Formato | Estado |
|------------|---------|--------|
| Análisis de 3 servicios | Markdown | [ ] |
| DAOs creados (si aplica) | JavaScript | [ ] |
| Servicios refactorizados | JavaScript | [ ] |
| Tests básicos (15) | Jest | [ ] |
| Actualización checklist | Markdown | [ ] |

---

## 📅 SEMANA 3-4: Framework de Testing {#semana-3-4}

### 🎯 Objetivo

Establecer framework de testing robusto con Jest y crear 100+ tests unitarios.

---

### Día 1: Setup Inicial

#### Instalación de Dependencias

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

#### Configuración Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js', '**/*.spec.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/config/**',
    '!backend/scripts/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000
};
```

#### Estructura de Carpetas

```
/tests
├── setup.js                 # Configuración global
├── unit/
│   ├── dao/
│   │   ├── auth.dao.test.js
│   │   ├── grades.dao.test.js
│   │   ├── students.dao.test.js
│   │   ├── tenant.dao.test.js
│   │   └── audit.dao.test.js
│   └── services/
│       ├── auth.service.test.js
│       └── grades.service.test.js
├── integration/
│   ├── auth.test.js
│   └── grades.test.js
└── __mocks__/
    └── database.js
```

---

### Día 2-3: Tests para DAOs Críticos

#### 1. auth.dao.test.js (15 tests)

```javascript
// Ejemplo de estructura de tests
describe('AuthDAO', () => {
  describe('findUserByEmail', () => {
    test('should return user when email exists', async () => {});
    test('should return null when email not found', async () => {});
    test('should handle special characters in email', async () => {});
  });
  
  describe('createUser', () => {
    test('should create user with valid data', async () => {});
    test('should throw error on duplicate email', async () => {});
    test('should hash password before saving', async () => {});
  });
  
  // ... más tests
});
```

#### 2. grades.dao.test.js (12 tests)

| Test | Descripción |
|------|-------------|
| getByStudent | Obtener calificaciones por estudiante |
| getByPeriod | Filtrar por período |
| create | Crear nueva calificación |
| update | Actualizar calificación |
| delete | Eliminar calificación |
| getBulk | Obtener múltiples |
| calculateAverage | Calcular promedio |

#### 3. students.dao.test.js (10 tests)

| Test | Descripción |
|------|-------------|
| findById | Buscar por ID |
| findByMatricula | Buscar por matrícula |
| create | Crear estudiante |
| update | Actualizar datos |
| searchByName | Búsqueda por nombre |

#### 4. tenant.dao.test.js (8 tests)

| Test | Descripción |
|------|-------------|
| getConfig | Obtener configuración |
| updateConfig | Actualizar configuración |
| createTenant | Crear tenant |

#### 5. audit.dao.test.js (10 tests)

| Test | Descripción |
|------|-------------|
| logAction | Registrar acción |
| getByUser | Obtener por usuario |
| getByDateRange | Filtrar por fechas |
| cleanup | Limpiar registros antiguos |

---

### Día 4-5: Tests para Servicios de Auth

#### auth.service.test.js (20 tests)

```javascript
describe('AuthService', () => {
  describe('login', () => {
    test('should return token on valid credentials', async () => {});
    test('should throw on invalid password', async () => {});
    test('should throw on non-existent user', async () => {});
    test('should lock account after 5 failed attempts', async () => {});
  });
  
  describe('register', () => {
    test('should create user and send verification email', async () => {});
    test('should validate email format', async () => {});
    test('should enforce password policy', async () => {});
  });
  
  describe('verifyToken', () => {
    test('should return user for valid token', async () => {});
    test('should throw for expired token', async () => {});
    test('should throw for tampered token', async () => {});
  });
});
```

---

### Día 6-7: Mock de Database

#### Crear Mock de Pool

```javascript
// tests/__mocks__/database.js
const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
};

// Helper para configurar respuestas
mockPool.mockQueryResponse = (response) => {
  mockPool.query.mockResolvedValueOnce({ rows: response });
};

mockPool.mockQueryError = (error) => {
  mockPool.query.mockRejectedValueOnce(error);
};

module.exports = { pool: mockPool };
```

---

### Día 8: CI/CD con GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

### 📋 Entregables Semana 3-4

| Entregable | Cantidad | Estado |
|------------|----------|--------|
| jest.config.js | 1 | [ ] |
| tests/setup.js | 1 | [ ] |
| Tests de DAOs | 55 | [ ] |
| Tests de Services | 30 | [ ] |
| Mocks de BD | 1 | [ ] |
| GitHub Actions | 1 | [ ] |
| Coverage > 50% | ✓ | [ ] |

---

## 📅 SEMANA 5-6: Corrección de Bugs Críticos {#semana-5-6}

### 🎯 Objetivo

Resolver todos los bugs críticos identificados en la auditoría.

---

### Bug 1: Console.log expone datos sensibles (GDPR) ⚠️ CRÍTICO

#### Archivos Afectados (15+)

```
backend/services/auth.service.js
backend/services/email.service.js
backend/routes/auth.routes.js
backend/routes/admin.routes.js
... y más
```

#### Solución: DevLogger Condicional

```javascript
// backend/utils/devLogger.js - YA CREADO
const devLogger = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  // Siempre ocultar datos sensibles
  logSafe: (message, data) => {
    const safe = { ...data };
    delete safe.password;
    delete safe.token;
    delete safe.email;
    if (process.env.NODE_ENV === 'development') {
      console.log(message, safe);
    }
  }
};
```

#### Tareas

| # | Tarea | Tiempo | Estado |
|---|-------|--------|--------|
| 5.1.1 | Buscar todos console.log con datos | 1h | [ ] |
| 5.1.2 | Reemplazar con devLogger | 4h | [ ] |
| 5.1.3 | Agregar .logSafe para auth | 2h | [ ] |
| 5.1.4 | Verificar en producción | 1h | [ ] |

---

### Bug 2: Dashboard 500 errors en /api/avisos/stats

#### Análisis

```
Error: 500 Internal Server Error
Endpoint: /api/avisos/stats
Causa probable: Tabla no existe o query mal formada
```

#### Tareas

| # | Tarea | Tiempo | Estado |
|---|-------|--------|--------|
| 5.2.1 | Verificar existencia de tabla avisos | 0.5h | [ ] |
| 5.2.2 | Crear migración si no existe | 1h | [ ] |
| 5.2.3 | Corregir query en avisos.routes.js | 1.5h | [ ] |
| 5.2.4 | Agregar manejo de errores | 1h | [ ] |

---

### Bug 3: Subscriber growth chart no funciona

#### Tareas

| # | Tarea | Tiempo | Estado |
|---|-------|--------|--------|
| 5.3.1 | Verificar endpoint /api/stats/growth | 1h | [ ] |
| 5.3.2 | Corregir query de crecimiento | 1.5h | [ ] |
| 5.3.3 | Actualizar dashboard-stats.js | 0.5h | [ ] |

---

### Bug 4: Forms muestran error falso

#### Archivos Afectados

```
public/bolsa-trabajo.html
public/js/bolsa-trabajo-events.js
```

#### Tareas

| # | Tarea | Tiempo | Estado |
|---|-------|--------|--------|
| 5.4.1 | Revisar validación de formulario | 1h | [ ] |
| 5.4.2 | Corregir lógica de validación | 1h | [ ] |
| 5.4.3 | Probar todos los campos | 0.5h | [ ] |

---

### Bug 5: Upload de archivos no funcional

#### Endpoint Faltante

```
POST /api/upload
Funcionalidad: Subir archivos adjuntos
Estado: No implementado
```

#### Tareas

| # | Tarea | Tiempo | Estado |
|---|-------|--------|--------|
| 5.5.1 | Instalar multer | 0.5h | [ ] |
| 5.5.2 | Crear upload.routes.js | 2h | [ ] |
| 5.5.3 | Configurar validaciones (tipo, tamaño) | 1h | [ ] |
| 5.5.4 | Integrar con Cloudinary o local | 2h | [ ] |
| 5.5.5 | Probar en formularios | 0.5h | [ ] |

---

### Bug 6: Rango de años dinámico

#### Archivos Afectados

```
public/bolsa-trabajo.html (línea ~150)
public/egresados.html
```

#### Solución

```javascript
// Generar años dinámicamente
function generateYearOptions(startYear = 1950) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y);
  }
  return years;
}
```

---

### 📋 Entregables Semana 5-6

| Bug | Severidad | Estado |
|-----|-----------|--------|
| GDPR console.log | Crítica | [ ] |
| Dashboard 500 | Alta | [ ] |
| Growth chart | Media | [ ] |
| Form error | Media | [ ] |
| File upload | Alta | [ ] |
| Year range | Baja | [ ] |
| Chatbot button | Media | [✅] |

---

## 📅 SEMANA 7-8: Documentación y Consolidación {#semana-7-8}

### 🎯 Objetivo

Documentar completamente la arquitectura y cerrar la fase.

---

### Documentos a Crear/Actualizar

#### 1. ARCHITECTURE.md

```markdown
# Arquitectura BGE Héroes de la Patria

## Visión General
[Diagrama de alto nivel]

## Stack Tecnológico
- Backend: Node.js + Express
- BD: PostgreSQL
- Frontend: HTML/JS/CSS
- Deploy: Vercel

## Patrones Utilizados
- Service Layer + DAO
- Event Bus
- Repository Pattern

## Estructura de Carpetas
[Árbol de directorios]
```

#### 2. API.md (OpenAPI)

```yaml
openapi: 3.0.0
info:
  title: BGE API
  version: 1.0.0
paths:
  /api/auth/login:
    post:
      summary: Login de usuario
      # ...
```

#### 3. DATABASE.md

```markdown
# Esquema de Base de Datos

## Diagrama ER
[Mermaid diagram]

## Tablas Principales
- users
- students
- grades
- tenants
```

---

### 📋 Entregables Semana 7-8

| Documento | Páginas Est. | Estado |
|-----------|--------------|--------|
| ARCHITECTURE.md | 10 | [ ] |
| API.md (OpenAPI) | 20 | [ ] |
| DATABASE.md | 8 | [ ] |
| CONTRIBUTING.md | 5 | [ ] |
| README actualizado | 3 | [ ] |
| CHANGELOG.md | 2 | [ ] |
| Diagramas Mermaid | 5 | [ ] |

---

## ✅ CHECKLIST FINAL DE FASE 1 {#checklist}

### Servicios

- [ ] AdvancedSecurityService analizado/refactorizado
- [ ] RealTimeCollaborationService analizado/refactorizado
- [ ] collaborative-editing-service analizado/refactorizado
- [ ] Checklist 54/54 actualizado

### Testing

- [ ] Jest configurado
- [ ] 55+ tests de DAOs
- [ ] 30+ tests de Services
- [ ] 20+ tests de integración
- [ ] Coverage > 50%
- [ ] CI/CD funcionando

### Bugs

- [ ] GDPR logs corregido
- [ ] Dashboard sin 500s
- [ ] Upload funcional
- [ ] Forms validando correctamente
- [ ] Chatbot visible ✅

### Documentación

- [ ] ARCHITECTURE.md completo
- [ ] API documentada
- [ ] README actualizado
- [ ] Diagramas creados

### Métricas Finales

| Métrica | Meta | Actual |
|---------|------|--------|
| Servicios | 54/54 | 51/54 |
| Tests | 100+ | 0 |
| Coverage | > 50% | ~5% |
| Bugs críticos | 0 | 6 |
| Docs | 100% | 30% |

---

**📅 Próxima Revisión:** Al completar Semana 8  
**🎯 Siguiente Fase:** Estabilización y Testing Avanzado (Semanas 9-16)
