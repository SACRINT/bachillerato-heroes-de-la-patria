# ⚡ Guía Rápida - Desarrollo del Sistema de Gamificación

Guía de inicio rápido para desarrolladores que trabajen con el sistema de gamificación IACoins.

## 🚀 Setup en 5 Minutos

### 1. Clonar y Instalar (1 min)
```bash
git clone <repo>
cd proyecto-bge
npm install
```

### 2. Configurar Entorno (1 min)
Crear archivo `.env`:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=tu_secret_super_seguro
PORT=3000
NODE_ENV=development
```

### 3. Ejecutar Migración (2 min)
```bash
node backend/scripts/run-gamification-migration.js
```

**Output esperado:**
```
✅ Conexión exitosa
✅ Archivo leído correctamente
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
✅ Todas las tablas creadas correctamente
Retos creados: 5
Items de tienda: 8
```

### 4. Iniciar Servidor (30 seg)
```bash
npm run dev
```

### 5. Verificar (30 seg)
```bash
# Health check
curl http://localhost:3000/api/health

# Testing automatizado
node backend/scripts/test-gamification-endpoints.js
```

---

## 📁 Estructura de Archivos

```
proyecto-bge/
├── backend/
│   ├── routes/
│   │   ├── wallet.js          # 5 endpoints de wallet
│   │   ├── challenges.js      # 4 endpoints de retos
│   │   └── store.js           # 5 endpoints de tienda
│   ├── migrations/
│   │   └── create-gamification-tables.sql  # Schema de BD
│   └── scripts/
│       ├── run-gamification-migration.js   # Script de migración
│       └── test-gamification-endpoints.js  # Suite de tests
├── public/
│   ├── gamification-center.html  # Dashboard principal
│   ├── iacoins-store.html        # Tienda virtual
│   └── challenges.html           # Sistema de retos
└── docs/
    └── SISTEMA-GAMIFICACION-IACOINS-COMPLETO.md  # Docs completa
```

---

## 💡 Conceptos Clave

### 1. IACoins
Moneda virtual del sistema. Los estudiantes las ganan completando retos académicos.

**Flujo:**
```
Reto Completado → POST /api/wallet/earn → Balance aumenta
```

### 2. Wallet
Cada usuario tiene un wallet con:
- `balance`: Saldo actual de IACoins
- `total_earned`: Total ganado por retos
- `total_spent`: Total gastado en tienda
- `total_purchased`: Total comprado con dinero real

### 3. Retos (Challenges)
Desafíos educativos con recompensas.

**Tipos:**
- **daily**: Retos diarios (ej: "Inicia sesión hoy")
- **weekly**: Retos semanales (ej: "Completa 5 tareas")
- **monthly**: Retos mensuales (ej: "Calificación perfecta")
- **special**: Eventos únicos (ej: "Primera sesión")

### 4. Tienda (Store)
Items virtuales que los estudiantes pueden comprar con IACoins.

**Categorías:**
- **customization**: Avatares, temas
- **rewards**: Certificados, insignias
- **power_ups**: Extensiones de tiempo, boosts
- **cosmetics**: Efectos visuales
- **special**: Pases premium

---

## 🔧 Tareas Comunes

### Agregar un Nuevo Reto

```sql
INSERT INTO challenges (
  title,
  description,
  challenge_type,
  difficulty,
  reward_iacoins,
  reward_xp,
  icon,
  instructions
) VALUES (
  'Nuevo Reto',
  'Descripción breve',
  'weekly',
  'medium',
  150,
  300,
  '🎯',
  'Instrucciones detalladas para completar el reto'
);
```

### Agregar un Nuevo Item a la Tienda

```sql
INSERT INTO store_items (
  name,
  description,
  category,
  price_iacoins,
  icon,
  max_per_user,
  metadata
) VALUES (
  'Power Up Especial',
  'Descripción del item',
  'power_ups',
  200,
  '⚡',
  5,
  '{"benefit": "xp_boost", "multiplier": 2}'::jsonb
);
```

### Dar IACoins Manualmente a un Usuario

```bash
curl -X POST http://localhost:3000/api/wallet/earn \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "description": "Regalo de bienvenida"
  }'
```

### Ver Transacciones de un Usuario

```sql
SELECT
  transaction_type,
  amount,
  balance_after,
  description,
  created_at
FROM wallet_history
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Debugging

### Problema: Endpoints retornan 401

**Causa:** Token JWT inválido o faltante

**Solución:**
```javascript
// Verificar token en frontend
const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
console.log('Token:', token);

// Incluir en request
fetch('/api/wallet', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Problema: Saldo insuficiente al comprar

**Causa:** Balance < precio del item

**Solución:**
```sql
-- Verificar saldo actual
SELECT balance FROM wallet WHERE user_id = 123;

-- Dar IACoins manualmente
UPDATE wallet
SET balance = balance + 100,
    total_earned = total_earned + 100
WHERE user_id = 123;
```

### Problema: Reto ya completado

**Causa:** `max_completions` alcanzado

**Solución:**
```sql
-- Ver completaciones actuales
SELECT times_completed, max_completions
FROM user_challenges uc
JOIN challenges c ON uc.challenge_id = c.id
WHERE uc.user_id = 123 AND c.id = 5;

-- Aumentar límite de completaciones
UPDATE challenges
SET max_completions = 999
WHERE id = 5;
```

---

## 📊 Queries Útiles

### Ver Retos Más Populares
```sql
SELECT
  c.title,
  COUNT(*) as completions,
  AVG(c.reward_iacoins) as avg_reward
FROM challenges c
JOIN user_challenges uc ON c.id = uc.challenge_id
WHERE uc.is_completed = true
GROUP BY c.id, c.title
ORDER BY completions DESC
LIMIT 10;
```

### Ver Items Más Vendidos
```sql
SELECT
  si.name,
  COUNT(*) as purchases,
  si.price_iacoins,
  COUNT(*) * si.price_iacoins as total_iacoins
FROM store_items si
JOIN user_items ui ON si.id = ui.item_id
GROUP BY si.id, si.name, si.price_iacoins
ORDER BY purchases DESC
LIMIT 10;
```

### Ver Top Usuarios con Más IACoins
```sql
SELECT
  u.nombre,
  u.email,
  w.balance,
  w.total_earned,
  w.total_spent
FROM wallet w
JOIN usuarios u ON w.user_id = u.id
ORDER BY w.balance DESC
LIMIT 10;
```

### Ver Transacciones del Último Día
```sql
SELECT
  u.nombre,
  wh.transaction_type,
  wh.amount,
  wh.description,
  wh.created_at
FROM wallet_history wh
JOIN usuarios u ON wh.user_id = u.id
WHERE wh.created_at > NOW() - INTERVAL '1 day'
ORDER BY wh.created_at DESC;
```

---

## 🧪 Testing

### Ejecutar Suite Completa
```bash
node backend/scripts/test-gamification-endpoints.js
```

**Output esperado:**
```
🧪 TESTING: SISTEMA GAMIFICACIÓN
========================================
Base URL: http://localhost:3000

📦 WALLET ENDPOINTS
▶ GET /api/wallet - Obtener saldo... ✅ PASÓ
▶ GET /api/wallet/history - Historial... ✅ PASÓ
...

📊 RESUMEN DE TESTING
Total de tests: 14
Pasados: 14 ✅
Fallidos: 0 ❌
🎉 TODOS LOS TESTS PASARON (100%)
```

### Test Individual con cURL

**Wallet:**
```bash
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer TOKEN"
```

**Challenges:**
```bash
curl http://localhost:3000/api/challenges \
  -H "Authorization: Bearer TOKEN"
```

**Store:**
```bash
curl http://localhost:3000/api/store/items \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔒 Seguridad

### CSP (Content Security Policy)
Todas las páginas HTML cumplen con CSP:
- ❌ Sin `onclick` inline
- ❌ Sin `innerHTML` inseguro
- ✅ Event delegation con `data-action`
- ✅ Safe DOM manipulation con `createElement` + `textContent`

### Validaciones Backend

**Todas las rutas validan:**
1. **Autenticación:** JWT token válido
2. **Autorización:** Rol de usuario correcto
3. **Input:** Parámetros requeridos presentes
4. **Negocio:** Saldo suficiente, límites, stock, etc.
5. **Transacciones:** ACID completo (BEGIN/COMMIT/ROLLBACK)

---

## 📚 Recursos

### Documentación
- **SISTEMA-GAMIFICACION-IACOINS-COMPLETO.md** - Documentación exhaustiva
- **API-ENDPOINTS-GAMIFICACION.md** - Referencia de API
- **README-GAMIFICACION.md** - Overview del sistema

### Scripts Útiles
- `backend/scripts/run-gamification-migration.js` - Ejecutar migración
- `backend/scripts/test-gamification-endpoints.js` - Testing automatizado

### Archivos Importantes
- `backend/routes/wallet.js` - Lógica de wallet (412 líneas)
- `backend/routes/challenges.js` - Lógica de retos (337 líneas)
- `backend/routes/store.js` - Lógica de tienda (276 líneas)
- `backend/migrations/create-gamification-tables.sql` - Schema BD (250 líneas)

---

## 💬 FAQs

**Q: ¿Cómo dar IACoins a todos los usuarios?**
```sql
UPDATE wallet SET balance = balance + 100;
INSERT INTO wallet_history (user_id, transaction_type, amount, balance_after, description)
SELECT user_id, 'earn', 100, balance, 'Regalo masivo'
FROM wallet;
```

**Q: ¿Cómo crear un reto temporal (evento)?**
```sql
INSERT INTO challenges (
  title,
  challenge_type,
  starts_at,
  ends_at,
  reward_iacoins
) VALUES (
  'Evento Especial',
  'special',
  NOW(),
  NOW() + INTERVAL '7 days',
  500
);
```

**Q: ¿Cómo resetear progreso de un usuario?**
```sql
-- Resetear retos
UPDATE user_challenges
SET is_completed = false, times_completed = 0, progress = '{}'
WHERE user_id = 123;

-- Resetear wallet (CUIDADO: irreversible)
UPDATE wallet
SET balance = 0, total_earned = 0, total_spent = 0
WHERE user_id = 123;
```

---

**Versión:** 1.0.0
**Última actualización:** 15 Noviembre 2025
**Estado:** ✅ Listo para desarrollo
