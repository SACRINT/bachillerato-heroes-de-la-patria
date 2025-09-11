# 🗄️ GUÍA DE CONFIGURACIÓN DE BASE DE DATOS
## Bachillerato General Estatal "Héroes de la Patria"

---

## 📋 **PREREQUISITOS**

### **1. Instalar Software Necesario**
- **MySQL Server 8.0+** o **MariaDB 10.6+**
- **Node.js 18+** y **npm**
- **Git** (ya instalado)

### **2. Verificar Instalaciones**
```bash
# Verificar MySQL
mysql --version

# Verificar Node.js
node --version
npm --version
```

---

## 🚀 **INSTALACIÓN PASO A PASO**

### **PASO 1: Configurar MySQL**

#### **1.1 Crear Base de Datos**
```sql
-- Conectar a MySQL como root
mysql -u root -p

-- Ejecutar el script de creación
SOURCE C:/03\ BachilleratoHeroesWeb/backend/migrations/001_create_database.sql;
```

#### **1.2 Crear Usuario de Aplicación (Recomendado)**
```sql
-- Crear usuario específico para la aplicación
CREATE USER 'heroes_app'@'localhost' IDENTIFIED BY 'HeroesPatria2025!';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'heroes_app'@'localhost';
FLUSH PRIVILEGES;

-- Verificar usuario
SELECT User, Host FROM mysql.user WHERE User = 'heroes_app';
```

#### **1.3 Poblar con Datos Iniciales**
```sql
-- Usar la base de datos
USE heroes_patria_db;

-- Ejecutar datos iniciales
SOURCE C:/03\ BachilleratoHeroesWeb/backend/seeds/initial_data.sql;

-- Verificar datos
SELECT COUNT(*) as total_tablas FROM information_schema.tables 
WHERE table_schema = 'heroes_patria_db';

SELECT COUNT(*) as informacion_chatbot FROM informacion_dinamica;
```

### **PASO 2: Configurar Backend**

#### **2.1 Instalar Dependencias**
```bash
# Navegar al directorio backend
cd C:/03\ BachilleratoHeroesWeb/backend

# Instalar dependencias
npm install
```

#### **2.2 Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos
```

**Contenido del archivo `.env`:**
```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=heroes_patria_db
DB_USER=heroes_app
DB_PASSWORD=HeroesPatria2025!

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Seguridad
JWT_SECRET=super_secure_jwt_secret_heroes_patria_2025_min_32_chars
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8081,https://sacrint.github.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **2.3 Probar Conexión**
```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Verificar en otra terminal
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-09T...",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 1.234
}
```

### **PASO 3: Probar API del Chatbot**

#### **3.1 Buscar Información**
```bash
# Test de búsqueda
curl -X POST http://localhost:3000/api/chatbot/search \
  -H "Content-Type: application/json" \
  -d '{"query": "horarios", "user_type": "visitante"}'
```

#### **3.2 Registrar Mensaje**
```bash
# Test de mensaje
curl -X POST http://localhost:3000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123",
    "message": "Hola, quiero información sobre horarios",
    "sender_type": "user",
    "user_type": "visitante"
  }'
```

#### **3.3 Ver Analytics**
```bash
# Analytics del día
curl http://localhost:3000/api/chatbot/analytics/daily
```

---

## 🔧 **INTEGRACIÓN CON FRONTEND**

### **Modificar chatbot.js para usar la API**

Agregar al archivo `js/chatbot.js`:

```javascript
// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Clase para integración con BD
class ChatbotAPI {
    constructor() {
        this.sessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async buscarInformacion(query, userType = 'visitante') {
        try {
            const response = await fetch(`${API_BASE_URL}/chatbot/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    user_type: userType,
                    limit: 3
                })
            });
            
            if (!response.ok) {
                throw new Error('Error en la API');
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Error en API:', error);
            return [];
        }
    }
    
    async registrarMensaje(message, senderType, intent = null) {
        try {
            await fetch(`${API_BASE_URL}/chatbot/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    message: message,
                    sender_type: senderType,
                    intent: intent
                })
            });
        } catch (error) {
            console.error('Error registrando mensaje:', error);
        }
    }
}

// Instanciar API
const chatbotAPI = new ChatbotAPI();

// Función mejorada de procesamiento
async function processMessageWithDatabase(message) {
    // Registrar mensaje del usuario
    await chatbotAPI.registrarMensaje(message, 'user');
    
    // Buscar en la base de datos
    const dbResults = await chatbotAPI.buscarInformacion(message);
    
    let response;
    if (dbResults.length > 0) {
        // Usar información de la BD
        response = formatDatabaseResponse(dbResults[0]);
        await chatbotAPI.registrarMensaje(response, 'bot', 'database_match');
    } else {
        // Usar el sistema estático como fallback
        response = processMessage(message);
        await chatbotAPI.registrarMensaje(response, 'bot', 'static_fallback');
    }
    
    return response;
}

function formatDatabaseResponse(dbResult) {
    try {
        const contenido = JSON.parse(dbResult.contenido);
        
        return formatResponse({
            title: `🔍 ${dbResult.titulo}`,
            content: [
                {
                    subtitle: 'Información Actualizada',
                    text: formatContentToText(contenido)
                }
            ],
            footer: `Última actualización: ${new Date(dbResult.updated_at).toLocaleDateString()}`
        });
    } catch (error) {
        return formatResponse({
            title: dbResult.titulo,
            content: [{ text: dbResult.contenido }],
            footer: 'Información actualizada'
        });
    }
}

function formatContentToText(contenido) {
    if (typeof contenido === 'string') return contenido;
    
    let text = '';
    for (const [key, value] of Object.entries(contenido)) {
        if (Array.isArray(value)) {
            text += `<strong>${key}:</strong><br>`;
            value.forEach(item => {
                text += `• ${item}<br>`;
            });
        } else if (typeof value === 'object') {
            text += `<strong>${key}:</strong><br>`;
            for (const [subkey, subvalue] of Object.entries(value)) {
                text += `• <strong>${subkey}:</strong> ${subvalue}<br>`;
            }
        } else {
            text += `<strong>${key}:</strong> ${value}<br>`;
        }
        text += '<br>';
    }
    return text;
}
```

---

## 📊 **VERIFICACIÓN DE INSTALACIÓN**

### **Checklist de Verificación**

- [ ] MySQL instalado y funcionando
- [ ] Base de datos `heroes_patria_db` creada
- [ ] Todas las tablas creadas (23 tablas)
- [ ] Datos iniciales insertados
- [ ] Node.js y npm funcionando
- [ ] Dependencias del backend instaladas
- [ ] Archivo `.env` configurado correctamente
- [ ] Servidor backend inicia sin errores
- [ ] Endpoint `/health` responde correctamente
- [ ] API del chatbot responde a búsquedas
- [ ] Frontend integrado con la API

### **Comandos de Verificación**

```bash
# Verificar base de datos
mysql -u heroes_app -p heroes_patria_db -e "SHOW TABLES;"

# Verificar datos del chatbot
mysql -u heroes_app -p heroes_patria_db -e "SELECT COUNT(*) FROM informacion_dinamica;"

# Verificar servidor backend
curl http://localhost:3000/health

# Verificar API del chatbot
curl -X POST http://localhost:3000/api/chatbot/search \
  -H "Content-Type: application/json" \
  -d '{"query": "director"}'
```

---

## 🎯 **PRÓXIMOS PASOS**

Una vez configurada la base de datos:

1. **✅ COMPLETADO:** Backend API funcional
2. **🔄 SIGUIENTE:** Integrar frontend con la API
3. **📊 FUTURO:** Dashboard de analytics
4. **🔐 FUTURO:** Sistema de autenticación
5. **📱 FUTURO:** App móvil

---

## 🆘 **RESOLUCIÓN DE PROBLEMAS**

### **Error: "Access denied for user"**
```sql
-- Verificar permisos
SHOW GRANTS FOR 'heroes_app'@'localhost';

-- Recrear usuario si es necesario
DROP USER 'heroes_app'@'localhost';
CREATE USER 'heroes_app'@'localhost' IDENTIFIED BY 'HeroesPatria2025!';
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'heroes_app'@'localhost';
```

### **Error: "Port 3000 already in use"**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
npx kill-port 3000
```

### **Error: "Cannot connect to MySQL"**
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql
# o en Windows: services.msc -> MySQL

# Verificar puerto
netstat -an | grep 3306
```

**¿Estás listo para configurar la base de datos? ¡Este será el salto más grande para tu proyecto!** 🚀