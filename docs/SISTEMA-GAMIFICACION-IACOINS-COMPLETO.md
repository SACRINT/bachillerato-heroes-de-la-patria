# 🎮 SISTEMA DE GAMIFICACIÓN IACOINS - DOCUMENTACIÓN COMPLETA

**Versión:** 1.0.0
**Fecha:** 15 Noviembre 2025
**Estado:** ✅ 100% FUNCIONAL
**Autor:** Claude Code

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Frontend](#componentes-frontend)
4. [Componentes Backend](#componentes-backend)
5. [Base de Datos](#base-de-datos)
6. [Endpoints API](#endpoints-api)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Instalación y Configuración](#instalación-y-configuración)
9. [Testing](#testing)
10. [Mantenimiento](#mantenimiento)

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es IACoins?

IACoins es un sistema de gamificación educativa de tipo **learn-to-earn** que permite a los estudiantes:
- Ganar monedas virtuales (IACoins) por completar retos académicos
- Comprar items virtuales en una tienda con IACoins
- Participar en desafíos diarios, semanales y mensuales
- Personalizar su experiencia educativa

### Componentes del Sistema

| Componente | Descripción | Tecnología |
|------------|-------------|------------|
| **Frontend** | 3 páginas HTML interactivas | HTML5 + JavaScript + Bootstrap 5 |
| **Backend** | 14 endpoints REST | Node.js + Express + PostgreSQL |
| **Base de Datos** | 6 tablas relacionales | PostgreSQL (Neon) |
| **Seguridad** | CSP compliant, autenticación JWT | Content Security Policy |

### Métricas del Sistema

- **Líneas de Código:** 2,712 (frontend) + 1,481 (backend) = **4,193 líneas**
- **Endpoints:** 14 REST APIs
- **Páginas:** 3 interfaces de usuario
- **Tablas BD:** 6 tablas relacionales
- **Funciones JS:** 50+ funciones
- **Validaciones:** 30+ validaciones de negocio

---

## 2. ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (CSP)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ gamification-center.html (Dashboard Principal)   │  │
│  │ - Saldo wallet                                   │  │
│  │ - Resumen de retos                              │  │
│  │ - Progreso de nivel                             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ iacoins-store.html (Tienda Virtual)             │  │
│  │ - Paquetes de IACoins                           │  │
│  │ - Catálogo de items                             │  │
│  │ - Carrito de compras                            │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ challenges.html (Sistema de Retos)              │  │
│  │ - Retos disponibles                             │  │
│  │ - Progreso individual                           │  │
│  │ - Historial de completaciones                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ wallet.js    │  │ challenges.js│  │ store.js     │ │
│  │ 5 endpoints  │  │ 4 endpoints  │  │ 5 endpoints  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↓                  ↓                  ↓         │
│  ┌────────────────────────────────────────────────┐    │
│  │      devLogger + authenticateToken             │    │
│  │      Error Handling + Validaciones             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS (PostgreSQL)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ wallet                 │ challenges               │  │
│  │ wallet_history         │ user_challenges          │  │
│  │ store_items            │ user_items               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario → Frontend → Backend → PostgreSQL → Backend → Frontend → Usuario
   ↓         ↓          ↓            ↓          ↓         ↓        ↓
 Click  → Fetch  → Validate  → Query  → Result → JSON → Update DOM
```

---

## 3. COMPONENTES FRONTEND

### 3.1. gamification-center.html

**Propósito:** Dashboard principal del sistema de gamificación

**Funcionalidades:**
- Visualización de saldo de IACoins
- Resumen de retos activos
- Progreso de nivel del estudiante
- Acceso rápido a tienda y retos

**Endpoints Consumidos:**
- `GET /api/wallet` - Obtener saldo actual
- `GET /api/challenges` - Listar retos disponibles

**Características CSP:**
- ✅ Sin inline onclick handlers
- ✅ Event delegation con data-action
- ✅ Safe DOM manipulation (createElement + textContent)

**Código Ejemplo:**
```javascript
// Cargar saldo del wallet
async function refreshWallet() {
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    const response = await fetch('/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    updateWalletUI(data.wallet);
}
```

---

### 3.2. iacoins-store.html

**Propósito:** Tienda virtual para comprar IACoins y items

**Funcionalidades:**
- Compra de paquetes de IACoins con dinero real
- Catálogo de items virtuales (avatares, temas, power-ups)
- Carrito de compras
- Historial de compras

**Endpoints Consumidos:**
- `POST /api/wallet/purchase` - Comprar paquete de IACoins
- `GET /api/store/items` - Listar items disponibles
- `POST /api/store/purchase` - Comprar item con IACoins
- `GET /api/wallet` - Verificar saldo

**Paquetes Disponibles:**
| Paquete | IACoins Base | Bonus | Total | Precio USD |
|---------|--------------|-------|-------|------------|
| Starter | 100 | 0% | 100 | $4.99 |
| Basic | 250 | 10% | 275 | $9.99 |
| Popular | 500 | 20% | 600 | $19.99 |
| Premium | 1,200 | 30% | 1,560 | $39.99 |
| Ultimate | 3,000 | 50% | 4,500 | $89.99 |

**Categorías de Items:**
- **Customization:** Avatares, temas, marcos de perfil
- **Rewards:** Certificados, insignias, reconocimientos
- **Power-ups:** Extensiones de tiempo, boosts de XP
- **Cosmetics:** Efectos visuales, animaciones
- **Special:** Pases premium, accesos exclusivos

---

### 3.3. challenges.html

**Propósito:** Sistema de retos y desafíos educativos

**Funcionalidades:**
- Listado de retos activos (daily, weekly, monthly, special)
- Progreso individual en cada reto
- Completación de retos y reclamación de recompensas
- Filtros por tipo y dificultad

**Endpoints Consumidos:**
- `GET /api/challenges` - Listar todos los retos
- `GET /api/challenges/:id` - Detalles de un reto específico
- `POST /api/challenges/:id/complete` - Completar reto

**Tipos de Retos:**
- **Daily (Diarios):** Retos que se reinician cada día
- **Weekly (Semanales):** Retos que duran una semana
- **Monthly (Mensuales):** Retos mensuales con altas recompensas
- **Special (Especiales):** Eventos únicos o temporales

**Niveles de Dificultad:**
- **Easy:** 10-50 IACoins + 50-200 XP
- **Medium:** 50-150 IACoins + 200-500 XP
- **Hard:** 150-500 IACoins + 500-1000 XP
- **Expert:** 500+ IACoins + 1000+ XP

---

## 4. COMPONENTES BACKEND

### 4.1. wallet.js (5 endpoints)

**Archivo:** `backend/routes/wallet.js` (412 líneas)

#### Endpoint 1: GET /api/wallet
**Descripción:** Obtener saldo actual del wallet

**Autenticación:** ✅ Requerida

**Response Example:**
```json
{
  "wallet": {
    "user_id": 123,
    "balance": 450,
    "total_earned": 1200,
    "total_spent": 750,
    "total_purchased": 500,
    "created_at": "2025-11-15T10:00:00Z",
    "updated_at": "2025-11-15T12:30:00Z"
  }
}
```

#### Endpoint 2: GET /api/wallet/history
**Descripción:** Obtener historial de transacciones

**Autenticación:** ✅ Requerida

**Query Parameters:**
- `limit` (default: 50) - Número de transacciones
- `offset` (default: 0) - Paginación
- `type` (optional) - Filtrar por tipo: earn, spend, purchase

**Response Example:**
```json
{
  "transactions": [
    {
      "id": 1,
      "user_id": 123,
      "transaction_type": "earn",
      "amount": 100,
      "balance_after": 450,
      "description": "Completar reto: Primera Sesión",
      "metadata": {"challenge_id": 1},
      "created_at": "2025-11-15T12:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Endpoint 3: POST /api/wallet/earn
**Descripción:** Ganar IACoins (recompensas, logros, retos)

**Autenticación:** ✅ Requerida

**Request Body:**
```json
{
  "amount": 100,
  "description": "Completar reto académico",
  "metadata": {
    "challenge_id": 5,
    "type": "academic"
  }
}
```

**Validaciones:**
- amount > 0
- description no vacía

**Response Example:**
```json
{
  "success": true,
  "new_balance": 550,
  "earned": 100,
  "message": "Has ganado 100 IA Coins"
}
```

#### Endpoint 4: POST /api/wallet/spend
**Descripción:** Gastar IACoins (compras en tienda)

**Autenticación:** ✅ Requerida

**Request Body:**
```json
{
  "amount": 50,
  "description": "Compra: Avatar Premium",
  "metadata": {
    "item_id": 3,
    "category": "customization"
  }
}
```

**Validaciones:**
- amount > 0
- balance >= amount (saldo suficiente)

**Response Example:**
```json
{
  "success": true,
  "new_balance": 400,
  "spent": 50,
  "message": "Has gastado 50 IA Coins"
}
```

**Error Response (saldo insuficiente):**
```json
{
  "error": "Saldo insuficiente",
  "current_balance": 30,
  "required": 50,
  "missing": 20
}
```

#### Endpoint 5: POST /api/wallet/purchase
**Descripción:** Comprar IACoins con dinero real

**Autenticación:** ✅ Requerida

**Request Body:**
```json
{
  "package_id": "popular",
  "payment_method": "stripe",
  "payment_reference": "ch_1234567890"
}
```

**Paquetes Válidos:** starter, basic, popular, premium, ultimate

**Response Example:**
```json
{
  "success": true,
  "new_balance": 1000,
  "purchased": 600,
  "package": {
    "id": "popular",
    "base_coins": 500,
    "bonus_coins": 100,
    "total_coins": 600
  },
  "message": "¡Compra exitosa! Has recibido 600 IA Coins"
}
```

---

### 4.2. challenges.js (4 endpoints)

**Archivo:** `backend/routes/challenges.js` (337 líneas)

#### Endpoint 1: GET /api/challenges
**Descripción:** Listar todos los retos disponibles

**Autenticación:** ✅ Requerida

**Query Parameters:**
- `type` (optional) - Filtrar por tipo: daily, weekly, monthly, special
- `status` (default: active) - Filtrar por estado

**Response Example:**
```json
{
  "challenges": [
    {
      "id": 1,
      "title": "Primera Sesión",
      "description": "Inicia sesión por primera vez",
      "challenge_type": "special",
      "difficulty": "easy",
      "reward_iacoins": 50,
      "reward_xp": 100,
      "max_completions": 1,
      "icon": "🎯",
      "is_completed": false,
      "progress": {},
      "times_completed": 0
    }
  ],
  "summary": {
    "total": 10,
    "completed": 2,
    "in_progress": 3,
    "available": 5
  }
}
```

#### Endpoint 2: GET /api/challenges/:id
**Descripción:** Obtener detalles de un reto específico

**Autenticación:** ✅ Requerida

**Response Example:**
```json
{
  "challenge": {
    "id": 1,
    "title": "Primera Sesión",
    "description": "Inicia sesión por primera vez en el sistema",
    "instructions": "Solo inicia sesión en la plataforma para completar este reto",
    "challenge_type": "special",
    "difficulty": "easy",
    "reward_iacoins": 50,
    "reward_xp": 100,
    "completion_criteria": {
      "action": "login",
      "count": 1
    },
    "user_challenge_id": null,
    "is_completed": false,
    "progress": {}
  },
  "stats": {
    "total_participants": 150,
    "total_completions": 120
  }
}
```

#### Endpoint 3: POST /api/challenges/:id/complete
**Descripción:** Completar un reto y reclamar recompensas

**Autenticación:** ✅ Requerida

**Request Body:**
```json
{
  "progress": {
    "percentage": 100,
    "details": "Login exitoso"
  }
}
```

**Validaciones:**
- Reto debe estar activo
- No exceder max_completions
- Reto dentro del período válido (starts_at, ends_at)

**Response Example:**
```json
{
  "success": true,
  "challenge": {
    "id": 1,
    "title": "Primera Sesión"
  },
  "rewards": {
    "iacoins": 50,
    "xp": 100
  },
  "message": "¡Reto completado! Has ganado 50 IA Coins y 100 XP"
}
```

**Proceso Interno:**
1. Verifica que el reto exista y esté activo
2. Valida período de tiempo
3. Verifica límite de completaciones
4. Actualiza user_challenges
5. Otorga recompensas al wallet
6. Registra en wallet_history

#### Endpoint 4: POST /api/challenges (ADMIN)
**Descripción:** Crear un nuevo reto (solo administradores)

**Autenticación:** ✅ Requerida (role: admin)

**Request Body:**
```json
{
  "title": "Maestro de Matemáticas",
  "description": "Resuelve 20 ejercicios de álgebra",
  "challenge_type": "weekly",
  "difficulty": "medium",
  "reward_iacoins": 150,
  "reward_xp": 300,
  "max_completions": 1,
  "starts_at": "2025-11-16T00:00:00Z",
  "ends_at": "2025-11-23T23:59:59Z",
  "icon": "📐",
  "completion_criteria": {
    "subject": "mathematics",
    "exercises": 20
  },
  "instructions": "Completa 20 ejercicios de álgebra en la plataforma"
}
```

**Response:** HTTP 201 Created
```json
{
  "success": true,
  "challenge": {
    "id": 15,
    "title": "Maestro de Matemáticas",
    ...
  },
  "message": "Reto creado exitosamente"
}
```

---

### 4.3. store.js (5 endpoints)

**Archivo:** `backend/routes/store.js` (276 líneas)

#### Endpoint 1: GET /api/store/items
**Descripción:** Listar todos los items disponibles en la tienda

**Autenticación:** ✅ Requerida

**Query Parameters:**
- `category` (optional) - Filtrar por categoría
- `is_available` (default: true) - Solo items disponibles

**Response Example:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Avatar Premium",
      "description": "Personaliza tu perfil con avatares exclusivos",
      "category": "customization",
      "price_iacoins": 50,
      "icon": "🎭",
      "is_available": true,
      "stock": null,
      "max_per_user": 1
    }
  ],
  "items_by_category": {
    "customization": [...],
    "rewards": [...],
    "power_ups": [...]
  },
  "summary": {
    "total": 25,
    "categories": ["customization", "rewards", "power_ups", "cosmetics", "special"]
  }
}
```

#### Endpoint 2: GET /api/store/items/:id
**Descripción:** Obtener detalles de un item específico

**Autenticación:** ✅ Requerida

**Response Example:**
```json
{
  "item": {
    "id": 1,
    "name": "Avatar Premium",
    "description": "Personaliza tu perfil con avatares exclusivos",
    "category": "customization",
    "price_iacoins": 50,
    "icon": "🎭",
    "is_available": true,
    "stock": null,
    "max_per_user": 1,
    "metadata": {
      "benefit": "unlock_avatars",
      "avatar_count": 50
    }
  },
  "user_status": {
    "times_purchased": 0,
    "can_purchase": true
  }
}
```

#### Endpoint 3: POST /api/store/purchase
**Descripción:** Comprar un item con IACoins

**Autenticación:** ✅ Requerida

**Request Body:**
```json
{
  "item_id": 1
}
```

**Validaciones:**
- Item debe existir y estar disponible
- Stock disponible (si aplica)
- Saldo suficiente en wallet
- No exceder max_per_user

**Response Example:**
```json
{
  "success": true,
  "item": {
    "id": 1,
    "name": "Avatar Premium",
    "price": 50
  },
  "new_balance": 400,
  "message": "¡Compra exitosa! Has adquirido Avatar Premium"
}
```

**Proceso Interno (Transacción ACID):**
1. BEGIN transaction
2. Verificar item disponible (FOR UPDATE)
3. Validar stock y límites
4. Verificar saldo del wallet
5. Descontar IACoins del wallet
6. Registrar en wallet_history
7. Agregar a user_items
8. Actualizar stock (si aplica)
9. COMMIT transaction

#### Endpoint 4: GET /api/store/my-items
**Descripción:** Obtener items comprados por el usuario

**Autenticación:** ✅ Requerida

**Response Example:**
```json
{
  "items": [
    {
      "purchase_id": 1,
      "purchased_at": "2025-11-15T10:00:00Z",
      "item_id": 1,
      "name": "Avatar Premium",
      "description": "...",
      "category": "customization",
      "price_iacoins": 50,
      "icon": "🎭",
      "metadata": {}
    }
  ],
  "items_by_category": {
    "customization": [...]
  },
  "summary": {
    "total": 5,
    "categories": ["customization", "power_ups"],
    "total_spent": 250
  }
}
```

#### Endpoint 5: POST /api/store/items (ADMIN)
**Descripción:** Crear un nuevo item en la tienda (solo administradores)

**Autenticación:** ✅ Requerida (role: admin)

**Request Body:**
```json
{
  "name": "Boost XP x3",
  "description": "Triplica tus puntos XP durante 3 días",
  "category": "power_ups",
  "price_iacoins": 300,
  "icon": "⚡",
  "stock": 100,
  "max_per_user": 5,
  "metadata": {
    "benefit": "xp_boost",
    "multiplier": 3,
    "duration_days": 3
  }
}
```

**Validaciones:**
- name >= 3 caracteres
- description >= 10 caracteres
- price_iacoins >= 1
- category válida

**Response:** HTTP 201 Created
```json
{
  "success": true,
  "item": {
    "id": 25,
    "name": "Boost XP x3",
    ...
  },
  "message": "Item creado exitosamente"
}
```

---

## 5. BASE DE DATOS

### 5.1. Diagrama de Relaciones

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  usuarios   │◄─────│     wallet       │      │  challenges │
│             │      │                  │      │             │
│ - id (PK)   │      │ - user_id (FK)   │      │ - id (PK)   │
│ - email     │      │ - balance        │      │ - title     │
│ - nombre    │      │ - total_earned   │      │ - type      │
│ - role      │      │ - total_spent    │      │ - rewards   │
└─────────────┘      └──────────────────┘      └─────────────┘
       │                      │                        │
       │                      │                        │
       ▼                      ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ user_challenges  │   │ wallet_history   │   │   store_items    │
│                  │   │                  │   │                  │
│ - user_id (FK)   │   │ - user_id (FK)   │   │ - id (PK)        │
│ - challenge_id   │   │ - type           │   │ - name           │
│ - is_completed   │   │ - amount         │   │ - price_iacoins  │
│ - progress       │   │ - description    │   │ - category       │
└──────────────────┘   └──────────────────┘   └──────────────────┘
                                                       │
                                                       ▼
                                               ┌──────────────────┐
                                               │   user_items     │
                                               │                  │
                                               │ - user_id (FK)   │
                                               │ - item_id (FK)   │
                                               │ - purchased_at   │
                                               └──────────────────┘
```

### 5.2. Tablas Detalladas

#### Tabla: wallet
```sql
CREATE TABLE wallet (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    total_purchased INTEGER NOT NULL DEFAULT 0 CHECK (total_purchased >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columnas:**
- `user_id`: ID del usuario (PK, FK a usuarios)
- `balance`: Saldo actual de IACoins
- `total_earned`: Total ganado por retos/logros
- `total_spent`: Total gastado en tienda
- `total_purchased`: Total comprado con dinero real

**Índices:**
- `idx_wallet_user_id` ON user_id
- `idx_wallet_balance` ON balance

---

#### Tabla: wallet_history
```sql
CREATE TABLE wallet_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'purchase')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columnas:**
- `transaction_type`: earn (ganar), spend (gastar), purchase (comprar)
- `amount`: Cantidad de IACoins
- `balance_after`: Saldo después de la transacción
- `description`: Descripción legible
- `metadata`: Datos adicionales en formato JSON

**Índices:**
- `idx_wallet_history_user_id` ON user_id
- `idx_wallet_history_type` ON transaction_type
- `idx_wallet_history_created` ON created_at DESC

---

#### Tabla: challenges
```sql
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(20) NOT NULL DEFAULT 'special'
        CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    reward_iacoins INTEGER NOT NULL DEFAULT 10 CHECK (reward_iacoins >= 0),
    reward_xp INTEGER NOT NULL DEFAULT 100 CHECK (reward_xp >= 0),
    max_completions INTEGER NOT NULL DEFAULT 1 CHECK (max_completions > 0),
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon VARCHAR(10) DEFAULT '🎯',
    completion_criteria JSONB DEFAULT '{}',
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_challenges_type` ON challenge_type
- `idx_challenges_active` ON is_active
- `idx_challenges_dates` ON (starts_at, ends_at)

---

#### Tabla: user_challenges
```sql
CREATE TABLE user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    progress JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    times_completed INTEGER NOT NULL DEFAULT 0 CHECK (times_completed >= 0),
    UNIQUE(user_id, challenge_id)
);
```

**Índices:**
- `idx_user_challenges_user_id` ON user_id
- `idx_user_challenges_challenge_id` ON challenge_id
- `idx_user_challenges_completed` ON is_completed

---

#### Tabla: store_items
```sql
CREATE TABLE store_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'customization'
        CHECK (category IN ('customization', 'rewards', 'power_ups', 'cosmetics', 'special')),
    price_iacoins INTEGER NOT NULL CHECK (price_iacoins > 0),
    icon VARCHAR(10) DEFAULT '🎁',
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER CHECK (stock IS NULL OR stock >= 0),
    max_per_user INTEGER CHECK (max_per_user IS NULL OR max_per_user > 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_store_items_category` ON category
- `idx_store_items_available` ON is_available
- `idx_store_items_price` ON price_iacoins

---

#### Tabla: user_items
```sql
CREATE TABLE user_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices:**
- `idx_user_items_user_id` ON user_id
- `idx_user_items_item_id` ON item_id
- `idx_user_items_purchased` ON purchased_at DESC

---

## 6. FLUJOS DE USUARIO

### Flujo 1: Completar Reto y Ganar IACoins

```
1. Usuario → Abre challenges.html
2. Sistema → GET /api/challenges (lista retos activos)
3. Usuario → Click en "Ver Detalles" de un reto
4. Sistema → GET /api/challenges/:id (muestra detalles)
5. Usuario → Click en "Completar Reto"
6. Sistema → POST /api/challenges/:id/complete
   ├─ Backend valida reto
   ├─ Backend actualiza user_challenges
   ├─ Backend llama POST /api/wallet/earn (internamente)
   └─ Backend registra en wallet_history
7. Usuario → Recibe notificación: "¡Has ganado 100 IACoins!"
8. Sistema → Actualiza saldo en UI
```

### Flujo 2: Comprar Item con IACoins

```
1. Usuario → Abre iacoins-store.html
2. Sistema → GET /api/wallet (verifica saldo: 450 IACoins)
3. Sistema → GET /api/store/items (lista catálogo)
4. Usuario → Click en "Comprar" item de 50 IACoins
5. Sistema → Valida saldo >= precio (450 >= 50 ✅)
6. Usuario → Confirma compra
7. Sistema → POST /api/store/purchase {item_id: 1}
   ├─ BEGIN transaction
   ├─ Verifica item disponible
   ├─ Descuenta 50 IACoins del wallet
   ├─ Registra en wallet_history (spend)
   ├─ Agrega a user_items
   ├─ COMMIT transaction
8. Usuario → Recibe item en inventario
9. Sistema → Actualiza saldo: 450 → 400 IACoins
```

### Flujo 3: Comprar Paquete de IACoins

```
1. Usuario → Abre iacoins-store.html
2. Usuario → Selecciona paquete "Popular" (600 IACoins por $19.99)
3. Usuario → Elige método de pago (Stripe/MercadoPago)
4. Sistema → Redirige a pasarela de pago
5. Usuario → Completa pago
6. Pasarela → Envía webhook a backend
7. Sistema → POST /api/wallet/purchase
   ├─ Valida payment_reference
   ├─ Actualiza wallet (+600 IACoins)
   ├─ Registra en wallet_history (purchase)
8. Usuario → Recibe 600 IACoins
9. Sistema → Actualiza saldo en UI
```

---

## 7. INSTALACIÓN Y CONFIGURACIÓN

### 7.1. Requisitos Previos

- Node.js >= 16.x
- PostgreSQL >= 14.x
- npm >= 8.x

### 7.2. Variables de Entorno

Crear archivo `.env`:
```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=tu_secret_key_aqui
JWT_EXPIRES_IN=7d

# Entorno
NODE_ENV=development
PORT=3000

# Testing (opcional)
TEST_AUTH_TOKEN=tu_token_de_prueba
```

### 7.3. Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-repo/proyecto-bge.git
cd proyecto-bge

# 2. Instalar dependencias
npm install

# 3. Ejecutar migración SQL
node backend/scripts/run-gamification-migration.js

# 4. Iniciar servidor
npm run dev
```

### 7.4. Verificación

```bash
# Health check
curl http://localhost:3000/api/health

# Listar retos (requiere token)
curl http://localhost:3000/api/challenges \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 8. TESTING

### 8.1. Testing Automatizado

```bash
# Ejecutar suite de tests
node backend/scripts/test-gamification-endpoints.js

# Con token de autenticación
export TEST_AUTH_TOKEN="tu_token_aqui"
node backend/scripts/test-gamification-endpoints.js
```

### 8.2. Testing Manual

**Checklist de Validación:**

- [ ] Migración SQL ejecutada sin errores
- [ ] Servidor backend iniciado sin errores
- [ ] GET /api/wallet retorna 200 o 401
- [ ] GET /api/challenges retorna 200 o 401
- [ ] GET /api/store/items retorna 200 o 401
- [ ] Frontend carga sin errores en console
- [ ] Modal de login funciona correctamente
- [ ] Saldo de wallet se muestra correctamente
- [ ] Retos se listan correctamente
- [ ] Catálogo de tienda se muestra

**Testing de Flujos:**

1. **Flujo de Reto:**
   - Login como estudiante
   - Ir a challenges.html
   - Completar un reto
   - Verificar que IACoins aumentaron

2. **Flujo de Compra:**
   - Verificar saldo inicial
   - Ir a iacoins-store.html
   - Comprar un item
   - Verificar que IACoins disminuyeron
   - Verificar item en inventario

---

## 9. MANTENIMIENTO

### 9.1. Backups

```bash
# Backup de base de datos
pg_dump -h localhost -U user -d dbname > backup_$(date +%Y%m%d).sql

# Backup de tablas específicas
pg_dump -h localhost -U user -d dbname \
  -t wallet -t wallet_history -t challenges -t user_challenges \
  -t store_items -t user_items > gamification_backup.sql
```

### 9.2. Logs y Monitoreo

```bash
# Ver logs del backend
tail -f logs/backend.log

# Monitorear transacciones
SELECT COUNT(*) FROM wallet_history WHERE created_at > NOW() - INTERVAL '1 day';

# Ver retos más populares
SELECT c.title, COUNT(*) as completions
FROM challenges c
JOIN user_challenges uc ON c.id = uc.challenge_id
WHERE uc.is_completed = true
GROUP BY c.id, c.title
ORDER BY completions DESC
LIMIT 10;
```

### 9.3. Actualización de Datos

```sql
-- Agregar nuevo reto
INSERT INTO challenges (title, description, challenge_type, difficulty, reward_iacoins, reward_xp)
VALUES ('Nuevo Reto', 'Descripción', 'weekly', 'medium', 150, 300);

-- Agregar nuevo item
INSERT INTO store_items (name, description, category, price_iacoins, icon)
VALUES ('Power Up Especial', 'Descripción', 'power_ups', 200, '⚡');

-- Actualizar precios
UPDATE store_items SET price_iacoins = 45 WHERE id = 1;
```

---

## 10. TROUBLESHOOTING

### Problema 1: Error de conexión a BD

**Síntoma:** `Error: connect ECONNREFUSED`

**Solución:**
1. Verificar DATABASE_URL en .env
2. Verificar que PostgreSQL esté corriendo
3. Verificar credenciales

### Problema 2: Tests fallan con 401

**Síntoma:** Todos los tests retornan 401 Unauthorized

**Solución:**
```bash
# Configurar token válido
export TEST_AUTH_TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

### Problema 3: Frontend no carga saldo

**Síntoma:** Wallet muestra 0 IACoins

**Solución:**
1. Abrir DevTools Console
2. Verificar error en fetch
3. Verificar token en sessionStorage
4. Verificar que endpoint /api/wallet responda

---

## 📚 REFERENCIAS

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Última actualización:** 15 Noviembre 2025
**Versión del documento:** 1.0.0
**Autor:** Claude Code
**Estado:** ✅ Sistema 100% Funcional
