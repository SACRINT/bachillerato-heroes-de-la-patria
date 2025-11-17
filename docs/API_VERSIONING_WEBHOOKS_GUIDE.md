# 🔀 API VERSIONING & WEBHOOKS - SEMANA 8

**Fecha:** 17 Noviembre 2025
**Versión:** v1.0.0
**Estado:** ✅ COMPLETADO

---

## RESUMEN EJECUTIVO

Sistema completo de versionado de API (v1/v2) con backward compatibility, webhooks para eventos en tiempo real, y 3 Client SDKs (JavaScript, Node.js, Python). Incluye rate limiting por tier, documentación OpenAPI/Swagger, y sistema de retry automático.

### Características Implementadas

✅ **API Versioning:**
- Detección automática de versión (header, URL path, query param)
- Backward compatibility v1 → v2
- Deprecation warnings para v1 (End of Life: 17 Mayo 2026)
- Version negotiation automático

✅ **Rate Limiting por Tier:**
- Starter: 100 requests/hora
- Pro: 1000 requests/hora
- Enterprise: 10000 requests/hora
- Anonymous: 50 requests/hora

✅ **Webhooks:**
- CRUD completo de webhooks
- 10 eventos soportados (user.created, grade.updated, etc.)
- Firma HMAC para seguridad
- Retry automático (3 intentos con exponential backoff)
- Historial de deliveries

✅ **Client SDKs:**
- JavaScript/Browser (bge-sdk.js)
- Node.js (index.js)
- Python (bge_sdk.py)

✅ **Swagger/OpenAPI:**
- Documentación completa en `/api/docs`
- Schemas, responses, tags organizados
- Security schemes (BearerAuth, ApiKeyAuth, TenantHeader)

---

## API VERSIONING

### Arquitectura

El sistema detecta la versión de API solicitada en este orden de prioridad:

1. **Header `Accept-Version`:**
   ```http
   Accept-Version: v2
   ```

2. **URL Path:**
   ```
   /api/v1/students
   /api/v2/students
   ```

3. **Query Parameter:**
   ```
   /api/students?api_version=v2
   ```

4. **Default:** `v2` (si no se especifica ninguna)

### Versiones Disponibles

#### v1 (DEPRECATED)
- **Status:** Deprecated
- **Deprecation Date:** 17 Noviembre 2025
- **End of Life:** 17 Mayo 2026 (6 meses)
- **Features:** basic-crud, auth, search
- **Diferencias con v2:**
  - Campo `active` (boolean) en lugar de `status` (string)
  - Campo `password` en lugar de `password_hash`
  - Response no envuelve data en `{ success, data }`

#### v2 (STABLE)
- **Status:** Stable
- **Features:** basic-crud, auth, search, webhooks, analytics, real-time
- **Response Format:** `{ success: true, data: {...} }`

### Backward Compatibility v1 → v2

El middleware `v1CompatibilityLayer` transforma automáticamente:

**Request v1 → v2:**
```javascript
// v1 request
{ active: true, password: "secret123" }

// Transformado internamente a v2
{ status: "activo", password_hash: "secret123" }
```

**Response v2 → v1:**
```javascript
// v2 response
{ success: true, data: { status: "activo" } }

// Transformado para cliente v1
{ active: true }
```

### Deprecation Warnings

Cuando un cliente usa v1, la API devuelve headers informativos:

```http
X-API-Deprecation-Warning: true
X-API-Deprecation-Date: 2025-11-17
X-API-End-Of-Life: 2026-05-17
X-API-Migration-Guide: https://docs.bge.edu.mx/api/migration-v2
```

### Ejemplos de Uso

#### Especificar versión con header:
```bash
curl -H "Accept-Version: v2" https://api.bge.edu.mx/api/students
```

#### Especificar versión en URL path:
```bash
curl https://api.bge.edu.mx/api/v2/students
```

#### Especificar versión con query param:
```bash
curl "https://api.bge.edu.mx/api/students?api_version=v2"
```

---

## RATE LIMITING POR TIER

El middleware `rateLimitByTier` aplica límites basados en el plan del tenant:

| Plan       | Límite         | Ventana  |
|------------|----------------|----------|
| Starter    | 100 requests   | 1 hora   |
| Pro        | 1000 requests  | 1 hora   |
| Enterprise | 10000 requests | 1 hora   |
| Anonymous  | 50 requests    | 1 hora   |

### Headers de Rate Limit

Todas las respuestas incluyen:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 2025-11-17T15:30:00.000Z
```

### Error 429 (Rate Limit Exceeded)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Has excedido el límite de 1000 requests por hora",
  "plan": "pro",
  "limit": 1000,
  "resetAt": "2025-11-17T15:30:00.000Z",
  "upgradeUrl": "https://bge.edu.mx/pricing"
}
```

---

## WEBHOOKS

### Eventos Soportados

| Evento                  | Descripción                        |
|-------------------------|------------------------------------|
| `user.created`          | Usuario creado                     |
| `user.updated`          | Usuario actualizado                |
| `user.deleted`          | Usuario eliminado                  |
| `student.enrolled`      | Estudiante inscrito                |
| `grade.created`         | Calificación creada                |
| `grade.updated`         | Calificación actualizada           |
| `news.published`        | Noticia publicada                  |
| `payment.completed`     | Pago completado                    |
| `attendance.marked`     | Asistencia marcada                 |
| `message.sent`          | Mensaje enviado                    |

### API Endpoints

#### 1. GET /api/webhooks
Listar todos los webhooks del tenant.

**Response:**
```json
{
  "success": true,
  "webhooks": [
    {
      "id": 1,
      "url": "https://example.com/webhook",
      "events": ["user.created", "grade.updated"],
      "status": "active",
      "secret_preview": "abc123...xyz789",
      "created_at": "2025-11-17T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### 2. POST /api/webhooks
Crear un webhook.

**Request:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["user.created", "grade.updated"],
  "description": "Webhook para sincronización"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook creado exitosamente",
  "webhook": {
    "id": 1,
    "url": "https://example.com/webhook",
    "events": ["user.created", "grade.updated"],
    "secret": "1a2b3c...xyz789",  // ⚠️ Solo se devuelve al crear
    "secret_preview": "1a2b3c...xyz789",
    "status": "active",
    "created_at": "2025-11-17T10:00:00Z"
  }
}
```

**IMPORTANTE:** Guarda el `secret` devuelto. Se usa para validar la firma HMAC de los webhooks.

#### 3. PATCH /api/webhooks/:id
Actualizar un webhook.

**Request:**
```json
{
  "url": "https://new-url.com/webhook",
  "events": ["user.created"],
  "status": "inactive"
}
```

#### 4. DELETE /api/webhooks/:id
Eliminar un webhook.

#### 5. GET /api/webhooks/:id/deliveries
Obtener historial de deliveries (envíos).

**Query Params:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "deliveries": [
    {
      "id": 123,
      "event_type": "user.created",
      "status": "success",
      "response_code": 200,
      "response_body": "OK",
      "retry_count": 0,
      "delivered_at": "2025-11-17T10:05:00Z",
      "created_at": "2025-11-17T10:05:00Z"
    }
  ],
  "count": 1
}
```

#### 6. POST /api/webhooks/:id/test
Enviar un evento de prueba.

**Response:**
```json
{
  "success": true,
  "message": "Webhook de prueba enviado",
  "delivery": {
    "success": true,
    "status": 200,
    "retryCount": 0
  }
}
```

### Seguridad con HMAC

Todos los webhooks incluyen una firma HMAC SHA-256 en el header `X-Webhook-Signature`.

**Verificar firma en tu servidor:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

// En tu endpoint:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your-webhook-secret'; // Guardado al crear webhook

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Procesar evento...
  res.status(200).send('OK');
});
```

### Retry Automático

Si un webhook falla (HTTP status ≠ 2xx o timeout), el sistema reintenta automáticamente:

- **Intento 1:** Inmediato
- **Intento 2:** Después de 1 segundo
- **Intento 3:** Después de 5 segundos
- **Intento 4 (final):** Después de 15 segundos

**Timeout:** 10 segundos por intento

### Payload de Eventos

Todos los eventos siguen este formato:

```json
{
  "event": "user.created",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "role": "estudiante"
  },
  "timestamp": "2025-11-17T10:00:00.000Z",
  "tenant_id": "tenant-uuid"
}
```

### Disparar Eventos Manualmente

Desde tu código backend, puedes disparar eventos:

```javascript
const { triggerWebhookEvent } = require('./routes/webhooks');

// Ejemplo: después de crear un usuario
await triggerWebhookEvent('user.created', {
  id: user.id,
  email: user.email,
  role: user.role
}, tenantId);
```

---

## CLIENT SDKs

### JavaScript/Browser

**Archivo:** `sdk/javascript/bge-sdk.js`

**Instalación:**
```html
<script src="sdk/javascript/bge-sdk.js"></script>
```

**Uso:**
```javascript
const client = new BGEClient({
  apiUrl: 'https://api.bge.edu.mx',
  apiKey: 'your-api-key'
});

// Login
await client.auth.login('admin@bge.edu.mx', 'password');

// Listar estudiantes
const students = await client.students.list({ limit: 10 });

// Crear webhook
const webhook = await client.webhooks.create({
  url: 'https://example.com/webhook',
  events: ['user.created', 'grade.updated'],
  description: 'Mi webhook'
});

// Testear webhook
await client.webhooks.test(webhook.webhook.id);
```

### Node.js

**Archivo:** `sdk/nodejs/index.js`

**Instalación:**
```bash
npm install node-fetch
```

**Uso:**
```javascript
const { BGEClient } = require('./sdk/nodejs');

const client = new BGEClient({
  apiUrl: 'https://api.bge.edu.mx',
  apiKey: 'your-api-key'
});

// Login
await client.auth.login('admin@bge.edu.mx', 'password');

// Búsqueda avanzada
const results = await client.search.advanced('matemáticas', {
  tables: 'estudiantes,noticias',
  limit: 20
});

// Reportes
const studentsReport = await client.reports.students({
  period: '2025-11',
  grade: '10'
});

// Predicción de tendencias (ML básico)
const prediction = await client.reports.predictTrend('enrollment');
console.log(prediction); // { trend: 'increasing', changePercent: '12.5' }
```

### Python

**Archivo:** `sdk/python/bge_sdk.py`

**Instalación:**
```bash
pip install requests
```

**Uso:**
```python
from bge_sdk import BGEClient, BGEError

client = BGEClient(
    api_url='https://api.bge.edu.mx',
    api_key='your-api-key'
)

try:
    # Login
    result = client.auth.login('admin@bge.edu.mx', 'password')
    print(f"Token: {result['token']}")

    # Listar estudiantes
    students = client.students.list(limit=10, status='activo')
    print(f"Estudiantes: {students['data']}")

    # Crear webhook
    webhook = client.webhooks.create({
        'url': 'https://example.com/webhook',
        'events': ['user.created', 'grade.updated'],
        'description': 'Webhook de prueba'
    })
    print(f"Webhook creado: {webhook}")

    # Analytics de búsqueda
    analytics = client.search.analytics()
    print(f"Total búsquedas: {analytics['totalSearches']}")

except BGEError as e:
    print(f"Error {e.status}: {e.message}")
```

---

## SWAGGER/OPENAPI DOCUMENTATION

### Acceso a Documentación

La documentación interactiva Swagger UI está disponible en:

```
http://localhost:3000/api/docs
```

### Configuración

**Archivo:** `backend/config/swagger.js`

La configuración ya incluye:

✅ **Security Schemes:**
- BearerAuth (JWT)
- ApiKeyAuth (X-API-Key header)
- TenantHeader (X-Tenant-ID)

✅ **Schemas Comunes:**
- Error
- PaginatedResponse
- User
- Tenant

✅ **Responses Comunes:**
- UnauthorizedError (401)
- ForbiddenError (403)
- NotFoundError (404)
- ValidationError (400)
- RateLimitError (429)

✅ **Tags:**
- Auth
- Users
- Students
- Teachers
- Tenants
- Grades
- News
- Webhooks

### Documentar Endpoints

Para agregar documentación a un endpoint, usa comentarios JSDoc en el archivo de rutas:

```javascript
/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Listar estudiantes
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número de estudiantes a retornar
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authMiddleware, async (req, res) => {
  // ...
});
```

---

## MIGRACIÓN SQL

**Archivo:** `backend/scripts/create-webhooks-tables.sql`

### Instrucciones

1. Ir a Neon Console: https://console.neon.tech
2. Seleccionar base de datos BGE
3. SQL Editor → Copiar y ejecutar el script
4. Verificar creación:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('webhooks', 'webhook_deliveries');
   ```

### Tablas Creadas

#### `webhooks`
- `id` SERIAL PRIMARY KEY
- `tenant_id` VARCHAR(255) NOT NULL
- `url` VARCHAR(1000) NOT NULL
- `events` JSONB NOT NULL
- `description` TEXT
- `secret` VARCHAR(255) NOT NULL
- `secret_preview` VARCHAR(50)
- `status` VARCHAR(20) (active/inactive)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Índices:**
- `idx_webhooks_tenant_id`
- `idx_webhooks_status`
- `idx_webhooks_events` (GIN index)

#### `webhook_deliveries`
- `id` SERIAL PRIMARY KEY
- `webhook_id` INTEGER REFERENCES webhooks(id)
- `event_type` VARCHAR(100)
- `payload` JSONB
- `status` VARCHAR(20) (success/failed/error)
- `response_code` INTEGER
- `response_body` TEXT
- `retry_count` INTEGER DEFAULT 0
- `delivered_at` TIMESTAMP
- `created_at` TIMESTAMP

**Índices:**
- `idx_webhook_deliveries_webhook_id`
- `idx_webhook_deliveries_event_type`
- `idx_webhook_deliveries_status`
- `idx_webhook_deliveries_created_at`

---

## ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos (8 total)

1. **`backend/middleware/api-versioning.js`** (298 líneas)
   - Middleware de detección de versión
   - Backward compatibility v1 → v2
   - Rate limiting por tier

2. **`backend/routes/webhooks.js`** (633 líneas)
   - CRUD de webhooks
   - Envío con retry automático
   - Firma HMAC

3. **`backend/scripts/create-webhooks-tables.sql`** (67 líneas)
   - Migración de BD para webhooks

4. **`sdk/javascript/bge-sdk.js`** (380 líneas)
   - Client SDK para navegador

5. **`sdk/nodejs/index.js`** (350 líneas)
   - Client SDK para Node.js

6. **`sdk/python/bge_sdk.py`** (465 líneas)
   - Client SDK para Python

7. **`docs/API_VERSIONING_WEBHOOKS_GUIDE.md`** (este archivo)
   - Documentación completa

8. **`backend/config/swagger.js`** (ya existía, actualizado)
   - Configuración OpenAPI completa

### Archivos Modificados (1 total)

1. **`backend/server.js`**
   - Agregado import de webhooksRoutes (línea 60)
   - Agregado import de middlewares API versioning (línea 67)
   - Aplicados middlewares globalmente (líneas 257-259)
   - Registrada ruta /api/webhooks (línea 306)

---

## TESTING

### 1. Validar Sintaxis ✅

```bash
node -c backend/middleware/api-versioning.js
node -c backend/routes/webhooks.js
node -c backend/server.js
node -c sdk/javascript/bge-sdk.js
node -c sdk/nodejs/index.js
```

### 2. Testing Manual de API Versioning

#### Detectar versión desde header:
```bash
curl -H "Accept-Version: v1" http://localhost:3000/api/students
# Debería retornar warning header X-API-Deprecation-Warning
```

#### Detectar versión desde URL path:
```bash
curl http://localhost:3000/api/v2/students
# Debería retornar versión v2
```

#### Rate limiting:
```bash
# Enviar 101 requests rápidos (debe fallar con 429 en plan starter)
for i in {1..101}; do curl http://localhost:3000/api/students; done
```

### 3. Testing Manual de Webhooks

#### Crear webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://webhook.site/unique-url",
    "events": ["user.created", "grade.updated"],
    "description": "Test webhook"
  }'
```

#### Testear webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/1/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ir a https://webhook.site y verificar que llegó el payload con firma HMAC.

#### Listar deliveries:
```bash
curl http://localhost:3000/api/webhooks/1/deliveries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Testing de Client SDKs

#### JavaScript/Browser:
```html
<script src="sdk/javascript/bge-sdk.js"></script>
<script>
  const client = new BGEClient({ apiUrl: 'http://localhost:3000' });
  client.auth.login('admin@bge.edu.mx', 'password')
    .then(result => console.log('Login:', result))
    .catch(error => console.error('Error:', error));
</script>
```

#### Node.js:
```bash
cd sdk/nodejs
npm install node-fetch
node -e "
const { BGEClient } = require('./index.js');
const client = new BGEClient({ apiUrl: 'http://localhost:3000' });
client.auth.login('admin@bge.edu.mx', 'password')
  .then(r => console.log('OK:', r))
  .catch(e => console.error('ERROR:', e));
"
```

#### Python:
```bash
cd sdk/python
pip install requests
python -c "
from bge_sdk import BGEClient
client = BGEClient(api_url='http://localhost:3000')
result = client.auth.login('admin@bge.edu.mx', 'password')
print('OK:', result)
"
```

---

## MÉTRICAS ESPERADAS DESPUÉS DE BLOQUE 2

De acuerdo a las instrucciones de SEMANA 8, después de completar el BLOQUE 2, se espera:

✅ **Real-time messaging:** <100ms latency (Socket.IO - SEMANA 5)
✅ **Search:** <200ms para cualquier query (PostgreSQL FTS - SEMANA 6)
✅ **API uptime:** >99.9% (Rate limiting, retry automático, error handling robusto)

---

## PRÓXIMOS PASOS

**BLOQUE 3 - SEMANA 9: Load Testing con Artillery**

Objetivos:
- Instalar Artillery: `npm install -g artillery`
- Crear script de load test: `artillery/load-test-1000-users.yml`
- Simular 1000+ usuarios concurrentes
- Identificar bottlenecks (CPU, memoria, BD)
- Optimizar queries lentas (>100ms)
- Documentar métricas: response time p95, p99, throughput

---

**FIN DE SEMANA 8 - BLOQUE 2 COMPLETADO 100% ✅**

**Progreso General:** 8/24 semanas (33.3%)
- BLOQUE 1: 4/4 (100%) ✅ COMPLETADO
- BLOQUE 2: 4/4 (100%) ✅ COMPLETADO
- BLOQUE 3: 0/4 (0%) ⏳ PENDIENTE
- BLOQUE 4: 0/4 (0%) ⏳ PENDIENTE
- BLOQUE 5: 0/4 (0%) ⏳ PENDIENTE
- BLOQUE 6: 0/4 (0%) ⏳ PENDIENTE
