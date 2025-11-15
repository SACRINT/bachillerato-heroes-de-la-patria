# 📡 API Endpoints - Sistema de Gamificación

Documentación de referencia rápida de los 14 endpoints REST del sistema de gamificación IACoins.

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT excepto donde se indique lo contrario.

**Header requerido:**
```http
Authorization: Bearer {token}
```

---

## 💰 WALLET ENDPOINTS (5 endpoints)

### 1. GET /api/wallet
Obtener saldo actual del wallet.

**Response:**
```json
{
  "wallet": {
    "user_id": 123,
    "balance": 450,
    "total_earned": 1200,
    "total_spent": 750,
    "total_purchased": 500
  }
}
```

---

### 2. GET /api/wallet/history
Obtener historial de transacciones.

**Query Params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `type` (optional): earn, spend, purchase

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "transaction_type": "earn",
      "amount": 100,
      "balance_after": 450,
      "description": "Completar reto",
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

---

### 3. POST /api/wallet/earn
Ganar IACoins (recompensas, logros).

**Request:**
```json
{
  "amount": 100,
  "description": "Completar reto académico",
  "metadata": {
    "challenge_id": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "new_balance": 550,
  "earned": 100,
  "message": "Has ganado 100 IA Coins"
}
```

---

### 4. POST /api/wallet/spend
Gastar IACoins (compras).

**Request:**
```json
{
  "amount": 50,
  "description": "Compra: Avatar Premium",
  "metadata": {
    "item_id": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "new_balance": 400,
  "spent": 50,
  "message": "Has gastado 50 IA Coins"
}
```

**Error (saldo insuficiente):**
```json
{
  "error": "Saldo insuficiente",
  "current_balance": 30,
  "required": 50,
  "missing": 20
}
```

---

### 5. POST /api/wallet/purchase
Comprar IACoins con dinero real.

**Request:**
```json
{
  "package_id": "popular",
  "payment_method": "stripe",
  "payment_reference": "ch_1234567890"
}
```

**Paquetes válidos:** starter, basic, popular, premium, ultimate

**Response:**
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

## 🏆 CHALLENGES ENDPOINTS (4 endpoints)

### 1. GET /api/challenges
Listar todos los retos disponibles.

**Query Params:**
- `type` (optional): daily, weekly, monthly, special
- `status` (default: active)

**Response:**
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

---

### 2. GET /api/challenges/:id
Obtener detalles de un reto específico.

**Response:**
```json
{
  "challenge": {
    "id": 1,
    "title": "Primera Sesión",
    "description": "Inicia sesión por primera vez en el sistema",
    "instructions": "Solo inicia sesión en la plataforma",
    "challenge_type": "special",
    "difficulty": "easy",
    "reward_iacoins": 50,
    "reward_xp": 100,
    "completion_criteria": {
      "action": "login",
      "count": 1
    },
    "is_completed": false,
    "progress": {}
  },
  "stats": {
    "total_participants": 150,
    "total_completions": 120
  }
}
```

---

### 3. POST /api/challenges/:id/complete
Completar un reto y reclamar recompensas.

**Request:**
```json
{
  "progress": {
    "percentage": 100,
    "details": "Login exitoso"
  }
}
```

**Response:**
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

---

### 4. POST /api/challenges (ADMIN)
Crear un nuevo reto (solo administradores).

**Auth:** Requiere role: admin

**Request:**
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
  "instructions": "Completa 20 ejercicios de álgebra"
}
```

**Response:** HTTP 201 Created
```json
{
  "success": true,
  "challenge": {
    "id": 15,
    "title": "Maestro de Matemáticas"
  },
  "message": "Reto creado exitosamente"
}
```

---

## 🛒 STORE ENDPOINTS (5 endpoints)

### 1. GET /api/store/items
Listar todos los items disponibles en la tienda.

**Query Params:**
- `category` (optional): customization, rewards, power_ups, cosmetics, special
- `is_available` (default: true)

**Response:**
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
    "rewards": [...]
  },
  "summary": {
    "total": 25,
    "categories": ["customization", "rewards", "power_ups"]
  }
}
```

---

### 2. GET /api/store/items/:id
Obtener detalles de un item específico.

**Response:**
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

---

### 3. POST /api/store/purchase
Comprar un item con IACoins.

**Request:**
```json
{
  "item_id": 1
}
```

**Response:**
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

**Validaciones:**
- Item debe existir y estar disponible
- Stock disponible (si aplica)
- Saldo suficiente en wallet
- No exceder max_per_user

---

### 4. GET /api/store/my-items
Obtener items comprados por el usuario.

**Response:**
```json
{
  "items": [
    {
      "purchase_id": 1,
      "purchased_at": "2025-11-15T10:00:00Z",
      "item_id": 1,
      "name": "Avatar Premium",
      "category": "customization",
      "price_iacoins": 50,
      "icon": "🎭"
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

---

### 5. POST /api/store/items (ADMIN)
Crear un nuevo item en la tienda (solo administradores).

**Auth:** Requiere role: admin

**Request:**
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

**Response:** HTTP 201 Created
```json
{
  "success": true,
  "item": {
    "id": 25,
    "name": "Boost XP x3"
  },
  "message": "Item creado exitosamente"
}
```

---

## 📊 Resumen de Endpoints

| Categoría | Método | Endpoint | Autenticación | Descripción |
|-----------|--------|----------|---------------|-------------|
| **Wallet** | GET | /api/wallet | ✅ JWT | Obtener saldo |
| | GET | /api/wallet/history | ✅ JWT | Historial transacciones |
| | POST | /api/wallet/earn | ✅ JWT | Ganar IACoins |
| | POST | /api/wallet/spend | ✅ JWT | Gastar IACoins |
| | POST | /api/wallet/purchase | ✅ JWT | Comprar IACoins |
| **Challenges** | GET | /api/challenges | ✅ JWT | Listar retos |
| | GET | /api/challenges/:id | ✅ JWT | Detalles de reto |
| | POST | /api/challenges/:id/complete | ✅ JWT | Completar reto |
| | POST | /api/challenges | ✅ Admin | Crear reto |
| **Store** | GET | /api/store/items | ✅ JWT | Listar items |
| | GET | /api/store/items/:id | ✅ JWT | Detalles de item |
| | POST | /api/store/purchase | ✅ JWT | Comprar item |
| | GET | /api/store/my-items | ✅ JWT | Inventario usuario |
| | POST | /api/store/items | ✅ Admin | Crear item |

## 🔧 Testing con cURL

```bash
# Obtener saldo
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"

# Listar retos
curl http://localhost:3000/api/challenges \
  -H "Authorization: Bearer YOUR_TOKEN"

# Completar reto
curl -X POST http://localhost:3000/api/challenges/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": {"percentage": 100}}'

# Comprar item
curl -X POST http://localhost:3000/api/store/purchase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 1}'
```

## 📝 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Validación fallida |
| 401 | Unauthorized | Token JWT inválido o faltante |
| 403 | Forbidden | Sin permisos (requiere admin) |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error en servidor |

---

**Versión:** 1.0.0
**Última actualización:** 15 Noviembre 2025
**Estado:** ✅ 14/14 endpoints funcionales
