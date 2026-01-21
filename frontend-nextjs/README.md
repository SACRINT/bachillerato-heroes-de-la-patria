# BGE Héroes de la Patria - Frontend Next.js

Frontend moderno desarrollado con Next.js 14, TypeScript y TailwindCSS para la plataforma educativa BGE Héroes de la Patria.

## 🚀 Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Realtime:** Socket.io Client

## 📁 Estructura del Proyecto

```
frontend-nextjs/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de registro
│   │   ├── dashboard/         # Dashboard protegido
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Estilos globales
│   │
│   ├── components/            # Componentes reutilizables
│   │   └── providers.tsx      # React Query provider
│   │
│   ├── lib/                   # Utilidades
│   │   └── api-client.ts      # Cliente HTTP configurado
│   │
│   ├── store/                 # State management (Zustand)
│   │   └── auth.store.ts      # Store de autenticación
│   │
│   └── types/                 # TypeScript types
│
├── public/                    # Assets estáticos
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🏃 Comenzar a Desarrollar

### 1. Instalar Dependencias

```bash
cd frontend-nextjs
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BGE Héroes de la Patria
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## 📦 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica tipos de TypeScript

## 🎨 Características Implementadas

### ✅ Fase 1 Completada

- [x] Configuración base de Next.js 14
- [x] TypeScript configurado
- [x] TailwindCSS con tema personalizado
- [x] React Query (TanStack Query)
- [x] Zustand para state management
- [x] Axios con interceptors
- [x] Homepage moderna y responsive
- [x] Sistema de autenticación completo
  - [x] Página de login
  - [x] Página de registro
  - [x] Auth store con persistencia
  - [x] Password strength meter
  - [x] Validación de formularios

### 🔲 Siguientes Fases

- [ ] Dashboard de estudiantes
- [ ] Dashboard de docentes
- [ ] Dashboard de admin
- [ ] Sistema de gamificación UI
- [ ] Portal de padres
- [ ] Torneos y competencias
- [ ] Labs virtuales
- [ ] Chat en tiempo real

## 🔐 Arquitectura de Autenticación

El sistema de autenticación utiliza:

1. **Zustand** para state management
2. **localStorage** para persistencia
3. **JWT** para tokens de autenticación
4. **Axios interceptors** para agregar token automáticamente

### Flujo de Autenticación

```typescript
// 1. Usuario hace login
await useAuthStore.getState().login(email, password);

// 2. Token se guarda en store y localStorage
localStorage.setItem('auth_token', token);

// 3. Todas las requests incluyen el token automáticamente
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// 4. Si token expira (401), redirige a login
router.push('/login');
```

## 🎨 System de Diseño

### Colores Principales

```typescript
primary: {
  500: '#1976D2',  // Color principal BGE
  600: '#1565c0',  // Hover state
}
```

### Componentes Base

- `btn` - Botones con variantes
- `card` - Tarjetas con shadow
- `container` - Container responsive

## 📱 Responsive Design

El frontend es completamente responsive:

- **Mobile:** 320px - 767px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px+

## 🔗 Integración con Backend

El frontend se conecta al backend en:

- **Desarrollo:** `http://localhost:3000`
- **Producción:** URL configurada en `NEXT_PUBLIC_API_URL`

### Endpoints Utilizados

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrarse
- `GET /api/students/profile` - Perfil del estudiante
- `GET /api/grades/student/:id` - Calificaciones
- (más endpoints conforme se implementen)

## 🚀 Deploy a Producción

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno en Vercel Dashboard
NEXT_PUBLIC_API_URL=https://tu-backend.vercel.app
```

### Build Manual

```bash
npm run build
npm run start
```

## 🧪 Testing (Próximamente)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 📄 Licencia

© 2026 BGE Héroes de la Patria

---

**Estado:** ✅ Fase 1 completada (Sistema de autenticación)  
**Próximo:** Fase 2 - Dashboard de estudiantes
