# 🏛️ ARQUITECTURA OBJETIVO - SAAS MULTITENANT

**Fecha:** 11 de Enero de 2026  
**Versión:** 1.0  
**Estado:** Propuesta  

---

## 🎯 VISIÓN

Transformar BGE ProyectoHP de un sistema monolítico single-tenant a una **Plataforma Educativa SaaS Multitenant** que permita:

1. **Múltiples instituciones** operando en la misma infraestructura
2. **Aislamiento completo** de datos entre tenants
3. **Configuración personalizada** por institución
4. **Escalabilidad horizontal** para crecimiento
5. **Facturación** por institución/plan

---

## 📐 ARQUITECTURA DE ALTO NIVEL

```
                                    ┌─────────────────────────────────┐
                                    │         LOAD BALANCER           │
                                    │      (Vercel Edge / AWS)        │
                                    └───────────────┬─────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
          ┌─────────▼─────────┐         ┌──────────▼──────────┐        ┌───────────▼──────────┐
          │   escuela-a.app   │         │   escuela-b.app     │        │   escuela-c.app      │
          │    (Tenant A)     │         │     (Tenant B)      │        │     (Tenant C)       │
          └─────────┬─────────┘         └──────────┬──────────┘        └───────────┬──────────┘
                    │                               │                               │
                    └───────────────────────────────┼───────────────────────────────┘
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │        API GATEWAY            │
                                    │   ┌─────────────────────┐     │
                                    │   │ Tenant Resolution   │     │
                                    │   │ Authentication      │     │
                                    │   │ Rate Limiting       │     │
                                    │   │ Request Routing     │     │
                                    │   └─────────────────────┘     │
                                    └───────────────┬───────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
          ┌─────────▼─────────┐         ┌──────────▼──────────┐        ┌───────────▼──────────┐
          │   Auth Service    │         │   Academic Service   │        │   Community Service  │
          │                   │         │                      │        │                      │
          │ • Login/Register  │         │ • Grades            │        │ • Forums             │
          │ • Roles/Perms     │         │ • Attendance        │        │ • Messaging          │
          │ • Sessions        │         │ • Schedule          │        │ • Notifications      │
          └─────────┬─────────┘         └──────────┬──────────┘        └───────────┬──────────┘
                    │                               │                               │
                    └───────────────────────────────┼───────────────────────────────┘
                                                    │
                                    ┌───────────────▼───────────────┐
                                    │      DATABASE LAYER           │
                                    │   ┌─────────────────────┐     │
                                    │   │   PostgreSQL        │     │
                                    │   │   + RLS (Row-Level) │     │
                                    │   │   + Partitioning    │     │
                                    │   └─────────────────────┘     │
                                    └───────────────────────────────┘
```

---

## 🔐 MODELO DE AISLAMIENTO

### Estrategia: Row-Level Security (RLS)

**Por qué RLS:**

- Una base de datos, múltiples tenants
- Aislamiento a nivel de query
- Menor costo operativo que DBs separadas
- Escalabilidad demostrada

### Implementación

```sql
-- Tabla de Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'basic',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar tenant_id a todas las tablas
ALTER TABLE usuarios ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE students ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE grades ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- ... todas las tablas

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento
CREATE POLICY tenant_isolation_usuarios ON usuarios
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_students ON students
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Función para establecer tenant
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql;
```

---

## 🌐 RESOLUCIÓN DE TENANT

### Opciones de Resolución

1. **Por Subdominio** (Recomendado)

   ```
   escuela-heroes.bge-platform.com → tenant_id: abc-123
   escuela-libertad.bge-platform.com → tenant_id: def-456
   ```

2. **Por Path**

   ```
   bge-platform.com/heroes/login → tenant_id: abc-123
   bge-platform.com/libertad/login → tenant_id: def-456
   ```

3. **Por Header**

   ```
   X-Tenant-ID: abc-123
   ```

### Middleware de Resolución

```typescript
// backend/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

export const resolveTenant = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        // 1. Extraer tenant de subdominio
        const host = req.hostname;
        const subdomain = host.split('.')[0];
        
        // 2. Buscar tenant en base de datos
        const result = await pool.query(
            'SELECT id, name, config, plan, active FROM tenants WHERE subdomain = $1',
            [subdomain]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Institución no encontrada' 
            });
        }
        
        const tenant = result.rows[0];
        
        if (!tenant.active) {
            return res.status(403).json({ 
                error: 'Institución desactivada' 
            });
        }
        
        // 3. Establecer contexto de tenant
        req.tenant = tenant;
        req.tenantId = tenant.id;
        
        // 4. Establecer en base de datos para RLS
        await pool.query("SELECT set_current_tenant($1)", [tenant.id]);
        
        next();
    } catch (error) {
        console.error('Error resolviendo tenant:', error);
        res.status(500).json({ error: 'Error interno' });
    }
};
```

---

## 🔧 CONFIGURACIÓN POR TENANT

### Estructura de Configuración

```typescript
interface TenantConfig {
    // Branding
    branding: {
        schoolName: string;
        shortName: string;
        logo: string;
        primaryColor: string;
        secondaryColor: string;
    };
    
    // Módulos habilitados
    modules: {
        gamification: boolean;
        iacoins: boolean;
        chatbot: boolean;
        forums: boolean;
        library: boolean;
        parentPortal: boolean;
        teacherPortal: boolean;
    };
    
    // Configuración académica
    academic: {
        gradingScale: 'decimal' | 'letter' | 'percentage';
        minPassingGrade: number;
        periods: number;
        schoolYear: string;
    };
    
    // Configuración de seguridad
    security: {
        mfaRequired: boolean;
        sessionTimeout: number;
        passwordPolicy: 'basic' | 'strong';
    };
    
    // Integraciones
    integrations: {
        googleOAuth: boolean;
        microsoftOAuth: boolean;
        sepConnection: boolean;
    };
}
```

### Uso en Frontend

```javascript
// Cargar configuración de tenant
const tenantConfig = await fetch('/api/config/tenant').then(r => r.json());

// Aplicar branding
document.documentElement.style.setProperty('--primary-color', tenantConfig.branding.primaryColor);
document.title = tenantConfig.branding.schoolName;

// Habilitar/deshabilitar módulos
if (tenantConfig.modules.gamification) {
    loadGamificationModule();
}
```

---

## 👥 MODELO DE USUARIOS

### Jerarquía

```
                    ┌─────────────────┐
                    │  Super Admin    │
                    │ (Plataforma)    │
                    └────────┬────────┘
                             │ Administra múltiples tenants
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│   Tenant A      │ │   Tenant B      │ │   Tenant C      │
│   Admin         │ │   Admin         │ │   Admin         │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
    ┌────┼────┐         ┌────┼────┐         ┌────┼────┐
    │    │    │         │    │    │         │    │    │
   Doc  Est  Pad       Doc  Est  Pad       Doc  Est  Pad
```

### Tabla de Usuarios Actualizada

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    nombre_completo VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Unicidad por tenant
    UNIQUE(tenant_id, email)
);
```

---

## 📦 ESTRUCTURA DE BOUNDED CONTEXTS

### Contextos Identificados

```
backend/
├── contexts/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dao.ts
│   │   └── auth.types.ts
│   │
│   ├── academic/
│   │   ├── grades/
│   │   │   ├── grades.routes.ts
│   │   │   ├── grades.service.ts
│   │   │   └── grades.dao.ts
│   │   ├── attendance/
│   │   └── schedule/
│   │
│   ├── users/
│   │   ├── students/
│   │   ├── teachers/
│   │   └── parents/
│   │
│   ├── community/
│   │   ├── forums/
│   │   ├── messaging/
│   │   └── notifications/
│   │
│   ├── gamification/
│   │   ├── achievements/
│   │   ├── leaderboard/
│   │   └── rewards/
│   │
│   ├── ai/
│   │   ├── chatbot/
│   │   ├── tutor/
│   │   └── analytics/
│   │
│   └── platform/
│       ├── tenants/
│       ├── billing/
│       └── config/
│
├── shared/
│   ├── middleware/
│   ├── utils/
│   └── types/
│
└── infrastructure/
    ├── database/
    ├── cache/
    └── queue/
```

---

## 💰 MODELO DE PLANES

### Planes Propuestos

| Plan | Usuarios | Módulos | Almacenamiento | Precio |
|------|----------|---------|----------------|--------|
| **Basic** | 500 | Core | 5 GB | $X/mes |
| **Standard** | 2,000 | Core + Gamification | 20 GB | $Y/mes |
| **Premium** | 10,000 | Todos | 100 GB | $Z/mes |
| **Enterprise** | Ilimitado | Todos + Custom | Ilimitado | Cotización |

### Módulos por Plan

```
CORE (Todos los planes):
├── Autenticación
├── Estudiantes
├── Calificaciones
├── Asistencia
├── Comunicación básica

GAMIFICATION (Standard+):
├── Puntos e IACoins
├── Logros
├── Ranking
└── Recompensas

AI (Premium+):
├── Chatbot IA
├── Tutor Personalizado
├── Análisis Predictivo
└── Recomendaciones

ADVANCED (Enterprise):
├── API Access
├── Integraciones custom
├── Reportes avanzados
└── Soporte dedicado
```

---

## 🚀 ROADMAP DE MIGRACIÓN

### Fase 1: Fundamentos (Mes 1-2)

- [ ] Crear tabla `tenants`
- [ ] Agregar `tenant_id` a tablas existentes
- [ ] Implementar RLS básico
- [ ] Crear middleware de tenant
- [ ] Migrar tenant actual (Héroes de la Patria)

### Fase 2: Configuración (Mes 2-3)

- [ ] Implementar `TenantConfig`
- [ ] Migrar configuración hardcodeada a DB
- [ ] Crear panel de configuración por tenant
- [ ] Implementar feature flags

### Fase 3: Onboarding (Mes 3-4)

- [ ] Crear flujo de registro de instituciones
- [ ] Implementar provisioning automático
- [ ] Setup inicial (admin, datos base)
- [ ] Documentación para nuevos tenants

### Fase 4: Billing (Mes 4-5)

- [ ] Integrar Stripe/pasarela de pago
- [ ] Implementar planes y límites
- [ ] Dashboard de facturación
- [ ] Reportes de uso

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Objetivo |
|---------|----------|
| Tiempo de onboarding | < 1 hora |
| Aislamiento de datos | 100% verificado |
| Uptime | 99.9% |
| Tiempo de respuesta API | < 200ms p95 |
| Tenants activos | 10+ en 6 meses |

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Fuga de datos entre tenants | Crítico | RLS + Tests automatizados |
| Performance con muchos tenants | Alto | Partitioning + Caching |
| Complejidad de migración | Alto | Migración incremental |
| Compatibilidad hacia atrás | Medio | Versioning de API |

---

**Este documento representa la visión objetivo. La implementación será incremental siguiendo el CLEANUP_PLAN_PHASES.md**
