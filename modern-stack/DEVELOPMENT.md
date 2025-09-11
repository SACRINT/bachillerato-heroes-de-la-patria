# 🛠️ Guía de Desarrollo - Stack Moderno

## 🚀 Inicio Rápido

```bash
# 1. Configurar entorno de desarrollo
node tools/dev-setup.js

# 2. Iniciar desarrollo
npm run dev

# 3. Abrir en el navegador
# Frontend: http://localhost:4321
# Backend:  http://localhost:3001
```

## 📁 Estructura del Proyecto

```
modern-stack/
├── 📁 apps/
│   ├── 📁 web/              # Frontend Astro
│   │   ├── src/
│   │   │   ├── layouts/     # Layouts base
│   │   │   ├── pages/       # Páginas (.astro)
│   │   │   ├── components/  # Componentes reutilizables
│   │   │   └── styles/      # Estilos globales
│   │   └── public/          # Assets estáticos
│   │
│   └── 📁 api/              # Backend Node.js/Express
│       ├── src/
│       │   ├── routes/      # Rutas de API
│       │   ├── models/      # Modelos de datos
│       │   ├── middleware/  # Middleware personalizado
│       │   └── utils/       # Utilidades
│       └── prisma/          # Esquemas de BD
│
├── 📁 packages/             # Código compartido
│   ├── types/               # Tipos TypeScript
│   ├── ui/                  # Componentes UI
│   ├── utils/               # Utilidades compartidas
│   └── config/              # Configuraciones
│
└── 📁 tools/                # Scripts y herramientas
```

## 🎯 Scripts Disponibles

### Desarrollo
```bash
npm run dev          # Iniciar frontend + backend
npm run dev:web      # Solo frontend (puerto 4321)
npm run dev:api      # Solo backend (puerto 3001)
```

### Construcción
```bash
npm run build        # Construir todo
npm run build:web    # Solo frontend
npm run build:api    # Solo backend
```

### Testing
```bash
npm run test         # Ejecutar todos los tests
npm run test:e2e     # Tests end-to-end
```

### Calidad de código
```bash
npm run lint         # Verificar código
npm run lint:fix     # Corregir automáticamente
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

### Base de datos
```bash
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar esquema a BD
npm run db:studio    # Abrir Prisma Studio
npm run db:migrate   # Crear migración
npm run db:seed      # Poblar con datos iniciales
```

## 🗄️ Configuración de Base de Datos

### Opción 1: PostgreSQL Local
```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Crear base de datos
createdb heroes_patria_dev

# Configurar URL en apps/api/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/heroes_patria_dev?schema=public"

# Aplicar esquema
npm run db:push --workspace=@heroes-patria/api
```

### Opción 2: Docker (Recomendado)
```bash
# Crear docker-compose.yml en la raíz
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: heroes_patria_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Iniciar
docker-compose up -d

# Aplicar esquema
npm run db:push --workspace=@heroes-patria/api
```

### Opción 3: Supabase (Cloud)
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar Database URL
4. Configurar en `apps/api/.env`

## 🎨 Desarrollo Frontend (Astro)

### Crear nueva página
```bash
# Crear: apps/web/src/pages/nueva-pagina.astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Nueva Página">
  <h1>Mi nueva página</h1>
</Layout>
```

### Crear componente
```bash
# Crear: apps/web/src/components/MiComponente.astro
---
export interface Props {
  titulo: string;
  descripcion?: string;
}

const { titulo, descripcion } = Astro.props;
---

<div class="mi-componente">
  <h2>{titulo}</h2>
  {descripcion && <p>{descripcion}</p>}
</div>

<style>
  .mi-componente {
    @apply p-4 bg-white rounded-lg shadow-md;
  }
</style>
```

### Usar en página
```astro
---
import MiComponente from '../components/MiComponente.astro';
---

<Layout title="Página con componente">
  <MiComponente 
    titulo="Hola mundo"
    descripcion="Este es mi componente"
  />
</Layout>
```

## 🔧 Desarrollo Backend (Node.js/Express)

### Crear nueva ruta
```typescript
// apps/api/src/routes/ejemplo.ts
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const CreateExampleSchema = z.object({
  nombre: z.string().min(2).max(50),
  email: z.string().email(),
});

router.post('/ejemplo', async (req, res) => {
  try {
    const data = CreateExampleSchema.parse(req.body);
    
    // Lógica de negocio aquí
    const resultado = await crearEjemplo(data);
    
    res.json({ 
      success: true, 
      data: resultado 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

### Registrar ruta
```typescript
// apps/api/src/index.ts
import ejemploRoutes from './routes/ejemplo.js';

app.use('/api', ejemploRoutes);
```

## 🧪 Testing

### Test de componente (Frontend)
```typescript
// apps/web/src/components/__tests__/MiComponente.test.ts
import { test, expect } from '@playwright/test';

test('MiComponente se renderiza correctamente', async ({ page }) => {
  await page.goto('/test-page');
  
  const titulo = await page.locator('h2');
  await expect(titulo).toHaveText('Hola mundo');
});
```

### Test de API (Backend)
```typescript
// apps/api/src/routes/__tests__/ejemplo.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('POST /api/ejemplo', () => {
  it('debería crear un ejemplo', async () => {
    const response = await request(app)
      .post('/api/ejemplo')
      .send({
        nombre: 'Test',
        email: 'test@example.com'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 🎨 Estilos y Componentes UI

### Sistema de colores
```css
/* Disponible en Tailwind */
bg-primary-500    /* #1976D2 */
bg-secondary-500  /* #FFC107 */
bg-success-500    /* #4CAF50 */
```

### Componentes glassmorphism
```html
<div class="glass p-6 rounded-xl">
  Contenido con efecto vidrio
</div>
```

### Animaciones personalizadas
```html
<div class="animate-fade-in-up">
  Se desliza hacia arriba al aparecer
</div>

<div class="animate-glow">
  Brilla suavemente
</div>
```

## 🔐 Variables de Entorno

### Frontend (.env)
```bash
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_API_URL=http://localhost:3001
PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://..."
JWT_SECRET=your-secret-key
```

## 📱 PWA (Progressive Web App)

El sitio se configura automáticamente como PWA con:
- ✅ Service Worker
- ✅ Manifest.json
- ✅ Instalación desde navegador
- ✅ Funcionamiento offline
- ✅ Push notifications (próximamente)

## 🚀 Despliegue

### Frontend (Vercel)
```bash
npm run build:web
# Deploy automático desde GitHub
```

### Backend (Railway/Render)
```bash
npm run build:api
# Deploy desde Dockerfile o buildpack
```

## 🐛 Debugging

### Frontend
```bash
# Modo desarrollo con inspector
npm run dev:web

# Inspector en VS Code
F5 con configuración de Astro
```

### Backend  
```bash
# Con debugger
npm run dev:api -- --inspect

# En VS Code
F5 con configuración de Node.js
```

## 📊 Performance

### Métricas objetivo
- Lighthouse Performance: 100/100
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

### Herramientas de análisis
```bash
# Análisis de bundle
npm run build:web -- --analyze

# Performance en desarrollo
npm run dev:web -- --inspect
```

## 🔄 Migración desde Legacy

Ver `tools/migrate-from-legacy.js` para scripts de migración automática del código anterior.

---

¿Necesitas ayuda? 
- 📖 [Documentación de Astro](https://docs.astro.build)
- 🚀 [Express.js Docs](https://expressjs.com)
- 📊 [Prisma Docs](https://www.prisma.io/docs)
- 🎨 [Tailwind CSS](https://tailwindcss.com/docs)