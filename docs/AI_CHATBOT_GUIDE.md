# 🤖 GUÍA DEL CHATBOT IA CON GPT-4
**SEMANA 18 - AI Chatbot Inteligente**

Sistema de chatbot académico basado en GPT-4 Turbo con context-aware responses, multi-language support, FAQ integration y analytics completos.

Fecha: 17 Noviembre 2025
Estado: ✅ PRODUCTION-READY
Versión: 1.0.0

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración Inicial](#configuración-inicial)
4. [API Endpoints](#api-endpoints)
5. [Integración Frontend](#integración-frontend)
6. [Base de Conocimiento (FAQs)](#base-de-conocimiento-faqs)
7. [Analytics y Métricas](#analytics-y-métricas)
8. [Troubleshooting](#troubleshooting)
9. [Costos y Optimización](#costos-y-optimización)
10. [Roadmap Futuro](#roadmap-futuro)

---

## 🎯 VISIÓN GENERAL

### ¿Qué es el AI Chatbot?

Un asistente virtual inteligente que ayuda a estudiantes, padres, docentes y administrativos con información académica usando GPT-4 Turbo de OpenAI.

### Características Principales

- ✅ **GPT-4 Turbo Powered:** Respuestas inteligentes y context-aware
- ✅ **Multi-Language Support:** Español e inglés (detección automática)
- ✅ **FAQ Integration:** Base de conocimiento integrada con full-text search
- ✅ **Conversation History:** Historial persistente para usuarios autenticados
- ✅ **Rate Limiting:** 30 mensajes/hora (autenticado), 10/hora (anónimo)
- ✅ **Beautiful UI:** Widget flotante responsive con animaciones
- ✅ **Analytics:** Tracking completo de uso, tokens y costos
- ✅ **Fallback System:** Respuestas de emergencia si OpenAI falla

### Beneficios

**Para Estudiantes:**
- Respuestas instantáneas 24/7
- Información sobre becas, calificaciones, trámites
- Orientación académica personalizada

**Para Administradores:**
- Reduce carga de trabajo de atención al cliente
- Analytics de preguntas frecuentes
- Control de costos de API

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND (User)                         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ai-chatbot-widget.js                            │    │
│  │ - Chat UI (floating widget)                     │    │
│  │ - Message rendering                             │    │
│  │ - Typing indicators                             │    │
│  │ - History loading                               │    │
│  │ - Auto-resize textarea                          │    │
│  └─────────────────────────────────────────────────┘    │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │ HTTPS POST /api/ai-chatbot/message
                         │
┌────────────────────────▼──────────────────────────────────┐
│              BACKEND API (Node.js/Express)                │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ai-chatbot.js (Routes)                          │    │
│  │ - POST /message (send message)                  │    │
│  │ - GET /history (fetch conversation)             │    │
│  │ - POST /faq (admin: create FAQ)                 │    │
│  │ - GET /analytics (admin: metrics)               │    │
│  │ - Rate limiting (30/hr auth, 10/hr anon)        │    │
│  └─────────────────────────────────────────────────┘    │
│                        │                                  │
│  ┌─────────────────────▼──────────────────────────┐     │
│  │ openai-service.js (AI Logic)                   │     │
│  │ - generateChatResponse()                        │     │
│  │ - searchRelevantFAQs() (full-text search)      │     │
│  │ - buildConversationContext()                    │     │
│  │ - getFallbackResponse()                         │     │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
          │                            │
          │ OpenAI API                 │ PostgreSQL
          ▼                            ▼
┌──────────────────┐      ┌────────────────────────────┐
│                  │      │  POSTGRESQL DATABASE       │
│  OPENAI GPT-4    │      │                            │
│  TURBO           │      │  - chat_history            │
│                  │      │  - faqs_chatbot            │
│  Model:          │      │  - chatbot_analytics       │
│  gpt-4-turbo-... │      │  - chatbot_feedback        │
│                  │      │                            │
│  $0.01/1K input  │      │  Full-text search index    │
│  $0.03/1K output │      │  on FAQs (to_tsvector)     │
└──────────────────┘      └────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Obtener API Key de OpenAI

1. Visitar [platform.openai.com](https://platform.openai.com/)
2. Crear cuenta o iniciar sesión
3. Ir a API Keys → Create new secret key
4. Copiar la API key (empieza con `sk-...`)

⚠️ **IMPORTANTE:** Nunca commitas la API key a Git

### 2. Configurar Variables de Entorno

Agregar a `.env`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890...

# Opcional: Configuración avanzada
OPENAI_MODEL=gpt-4-turbo-preview  # Modelo a usar
OPENAI_MAX_TOKENS=800              # Max tokens por respuesta
OPENAI_TEMPERATURE=0.7             # Creatividad (0.0-1.0)
```

### 3. Ejecutar Migración de Base de Datos

```bash
# Conectar a Neon Console o usar psql
psql $DATABASE_URL -f backend/migrations/create-ai-chatbot-tables.sql
```

**Verifica que se crearon:**
```sql
SELECT tablename FROM pg_tables
WHERE tablename IN ('chat_history', 'faqs_chatbot', 'chatbot_analytics', 'chatbot_feedback');
```

Deberías ver 4 tablas.

### 4. Instalar Dependencias

```bash
cd backend
npm install openai
```

### 5. Registrar Rutas en Backend

En `backend/server.js` o `api/app.js`:

```javascript
// Importar rutas
const aiChatbotRoutes = require('./routes/ai-chatbot');

// Registrar
app.use('/api/ai-chatbot', aiChatbotRoutes);

console.log('[SERVER] AI Chatbot routes registered at /api/ai-chatbot');
```

### 6. Incluir Widget en Frontend

En cualquier página HTML (ej: `public/index.html`):

```html
<!-- Antes de </body> -->
<script src="/public/js/ai-chatbot-widget.js" data-auto-init="true" data-position="bottom-right" data-theme="light" data-language="es"></script>
```

**Opciones del widget:**
- `data-auto-init`: "true" (auto-inicializa) o "false" (manual)
- `data-position`: "bottom-right" o "bottom-left"
- `data-theme`: "light" o "dark"
- `data-language`: "es" o "en"

### 7. Reiniciar Servidor

```bash
pm2 restart backend-api
# o
npm run dev
```

### 8. Verificar Health Check

```bash
curl http://localhost:3000/api/ai-chatbot/health
```

Respuesta esperada:
```json
{
  "success": true,
  "service": "ai-chatbot",
  "status": "healthy",
  "checks": {
    "database": "ok",
    "openai_api_key": "configured"
  }
}
```

---

## 🔌 API ENDPOINTS

### USER ENDPOINTS

#### POST /api/ai-chatbot/message

Enviar mensaje al chatbot (con o sin autenticación).

**Request:**
```javascript
POST /api/ai-chatbot/message
Content-Type: application/json
Authorization: Bearer <token> (opcional)

{
  "message": "¿Cómo puedo solicitar una beca?",
  "language": "es", // opcional (default: "es")
  "includeContext": true // opcional (default: true)
}
```

**Response (Success):**
```json
{
  "success": true,
  "response": "¡Claro! Te explico el proceso para solicitar becas 📋\n\n**Requisitos:**\n- Promedio mínimo de 8.0\n- Comprobante de ingresos familiares...",
  "metadata": {
    "model": "gpt-4-turbo-preview",
    "tokens": 245,
    "language": "es",
    "timestamp": "2025-11-17T10:30:00.000Z"
  }
}
```

**Response (Error - Rate Limit):**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Has alcanzado el límite de mensajes por hora. Intenta más tarde.",
  "retryAfter": 3600
}
```

**Rate Limits:**
- Usuarios autenticados: 30 mensajes/hora
- Usuarios anónimos: 10 mensajes/hora

#### GET /api/ai-chatbot/history

Obtener historial de conversación del usuario autenticado.

**Request:**
```javascript
GET /api/ai-chatbot/history?limit=20
Authorization: Bearer <token> (requerido)
```

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "content": "¿Cómo solicito una beca?"
    },
    {
      "role": "assistant",
      "content": "¡Claro! Te explico..."
    }
  ],
  "count": 10
}
```

#### DELETE /api/ai-chatbot/history

Limpiar historial de conversación.

**Request:**
```javascript
DELETE /api/ai-chatbot/history
Authorization: Bearer <token> (requerido)
```

**Response:**
```json
{
  "success": true,
  "message": "Historial de conversación eliminado exitosamente.",
  "deletedCount": 15
}
```

---

### ADMIN ENDPOINTS (FAQ Management)

#### POST /api/ai-chatbot/faq

Crear nuevo FAQ (solo admin/administrativo).

**Request:**
```javascript
POST /api/ai-chatbot/faq
Authorization: Bearer <admin-token> (requerido)
Content-Type: application/json

{
  "pregunta": "¿Cuál es el costo de la colegiatura?",
  "respuesta": "💵 Costos:\n- Inscripción: $3,500 MXN\n- Colegiatura mensual: $1,800 MXN",
  "categoria": "Costos y Pagos",
  "idioma": "es", // opcional (default: "es")
  "activo": true  // opcional (default: true)
}
```

**Response:**
```json
{
  "success": true,
  "faq": {
    "id": 42,
    "pregunta": "¿Cuál es el costo de la colegiatura?",
    "respuesta": "💵 Costos:...",
    "categoria": "Costos y Pagos",
    "idioma": "es",
    "activo": true,
    "created_at": "2025-11-17T10:30:00.000Z"
  },
  "message": "FAQ creado exitosamente."
}
```

#### GET /api/ai-chatbot/faqs

Listar FAQs con filtros (admin/docente).

**Request:**
```javascript
GET /api/ai-chatbot/faqs?categoria=Becas&idioma=es&activo=true&search=solicitar
Authorization: Bearer <admin-token> (requerido)
```

**Query Params:**
- `categoria`: Filtrar por categoría
- `idioma`: "es" o "en"
- `activo`: "true" o "false"
- `search`: Búsqueda de texto en pregunta/respuesta

**Response:**
```json
{
  "success": true,
  "faqs": [
    {
      "id": 5,
      "pregunta": "¿Cómo solicito una beca?",
      "respuesta": "Para solicitar una beca...",
      "categoria": "Becas y Apoyos",
      "idioma": "es",
      "activo": true,
      "prioridad": 9,
      "veces_usado": 42,
      "created_at": "2025-10-01T00:00:00.000Z",
      "updated_at": "2025-11-17T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET /api/ai-chatbot/analytics

Estadísticas de uso del chatbot (admin).

**Request:**
```javascript
GET /api/ai-chatbot/analytics?dateFrom=2025-11-01&dateTo=2025-11-17
Authorization: Bearer <admin-token> (requerido)
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total_messages": 1247,
    "unique_users": 89,
    "total_tokens": 305420,
    "avg_tokens_per_message": 244.8,
    "last_message_at": "2025-11-17T09:45:32.000Z",
    "estimated_cost_usd": "6.1084" // GPT-4 Turbo pricing
  }
}
```

---

## 💻 INTEGRACIÓN FRONTEND

### Uso Básico

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mi Página</title>
</head>
<body>
  <h1>Bachillerato Héroes de la Patria</h1>

  <!-- Auto-init con data attributes -->
  <script
    src="/public/js/ai-chatbot-widget.js"
    data-auto-init="true"
    data-position="bottom-right"
    data-theme="light"
    data-language="es">
  </script>
</body>
</html>
```

### Uso Avanzado (Programático)

```html
<script src="/public/js/ai-chatbot-widget.js"></script>
<script>
  // Esperar a que el DOM cargue
  document.addEventListener('DOMContentLoaded', () => {

    // Crear instancia del chatbot
    const chatbot = new AIChatbotWidget({
      position: 'bottom-right',  // o 'bottom-left'
      theme: 'light',            // o 'dark'
      language: 'es',            // o 'en'
      apiBaseUrl: '/api/ai-chatbot',
      showWelcomeMessage: true,
      enableSoundEffects: false,
      maxHistoryMessages: 50
    });

    // Inicializar
    chatbot.init();

    // Guardar referencia global
    window.aiChatbot = chatbot;
  });
</script>
```

### API del Widget (JavaScript)

```javascript
// Abrir chat programáticamente
window.aiChatbot.toggleChat();

// Enviar mensaje programático
window.aiChatbot.elements.input.value = '¿Cómo solicito una beca?';
window.aiChatbot.sendMessage();

// Agregar mensaje manualmente
window.aiChatbot.addMessage({
  role: 'assistant',
  content: 'Hola, ¿en qué puedo ayudarte?',
  timestamp: new Date()
});

// Cambiar idioma dinámicamente
window.aiChatbot.config.language = 'en';

// Acceder al estado
console.log(window.aiChatbot.state.messages); // Historial de mensajes
console.log(window.aiChatbot.state.isOpen);   // true/false
```

### Personalización de Estilos

El widget inyecta estilos CSS dinámicamente. Para personalizarlos:

```css
/* Sobrescribir colores del header */
.ai-chatbot-header {
  background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%) !important;
}

/* Cambiar colores de mensajes del usuario */
.ai-chatbot-message.user .ai-chatbot-message-bubble {
  background: linear-gradient(135deg, #FA8072 0%, #FF6347 100%) !important;
}

/* Cambiar tamaño del widget */
.ai-chatbot-container {
  width: 450px !important;
  height: 700px !important;
}
```

---

## 📚 BASE DE CONOCIMIENTO (FAQs)

### Estructura de FAQs

```sql
CREATE TABLE faqs_chatbot (
    id SERIAL PRIMARY KEY,
    pregunta VARCHAR(500) NOT NULL,
    respuesta TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    idioma VARCHAR(2) DEFAULT 'es',
    activo BOOLEAN DEFAULT true,
    prioridad INTEGER DEFAULT 0,
    veces_usado INTEGER DEFAULT 0
);
```

### Categorías Recomendadas

1. **Información General** - Horarios, contacto, ubicación
2. **Inscripciones** - Proceso de inscripción, requisitos
3. **Becas y Apoyos** - Tipos de becas, requisitos, cómo solicitar
4. **Calificaciones** - Consulta, escala, apelaciones
5. **Trámites** - Constancias, certificados, credenciales
6. **Calendario Académico** - Fechas importantes, vacaciones
7. **Servicios** - Biblioteca, laboratorios, orientación
8. **Contacto** - Tutores, coordinaciones, departamentos

### Best Practices para FAQs

✅ **DO:**
- Usar emojis para hacer más amigable (📚 📝 ✅ 📅 💵)
- Estructurar con bullet points
- Incluir información de contacto cuando aplique
- Actualizar FAQs basándose en analytics de preguntas frecuentes
- Priorizar FAQs más usadas (mayor valor en `prioridad`)

❌ **DON'T:**
- Respuestas de 1000+ palabras (máximo 500 palabras)
- Información desactualizada
- Datos sensibles o privados
- Lenguaje técnico complejo

### Ejemplo de FAQ Bien Escrito

```sql
INSERT INTO faqs_chatbot (pregunta, respuesta, categoria, prioridad) VALUES
('¿Cómo solicito una beca?',
'Para solicitar una beca:\n\n
1️⃣ Ingresa a Portal Estudiantes > Becas\n
2️⃣ Llena el formulario de solicitud\n
3️⃣ Sube documentos:\n
   - Comprobante de ingresos familiares\n
   - Certificado de calificaciones\n
   - Carta de motivos (1 página)\n
4️⃣ Espera email de confirmación (2-3 días)\n\n
📅 Convocatorias: 1-15 de cada semestre\n
📧 Dudas: becas@bachillerato-heroes.edu.mx',
'Becas y Apoyos',
10);
```

---

## 📊 ANALYTICS Y MÉTRICAS

### Dashboard de Analytics (Admin)

```javascript
// Obtener analytics de los últimos 30 días
fetch('/api/ai-chatbot/analytics?dateFrom=2025-10-17&dateTo=2025-11-17', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('Total mensajes:', data.analytics.total_messages);
  console.log('Usuarios únicos:', data.analytics.unique_users);
  console.log('Costo estimado:', data.analytics.estimated_cost_usd, 'USD');
  console.log('Tokens usados:', data.analytics.total_tokens);
});
```

### Métricas Disponibles

| Métrica | Descripción |
|---------|-------------|
| `total_messages` | Total de mensajes enviados |
| `unique_users` | Usuarios únicos que usaron el chatbot |
| `total_tokens` | Tokens totales consumidos (input + output) |
| `avg_tokens_per_message` | Promedio de tokens por mensaje |
| `estimated_cost_usd` | Costo estimado en USD (GPT-4 Turbo pricing) |
| `last_message_at` | Timestamp del último mensaje |

### Actualización Diaria de Analytics

```sql
-- Ejecutar manualmente o via cron job
SELECT update_chatbot_daily_analytics('2025-11-17');
```

**Resultado en `chatbot_analytics`:**
```sql
SELECT * FROM chatbot_analytics WHERE fecha = '2025-11-17';
```

```
| fecha      | total_conversaciones | total_mensajes | usuarios_unicos | tokens_totales | costo_estimado_usd |
|------------|---------------------|----------------|-----------------|----------------|-------------------|
| 2025-11-17 | 45                  | 182            | 32              | 44,520         | 0.8904            |
```

---

## 🐛 TROUBLESHOOTING

### Error: "OpenAI API key missing"

**Síntoma:**
```json
{
  "success": false,
  "error": "invalid_api_key",
  "message": "Error de configuración. Contacta al administrador."
}
```

**Solución:**
```bash
# 1. Verificar que la API key existe en .env
cat .env | grep OPENAI_API_KEY

# 2. Si no existe, agregarla
echo "OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE" >> .env

# 3. Reiniciar servidor
pm2 restart backend-api
```

---

### Error: Rate Limit Exceeded (OpenAI)

**Síntoma:**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Demasiadas solicitudes. Por favor, intenta en unos segundos."
}
```

**Causa:** Límite de requests a OpenAI API excedido (tier gratuito: 3 RPM).

**Solución:**
1. Upgrade a paid tier en OpenAI ($20 mínimo)
2. Implementar queue con timeout entre requests
3. Usar cache para respuestas frecuentes

---

### Error: FAQs no se buscan correctamente

**Síntoma:** El chatbot no incluye FAQs relevantes en el contexto.

**Diagnóstico:**
```sql
-- Verificar índice de full-text search
SELECT indexname FROM pg_indexes WHERE tablename = 'faqs_chatbot';
-- Debe existir: idx_faqs_fulltext_search
```

**Solución:**
```sql
-- Recrear índice si falta
DROP INDEX IF EXISTS idx_faqs_fulltext_search;
CREATE INDEX idx_faqs_fulltext_search ON faqs_chatbot
USING gin(to_tsvector('spanish', pregunta || ' ' || respuesta));
```

---

### Error: Chat widget no aparece

**Diagnóstico:**
```javascript
// En Chrome DevTools Console
console.log(window.AIChatbotWidget); // Debe existir
console.log(window.aiChatbot);       // Debe ser una instancia
```

**Solución:**
```html
<!-- Verificar que el script está cargado DESPUÉS del DOM -->
<script src="/public/js/ai-chatbot-widget.js" defer></script>

<!-- O usar DOMContentLoaded -->
<script>
document.addEventListener('DOMContentLoaded', () => {
  const chatbot = new AIChatbotWidget();
  chatbot.init();
});
</script>
```

---

## 💰 COSTOS Y OPTIMIZACIÓN

### Pricing de GPT-4 Turbo (Nov 2025)

| Modelo | Input ($/1K tokens) | Output ($/1K tokens) |
|--------|---------------------|----------------------|
| gpt-4-turbo-preview | $0.01 | $0.03 |
| gpt-4 (original) | $0.03 | $0.06 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |

**Ejemplo de costos:**
- 1 conversación promedio: 5 mensajes × 200 tokens = 1,000 tokens = **$0.02**
- 100 usuarios/día × 3 conversaciones = 300 conversaciones = **$6/día** = **$180/mes**

### Optimización de Costos

#### 1. Reducir Max Tokens

```javascript
// En openai-service.js
const DEFAULT_CONFIG = {
  max_tokens: 400, // Reducir de 800 a 400
  // ...
};
```

**Ahorro:** ~50% en tokens de output.

#### 2. Cache de Respuestas Frecuentes

```javascript
const responseCache = new Map();

async function generateChatResponse(userMessage, options) {
  // Check cache first
  const cacheKey = userMessage.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hora
    console.log('[OPENAI] Using cached response');
    return { success: true, response: cached.response };
  }

  // Llamar a OpenAI...
  const response = await openai.chat.completions.create(...);

  // Guardar en cache
  responseCache.set(cacheKey, {
    response: response.choices[0].message.content,
    timestamp: Date.now()
  });

  return response;
}
```

**Ahorro:** 70-80% para preguntas repetidas.

#### 3. Usar FAQs como Respuesta Directa

Si la pregunta matchea exactamente un FAQ, retornar FAQ sin llamar a OpenAI:

```javascript
async function generateChatResponse(userMessage, options) {
  // Buscar FAQ exacto
  const exactMatch = await pool.query(
    'SELECT respuesta FROM faqs_chatbot WHERE LOWER(pregunta) = $1 AND activo = true LIMIT 1',
    [userMessage.toLowerCase()]
  );

  if (exactMatch.rows.length > 0) {
    console.log('[OPENAI] Using direct FAQ match - 0 tokens');
    return { success: true, response: exactMatch.rows[0].respuesta, metadata: { tokens: 0 } };
  }

  // Llamar a OpenAI...
}
```

**Ahorro:** 100% para matches exactos.

---

## 🚀 ROADMAP FUTURO

### v1.1.0 (Q1 2026)

- [ ] **Streaming Responses:** Respuestas en tiempo real (chunk por chunk)
- [ ] **Voice Input:** Grabación de audio con transcripción (Whisper API)
- [ ] **Image Understanding:** Subir capturas de pantalla para soporte visual
- [ ] **Sugerencias Proactivas:** "Quizás te interese saber sobre..."

### v1.2.0 (Q2 2026)

- [ ] **Fine-Tuning:** Modelo GPT-4 fine-tuned específico para el bachillerato
- [ ] **Multi-Agent System:** Agentes especializados (becas, calificaciones, etc.)
- [ ] **Sentiment Analysis:** Detectar frustración y escalar a humano
- [ ] **CRM Integration:** Crear tickets en HubSpot/Zendesk automáticamente

### v1.3.0 (Q3 2026)

- [ ] **Multilingual Expansion:** Portugués, francés, italiano
- [ ] **WhatsApp Integration:** Chatbot vía WhatsApp Business API
- [ ] **Telegram Bot:** Asistente en Telegram
- [ ] **Mobile App:** Widget nativo en app móvil

### v2.0.0 (Q4 2026)

- [ ] **Agentic Workflows:** Chatbot que ejecuta acciones (solicitar becas, agendar citas)
- [ ] **Knowledge Graph:** Base de conocimiento con relaciones semánticas
- [ ] **Predictive Analytics:** "Los estudiantes como tú suelen preguntar sobre..."
- [ ] **Personalization Engine:** Respuestas personalizadas por perfil del usuario

---

## 📝 CHANGELOG

### v1.0.0 - 17 Noviembre 2025

**Initial Release**
- ✅ OpenAI GPT-4 Turbo integration
- ✅ Backend API (8 endpoints)
- ✅ Frontend chat widget (750+ líneas)
- ✅ Database schema (4 tablas)
- ✅ FAQ system con full-text search
- ✅ Rate limiting (30/hr auth, 10/hr anon)
- ✅ Analytics y métricas
- ✅ Multi-language support (es, en)
- ✅ Conversation history para usuarios autenticados
- ✅ Fallback system si OpenAI falla
- ✅ Documentación completa

---

## 📧 SOPORTE

**Documentación Técnica:** Este archivo
**Issues/Bugs:** GitHub Issues
**Email:** dev@bachillerato-heroes.edu.mx
**Slack:** #ai-chatbot channel

---

**Última Actualización:** 17 Noviembre 2025
**Autor:** Claude (Anthropic AI)
**Versión:** 1.0.0
**Estado:** ✅ PRODUCTION-READY
