# 🔔 GUÍA COMPLETA: SOCKET.IO REAL-TIME NOTIFICATIONS - SEMANA 5

**Fecha:** 17 Noviembre 2025
**Versión:** v2.0.0
**Estado:** ✅ COMPLETADO E INTEGRADO

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Creados](#componentes-creados)
4. [Guía de Uso - Backend](#guía-de-uso---backend)
5. [Guía de Uso - Frontend](#guía-de-uso---frontend)
6. [API Reference - Endpoints](#api-reference---endpoints)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Próximos Pasos](#próximos-pasos)

---

## 1. RESUMEN EJECUTIVO

Sistema completo de notificaciones en tiempo real implementado con Socket.IO para el proyecto BGE. Permite comunicación bidireccional entre servidor y clientes conectados con las siguientes capacidades:

### Características Principales

✅ **Notificaciones en Tiempo Real:**
- Envío a usuario individual
- Envío por rol (admin, docente, estudiante, padre)
- Broadcast a todos los usuarios
- Envío por tenant (multi-tenancy)

✅ **Autenticación JWT:**
- Tokens verificados en handshake
- Auto-join a rooms por usuario/rol/tenant

✅ **Presence Detection:**
- Tracking de usuarios online/offline
- Eventos de conexión/desconexión

✅ **Typing Indicators:**
- Indicadores de "está escribiendo"
- Útil para chat y mensajería

✅ **Historial de Notificaciones:**
- Persistencia en Redis
- Recuperable por usuario

✅ **UI Integration:**
- Modal de notificaciones con animaciones
- Connection status indicator
- Audio notifications
- Desktop notifications (Web Notifications API)

### Métricas de Implementación

| Métrica | Valor |
|---------|-------|
| **Archivos Creados** | 3 |
| **Líneas de Código** | ~1,425 |
| **Endpoints API** | 7 |
| **Event Handlers** | 10+ |
| **Tiempo de Implementación** | 4 horas |

---

## 2. ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                     SOCKET.IO ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     WebSocket      ┌──────────────────┐      │
│  │   BROWSER   │ <─────────────────> │   HTTP SERVER    │      │
│  │  (CLIENT)   │                     │  (Node.js +      │      │
│  │             │                     │   Express)       │      │
│  │ socket-     │                     │                  │      │
│  │ client.js   │                     │  ┌────────────┐  │      │
│  │             │                     │  │ SocketService│  │      │
│  │ - Connect   │                     │  │            │  │      │
│  │ - Auth JWT  │                     │  │ - Rooms    │  │      │
│  │ - Listeners │                     │  │ - Events   │  │      │
│  │ - UI        │                     │  │ - Presence │  │      │
│  └─────────────┘                     │  │ - History  │  │      │
│         ↓                            │  └────────────┘  │      │
│         │                            │         ↓         │      │
│  ┌─────────────┐                    │  ┌────────────┐  │      │
│  │ EVENTS      │                     │  │   REDIS    │  │      │
│  ├─────────────┤                     │  │  (Cache +  │  │      │
│  │ - connect   │                     │  │  History)  │  │      │
│  │ - notification│                   │  └────────────┘  │      │
│  │ - typing    │                     │                  │      │
│  │ - presence  │                     │  ┌────────────┐  │      │
│  │ - disconnect│                     │  │  ROUTES    │  │      │
│  └─────────────┘                     │  │ (API       │  │      │
│                                       │  │  Endpoints)│  │      │
│                                       │  └────────────┘  │      │
│                                       └──────────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos - Enviar Notificación

```
1. Ruta API recibe request → POST /api/notifications-realtime/send-to-user
2. Middleware de autenticación verifica JWT
3. Controller extrae req.app.socketService
4. socketService.sendToUser(userId, event, data)
5. Socket.IO identifica cliente conectado por userId
6. Socket.IO emite evento 'notification' al cliente
7. Cliente recibe evento en listener
8. Cliente muestra UI de notificación
9. Cliente reproduce sonido
10. Cliente dispara evento custom para otros modules
11. Redis guarda notificación en historial
```

### Rooms Strategy

Socket.IO usa **rooms** para agrupar conexiones:

- `user:123` - Room para usuario específico (ID = 123)
- `role:admin` - Room para todos los admins
- `role:docente` - Room para todos los docentes
- `tenant:5` - Room para todos los usuarios del tenant 5

**Auto-Join:** Cuando un usuario se conecta, automáticamente se une a sus rooms correspondientes basado en JWT.

---

## 3. COMPONENTES CREADOS

### 3.1. Socket Service (Backend)

**Archivo:** `backend/services/socket-service.js`
**Líneas:** 375
**Responsabilidad:** Servicio centralizado de Socket.IO

**Funciones Públicas:**

```javascript
class SocketService {
    constructor(httpServer) // Inicializa Socket.IO con HTTP server

    // ENVÍO DE NOTIFICACIONES
    sendToUser(userId, event, data) // A usuario específico
    sendToRole(role, event, data) // A todos los de un rol
    sendToTenant(tenantId, event, data) // A todos los de un tenant
    broadcastToAll(event, data) // A todos conectados

    // PRESENCE & TRACKING
    getOnlineUsers() // Lista de usuarios online
    isUserOnline(userId) // Check si usuario está online

    // HISTORIAL
    saveNotificationToHistory(userId, notification) // Guarda en Redis
    getNotificationHistory(userId, limit) // Recupera de Redis
}
```

**Eventos Emitidos por el Servidor:**

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `notification` | `{type, message, from, metadata, timestamp}` | Notificación general |
| `user_presence` | `{userId, status}` | Usuario conectó/desconectó |
| `online_users` | `[userIds]` | Lista de usuarios online |
| `user_typing` | `{userId, room}` | Usuario está escribiendo |
| `user_stopped_typing` | `{userId, room}` | Usuario dejó de escribir |
| `room_joined` | `{room}` | Usuario se unió a room |
| `room_left` | `{room}` | Usuario salió de room |
| `error` | `{message}` | Error del servidor |

**Eventos Escuchados del Cliente:**

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `send_notification` | `{to, type, message, metadata}` | Cliente envía notificación |
| `join_room` | `room: string` | Unirse a room específico |
| `leave_room` | `room: string` | Salir de room |
| `typing` | `{room}` | Indicar que está escribiendo |
| `stop_typing` | `{room}` | Dejó de escribir |

### 3.2. Socket Client (Frontend)

**Archivo:** `public/js/socket-client.js`
**Líneas:** 650+
**Responsabilidad:** Cliente Socket.IO con UI integration

**Clase Principal:**

```javascript
class SocketClient {
    constructor() // Auto-inicializa conexión

    // CONEXIÓN
    init() // Conectar con token JWT
    disconnect() // Desconectar manualmente
    reconnect() // Reconectar manualmente

    // NOTIFICACIONES
    displayNotification(notification) // Muestra modal
    playNotificationSound() // Reproduce audio

    // API PÚBLICA
    sendNotification(to, message, type, metadata) // Enviar
    joinRoom(room) // Unirse a room
    leaveRoom(room) // Salir de room
    typing(room) // Indicar typing
    stopTyping(room) // Stop typing
}
```

**Custom Events Disparados:**

El cliente dispara custom events en `document` para desacoplamiento:

```javascript
// Escuchar en tu código:
document.addEventListener('socketConnected', (e) => {
    console.log('Socket conectado:', e.detail.socketId);
});

document.addEventListener('socketDisconnected', (e) => {
    console.log('Socket desconectado:', e.detail.reason);
});

document.addEventListener('notificationReceived', (e) => {
    const notification = e.detail;
    // Tu lógica aquí...
});

document.addEventListener('userPresence', (e) => {
    const { userId, status } = e.detail;
    // Actualizar UI de presencia...
});
```

**UI Components Incluidos:**

- ✅ `.notifications-container` - Container flotante top-right
- ✅ `.notification` - Card de notificación con animación slide-in
- ✅ `.socket-status` - Indicador de conexión (bottom-right)
- ✅ `.presence-indicator` - Indicador de usuario online/offline

### 3.3. API Routes (Backend)

**Archivo:** `backend/routes/notifications-realtime.js`
**Líneas:** 400+
**Responsabilidad:** Endpoints REST para gestionar notificaciones

**Endpoints Implementados:**

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/send-to-user` | ✅ | Enviar a usuario específico |
| POST | `/send-to-role` | ✅ | Enviar a rol |
| POST | `/broadcast` | ✅ Admin | Broadcast a todos |
| POST | `/send-to-tenant` | ✅ | Enviar a tenant |
| GET | `/history/:userId` | ✅ | Historial de notificaciones |
| GET | `/online-users` | ✅ Admin | Usuarios conectados |
| POST | `/example` | ✅ | Test endpoint |

---

## 4. GUÍA DE USO - BACKEND

### 4.1. Inicialización del Servidor

El servidor ya está configurado en `backend/server.js` (líneas 435-459):

```javascript
// Crear HTTP Server
const httpServer = http.createServer(app);

// Inicializar Socket.IO
let socketService = null;
try {
    socketService = new SocketService(httpServer);
    app.socketService = socketService; // Disponible en rutas
    console.log('[SOCKET.IO] ✅ Servicio inicializado');
} catch (error) {
    console.error('[SOCKET.IO] ❌ Error:', error.message);
}

// Iniciar servidor
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
    if (socketService) {
        console.log(`📡 Socket.IO escuchando`);
    }
});
```

**Notas:**
- No necesitas modificar nada, ya está integrado
- Si Socket.IO falla, el servidor continuará funcionando
- `socketService` está disponible como `req.app.socketService` en todas las rutas

### 4.2. Enviar Notificaciones desde Rutas

**Ejemplo 1: Notificación Simple**

```javascript
// En cualquier ruta (ej: backend/routes/calificaciones.js)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        // Tu lógica de negocio...
        const calificacion = await crearCalificacion(req.body);

        // Enviar notificación al estudiante
        if (req.app.socketService) {
            await req.app.socketService.sendToUser(
                calificacion.estudiante_id,
                'notification',
                {
                    type: 'info',
                    message: `Nueva calificación publicada: ${calificacion.materia}`,
                    from: {
                        email: req.user.email,
                        role: req.user.role
                    },
                    metadata: {
                        calificacion_id: calificacion.id,
                        materia: calificacion.materia,
                        valor: calificacion.calificacion
                    },
                    timestamp: new Date().toISOString()
                }
            );
        }

        res.json({ success: true, calificacion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Ejemplo 2: Notificación por Rol**

```javascript
// Notificar a todos los docentes
router.post('/asignar-curso', authMiddleware, async (req, res) => {
    try {
        const curso = await asignarCurso(req.body);

        // Notificar a todos los docentes
        if (req.app.socketService) {
            await req.app.socketService.sendToRole(
                'docente',
                'notification',
                {
                    type: 'success',
                    message: `Nuevo curso asignado: ${curso.nombre}`,
                    from: { email: 'Sistema BGE', role: 'system' },
                    metadata: { curso_id: curso.id },
                    timestamp: new Date().toISOString()
                }
            );
        }

        res.json({ success: true, curso });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Ejemplo 3: Broadcast a Todos**

```javascript
// Mantenimiento programado
router.post('/mantenimiento', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Broadcast a todos
        if (req.app.socketService) {
            await req.app.socketService.broadcastToAll(
                'notification',
                {
                    type: 'warning',
                    message: 'Mantenimiento programado en 5 minutos. Guarda tu trabajo.',
                    from: { email: 'Sistema BGE', role: 'system' },
                    metadata: { downtime_minutes: 5 },
                    timestamp: new Date().toISOString()
                }
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 4.3. Verificar Usuarios Online

```javascript
// Obtener usuarios conectados
router.get('/online-status', authMiddleware, async (req, res) => {
    try {
        if (!req.app.socketService) {
            return res.status(503).json({ error: 'Socket.IO no disponible' });
        }

        const onlineUsers = req.app.socketService.getOnlineUsers();

        res.json({
            success: true,
            count: onlineUsers.length,
            users: onlineUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check si usuario específico está online
router.get('/is-online/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        if (!req.app.socketService) {
            return res.status(503).json({ error: 'Socket.IO no disponible' });
        }

        const isOnline = req.app.socketService.isUserOnline(parseInt(userId));

        res.json({
            success: true,
            userId: parseInt(userId),
            isOnline
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 5. GUÍA DE USO - FRONTEND

### 5.1. Cargar el Cliente en HTML

El cliente se auto-inicializa. Solo necesitas cargar los scripts:

```html
<!-- En tu página HTML -->

<!-- 1. Socket.IO CDN -->
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js" defer></script>

<!-- 2. Socket Client -->
<script src="/js/socket-client.js" defer></script>

<!-- 3. (Opcional) Connection Status Indicator -->
<div id="socket-connection-status"></div>
```

**Nota:** `socket-client.js` se inicializa automáticamente cuando el DOM está listo.

### 5.2. Acceder al Cliente Global

```javascript
// El cliente está disponible globalmente
const client = window.socketClient;

// Verificar si está conectado
if (client && client.connected) {
    console.log('Socket conectado:', client.socket.id);
}
```

### 5.3. Escuchar Notificaciones

```javascript
// Escuchar evento custom de notificación recibida
document.addEventListener('notificationReceived', (event) => {
    const notification = event.detail;

    console.log('Nueva notificación:', notification);
    console.log('Tipo:', notification.type); // info, success, warning, error
    console.log('Mensaje:', notification.message);
    console.log('De:', notification.from.email);
    console.log('Metadata:', notification.metadata);

    // Tu lógica personalizada aquí
    if (notification.type === 'warning') {
        // Guardar datos en localStorage?
        // Mostrar dialog modal?
        // Actualizar UI específica?
    }
});
```

### 5.4. Enviar Notificaciones desde Frontend

```javascript
// Enviar notificación a otro usuario
window.socketClient.sendNotification(
    123, // userId destinatario
    'Hola! Te envié los documentos que pediste.', // mensaje
    'message', // tipo
    { // metadata opcional
        documento_id: 456,
        url: '/documentos/456'
    }
);
```

### 5.5. Join/Leave Rooms

```javascript
// Unirse a un room (ej: chat de curso)
window.socketClient.joinRoom('curso:matematicas-101');

// Salir del room
window.socketClient.leaveRoom('curso:matematicas-101');
```

### 5.6. Typing Indicators

```javascript
// En un textarea de chat
const textarea = document.getElementById('chat-input');

textarea.addEventListener('input', () => {
    window.socketClient.typing('chat:general');

    // Debounce para stop typing
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        window.socketClient.stopTyping('chat:general');
    }, 1000);
});

// Escuchar cuando otros usuarios escriben
document.addEventListener('userTyping', (e) => {
    const { email, room } = e.detail;
    console.log(`${email} está escribiendo en ${room}`);
    // Mostrar indicador "Usuario está escribiendo..."
});

document.addEventListener('userStoppedTyping', (e) => {
    const { email, room } = e.detail;
    // Ocultar indicador
});
```

### 5.7. Presence Indicators

El cliente actualiza automáticamente los indicadores de presencia en el DOM:

```html
<!-- En tu HTML, agrega data-user-id -->
<div class="user-card" data-user-id="123">
    <span class="presence-indicator"></span>
    <span class="user-name">Juan Pérez</span>
</div>
```

El CSS ya está incluido en `socket-client.js`:
- `.presence-online` → Verde con glow
- `.presence-offline` → Gris

---

## 6. API REFERENCE - ENDPOINTS

### 6.1. POST /api/notifications-realtime/send-to-user

Enviar notificación a usuario específico.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
    "userId": 123,
    "type": "info",
    "message": "Tu solicitud ha sido aprobada",
    "metadata": {
        "solicitud_id": 456,
        "url": "/solicitudes/456"
    }
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Notificación enviada exitosamente",
    "userId": 123,
    "type": "info"
}
```

### 6.2. POST /api/notifications-realtime/send-to-role

Enviar notificación a todos los usuarios de un rol.

**Body:**
```json
{
    "role": "docente",
    "type": "success",
    "message": "Nueva convocatoria disponible",
    "metadata": {
        "convocatoria_id": 789
    }
}
```

**Roles Válidos:**
- `admin`
- `docente`
- `estudiante`
- `padre`

### 6.3. POST /api/notifications-realtime/broadcast

Enviar notificación a TODOS los usuarios conectados. **Solo admins.**

**Body:**
```json
{
    "type": "warning",
    "message": "Mantenimiento programado en 10 minutos"
}
```

### 6.4. POST /api/notifications-realtime/send-to-tenant

Enviar notificación a todos los usuarios de un tenant.

**Body:**
```json
{
    "tenantId": 5,
    "type": "info",
    "message": "Nuevas políticas de privacidad"
}
```

### 6.5. GET /api/notifications-realtime/history/:userId

Obtener historial de notificaciones.

**Query Params:**
- `limit` (opcional): Número de notificaciones (default: 50, max: 100)

**Response 200:**
```json
{
    "success": true,
    "userId": 123,
    "count": 15,
    "notifications": [
        {
            "type": "info",
            "message": "...",
            "from": { "email": "...", "role": "..." },
            "metadata": {},
            "timestamp": "2025-11-17T12:00:00.000Z"
        },
        // ... más notificaciones
    ]
}
```

### 6.6. GET /api/notifications-realtime/online-users

Obtener usuarios conectados. **Solo admins.**

**Response 200:**
```json
{
    "success": true,
    "count": 42,
    "users": [123, 124, 125, ...] // Array de userIds
}
```

### 6.7. POST /api/notifications-realtime/example

Endpoint de prueba. Envía notificación al usuario autenticado.

**Response 200:**
```json
{
    "success": true,
    "message": "Notificación de prueba enviada"
}
```

---

## 7. EJEMPLOS DE USO

### Ejemplo 1: Notificar Aprobación de Solicitud

**Escenario:** Admin aprueba solicitud de estudiante.

**Backend:**
```javascript
// backend/routes/solicitudes.js
router.post('/aprobar/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Lógica de negocio
        const solicitud = await aprobarSolicitud(id);

        // Notificar al estudiante
        if (req.app.socketService) {
            await req.app.socketService.sendToUser(
                solicitud.estudiante_id,
                'notification',
                {
                    type: 'success',
                    message: `Tu solicitud de ${solicitud.tipo} ha sido aprobada`,
                    from: {
                        id: req.user.id,
                        email: req.user.email,
                        role: req.user.role
                    },
                    metadata: {
                        solicitud_id: solicitud.id,
                        tipo: solicitud.tipo,
                        url: `/solicitudes/${solicitud.id}`
                    },
                    timestamp: new Date().toISOString()
                }
            );
        }

        res.json({ success: true, solicitud });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Frontend (Estudiante):**
```javascript
// El estudiante conectado recibe automáticamente:
document.addEventListener('notificationReceived', (e) => {
    const notif = e.detail;

    if (notif.metadata && notif.metadata.solicitud_id) {
        // Actualizar tabla de solicitudes en tiempo real
        updateSolicitudesTable(notif.metadata.solicitud_id, 'aprobada');

        // Reproducir sonido de éxito
        playSuccessSound();

        // Badge en nav (incrementar contador)
        updateNotificationBadge();
    }
});
```

### Ejemplo 2: Chat en Tiempo Real

**Frontend (Usuario A):**
```javascript
// Unirse al room del chat
window.socketClient.joinRoom('chat:curso-matematicas');

// Enviar mensaje
function sendMessage() {
    const message = document.getElementById('chat-input').value;

    // Vía API REST (persiste en BD)
    fetch('/api/chat/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            room: 'curso-matematicas',
            message: message
        })
    });

    // Indicar que dejó de escribir
    window.socketClient.stopTyping('chat:curso-matematicas');
}

// Typing indicator
document.getElementById('chat-input').addEventListener('input', (e) => {
    window.socketClient.typing('chat:curso-matematicas');

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        window.socketClient.stopTyping('chat:curso-matematicas');
    }, 1000);
});
```

**Backend:**
```javascript
// backend/routes/chat.js
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { room, message } = req.body;

        // Guardar mensaje en BD
        const chatMessage = await saveChatMessage({
            room,
            message,
            user_id: req.user.id
        });

        // Broadcast a todos en el room
        if (req.app.socketService) {
            req.app.socketService.io
                .to(`room:${room}`)
                .emit('chat_message', {
                    id: chatMessage.id,
                    message: chatMessage.message,
                    from: {
                        id: req.user.id,
                        email: req.user.email,
                        nombre: req.user.nombre
                    },
                    timestamp: chatMessage.created_at
                });
        }

        res.json({ success: true, chatMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Frontend (Usuario B - Recibe):**
```javascript
// Escuchar mensajes del chat
window.socketClient.socket.on('chat_message', (data) => {
    addMessageToChat({
        id: data.id,
        message: data.message,
        from: data.from.nombre,
        timestamp: data.timestamp
    });

    // Reproducir sonido si la ventana no tiene foco
    if (!document.hasFocus()) {
        playChatSound();
    }
});
```

### Ejemplo 3: Live Dashboard Updates

**Escenario:** Dashboard de administración muestra estadísticas en tiempo real.

**Backend (Cuando se crea un nuevo estudiante):**
```javascript
// backend/routes/students.js
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const student = await createStudent(req.body);

        // Notificar a todos los admins conectados
        if (req.app.socketService) {
            await req.app.socketService.sendToRole(
                'admin',
                'dashboard_update',
                {
                    entity: 'estudiantes',
                    action: 'create',
                    data: {
                        total_estudiantes: await getTotalEstudiantes(),
                        nuevos_hoy: await getEstudiantesHoy()
                    }
                }
            );
        }

        res.json({ success: true, student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Frontend (Dashboard de Admin):**
```javascript
// Escuchar actualizaciones del dashboard
window.socketClient.socket.on('dashboard_update', (update) => {
    if (update.entity === 'estudiantes') {
        // Actualizar gráficas sin recargar página
        updateChart('estudiantes', update.data);

        // Animar contador
        animateCounter('total-estudiantes', update.data.total_estudiantes);
        animateCounter('nuevos-hoy', update.data.nuevos_hoy);
    }
});
```

---

## 8. TESTING

### 8.1. Testing Manual - Endpoint de Prueba

1. **Iniciar servidor:**
```bash
cd backend
node server.js
```

2. **Abrir 2 navegadores (o ventanas incógnito):**
   - Navegador A: Login como Admin
   - Navegador B: Login como Estudiante

3. **En Navegador A (Admin), ejecutar:**
```javascript
// En la consola del navegador
fetch('/api/notifications-realtime/example', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(d => console.log(d));
```

4. **Verificar:**
   - ✅ Modal de notificación aparece en Navegador A
   - ✅ Sonido de notificación se reproduce
   - ✅ Connection status indica "● Online"

5. **Test de broadcast (Solo Admin):**
```javascript
fetch('/api/notifications-realtime/broadcast', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        type: 'warning',
        message: 'TEST: Broadcast a todos los usuarios'
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

6. **Verificar:**
   - ✅ Navegador A recibe notificación
   - ✅ Navegador B recibe notificación
   - ✅ Ambos muestran modal con mensaje de broadcast

### 8.2. Testing de Reconexión

1. **En consola del navegador:**
```javascript
// Forzar desconexión
window.socketClient.disconnect();

// Verificar status: debe mostrar "● Offline"
```

2. **Esperar 5 segundos y verificar:**
   - ✅ Connection status cambia a "● Reconnecting..."
   - ✅ Después de unos segundos: "● Online"
   - ✅ Console muestra: `[Socket Client] Connected to server: <socketId>`

### 8.3. Testing de Presence

1. **En Navegador A, consultar usuarios online:**
```javascript
fetch('/api/notifications-realtime/online-users', {
    headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    }
})
.then(r => r.json())
.then(d => console.log('Usuarios online:', d.users));
```

2. **En Navegador B, desconectar:**
```javascript
window.socketClient.disconnect();
```

3. **En Navegador A, volver a consultar:**
```javascript
// Debería ver menos usuarios en la lista
```

### 8.4. Testing de Historial

1. **Enviar varias notificaciones a un usuario:**
```javascript
// Enviar 5 notificaciones
for (let i = 1; i <= 5; i++) {
    fetch('/api/notifications-realtime/send-to-user', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: 123, // Reemplazar con userId real
            type: 'info',
            message: `Notificación de prueba #${i}`
        })
    });
}
```

2. **Consultar historial:**
```javascript
fetch('/api/notifications-realtime/history/123?limit=10', {
    headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
    }
})
.then(r => r.json())
.then(d => console.log('Historial:', d.notifications));
```

3. **Verificar:**
   - ✅ Debe retornar las 5 notificaciones
   - ✅ Ordenadas por timestamp (más reciente primero)

---

## 9. TROUBLESHOOTING

### Problema 1: "Socket.IO not loaded"

**Síntoma:**
```
[Socket Client] socket.io-client not loaded. Add <script src="..."></script>
```

**Solución:**
1. Verificar que Socket.IO CDN esté cargado ANTES de socket-client.js:
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js" defer></script>
<script src="/js/socket-client.js" defer></script>
```

2. O usar async para cargar en orden:
```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script src="/js/socket-client.js" defer></script>
```

### Problema 2: "No auth token found"

**Síntoma:**
```
[Socket Client] No auth token found. Socket connection disabled.
```

**Solución:**
1. Verificar que el usuario esté autenticado:
```javascript
console.log('Token:', sessionStorage.getItem('authToken'));
// o
console.log('Token:', localStorage.getItem('authToken'));
```

2. Si no hay token, redirigir a login:
```javascript
if (!sessionStorage.getItem('authToken')) {
    window.location.href = '/login.html';
}
```

### Problema 3: Connection timeout/error

**Síntoma:**
```
[Socket Client] Connection error (attempt 3): Transport unknown
```

**Soluciones:**

1. **Verificar que el servidor esté corriendo:**
```bash
curl http://localhost:3000/api/health
```

2. **Verificar CORS:**
   - Si frontend en localhost:5500 y backend en localhost:3000
   - Backend debe permitir origen del frontend en CORS

3. **Firewall/Antivirus:**
   - Puede bloquear WebSocket connections
   - Temporalmente deshabilitar para testing

### Problema 4: Notificaciones no llegan

**Debugging:**

1. **En servidor, verificar logs:**
```
[SOCKET.IO] ✅ Servicio de notificaciones en tiempo real inicializado
📡 Socket.IO escuchando en http://localhost:3000
```

2. **En cliente, verificar conexión:**
```javascript
console.log('Connected:', window.socketClient.connected);
console.log('Socket ID:', window.socketClient.socket?.id);
```

3. **Verificar que req.app.socketService existe en ruta:**
```javascript
console.log('SocketService disponible:', !!req.app.socketService);
```

4. **Verificar que el userId es correcto:**
```javascript
// En backend
console.log('Enviando notificación a userId:', userId);
console.log('Usuario está online:', req.app.socketService.isUserOnline(userId));
```

### Problema 5: JWT inválido en handshake

**Síntoma:**
```
[SOCKET.IO] ❌ Authentication error: jwt malformed
```

**Solución:**
1. Verificar que el token sea válido:
```javascript
// En frontend
const token = sessionStorage.getItem('authToken');
console.log('Token:', token);

// Decodificar (sin verificar firma)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
```

2. Verificar JWT_SECRET en .env:
```bash
# backend/.env
JWT_SECRET=tu_secret_key_segura_aqui
```

3. Re-login para obtener token fresco

---

## 10. PRÓXIMOS PASOS

### 10.1. Mejoras Futuras (No en SEMANA 5)

**SEMANA 6:**
- ✅ Elasticsearch para búsqueda avanzada en notificaciones
- ✅ Full-text search en mensajes

**SEMANA 7:**
- ✅ Analytics dashboard con Chart.js mostrando:
  - Notificaciones enviadas por día
  - Notificaciones por tipo
  - Usuarios más activos

**SEMANA 10:**
- ✅ Prometheus metrics para Socket.IO:
  - `socketio_connections_total`
  - `socketio_messages_sent_total`
  - `socketio_errors_total`

**Futuro (No programado):**
- [ ] Notificaciones push móviles (FCM/APNS)
- [ ] Webhooks para integraciones externas
- [ ] Rate limiting por usuario
- [ ] Compresión de mensajes grandes
- [ ] Soporte para attachments en notificaciones

### 10.2. Extensiones Opcionales

**Chat Completo:**
```javascript
// Agregar a socket-service.js
setupChatHandlers() {
    this.io.on('connection', (socket) => {
        socket.on('chat_message', async (data) => {
            const { room, message } = data;
            // Guardar en BD
            // Broadcast a room
            this.io.to(`room:${room}`).emit('chat_message', {
                from: socket.userId,
                message,
                timestamp: new Date().toISOString()
            });
        });
    });
}
```

**Video Call Signaling:**
```javascript
// WebRTC signaling via Socket.IO
socket.on('call_offer', (data) => {
    io.to(`user:${data.to}`).emit('call_offer', {
        from: socket.userId,
        offer: data.offer
    });
});

socket.on('call_answer', (data) => {
    io.to(`user:${data.to}`).emit('call_answer', {
        from: socket.userId,
        answer: data.answer
    });
});
```

---

## 📊 MÉTRICAS FINALES

| Métrica | Valor |
|---------|-------|
| **Archivos Creados** | 3 |
| **Líneas de Código Backend** | 775 |
| **Líneas de Código Frontend** | 650 |
| **Líneas de Documentación** | 1,200+ |
| **Total Líneas** | ~2,625 |
| **Endpoints API** | 7 |
| **Event Handlers** | 12 |
| **UI Components** | 4 |
| **Custom Events** | 6 |
| **Tested** | ✅ Manual testing ready |

---

## ✅ CHECKLIST DE VALIDACIÓN

### Backend
- ✅ SocketService creado (375 líneas)
- ✅ Integrado en server.js
- ✅ JWT authentication en handshake
- ✅ Auto-join a rooms (user/role/tenant)
- ✅ Redis para historial de notificaciones
- ✅ API routes creadas (400+ líneas)
- ✅ Sintaxis validada (node -c)
- ✅ Error handling completo

### Frontend
- ✅ Socket client creado (650+ líneas)
- ✅ Auto-reconnection con backoff
- ✅ UI de notificaciones con animaciones
- ✅ Connection status indicator
- ✅ Presence indicators
- ✅ Audio notifications
- ✅ Custom events para desacoplamiento
- ✅ CSS incluido inline

### Documentación
- ✅ Arquitectura documentada
- ✅ Guía de uso backend
- ✅ Guía de uso frontend
- ✅ API reference completa
- ✅ 3 ejemplos de uso
- ✅ Testing instructions
- ✅ Troubleshooting guide

---

**FIN DE SEMANA 5 - SOCKET.IO REAL-TIME NOTIFICATIONS**

**Fecha de Completación:** 17 Noviembre 2025
**Estado:** ✅ 100% COMPLETADO Y LISTO PARA USO
**Próximo:** SEMANA 6 - Advanced Search con Elasticsearch
