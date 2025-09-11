# 🤖 ESQUEMA DE BASE DE DATOS PARA CHATBOT INTELIGENTE
## Bachillerato General Estatal "Héroes de la Patria"

---

## 📊 **TABLAS ESPECÍFICAS PARA CHATBOT**

### **1. chat_conversations**
```sql
CREATE TABLE chat_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_type ENUM('estudiante', 'padre', 'docente', 'administrativo', 'visitante'),
    user_id BIGINT NULL, -- NULL para visitantes
    ip_address VARCHAR(45),
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_messages INT DEFAULT 0,
    satisfaction_rating TINYINT NULL, -- 1-5 estrellas
    status ENUM('active', 'closed', 'escalated') DEFAULT 'active',
    
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_started_at (started_at)
);
```

### **2. chat_messages**
```sql
CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_type ENUM('user', 'bot', 'human_agent') NOT NULL,
    message TEXT NOT NULL,
    intent_detected VARCHAR(100) NULL,
    confidence_score DECIMAL(3,2) NULL,
    response_time_ms INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at),
    INDEX idx_intent_detected (intent_detected)
);
```

### **3. chat_knowledge_base**
```sql
CREATE TABLE chat_knowledge_base (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NULL,
    keywords JSON NOT NULL, -- Array de palabras clave
    question_patterns JSON NOT NULL, -- Patrones de preguntas
    response_template JSON NOT NULL, -- Template de respuesta estructurada
    priority INT DEFAULT 5, -- 1-10, mayor = más prioridad
    requires_auth BOOLEAN DEFAULT FALSE,
    allowed_user_types JSON NULL, -- ['estudiante', 'docente', etc.]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NULL,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    FULLTEXT idx_keywords (keywords)
);
```

### **4. chat_analytics**
```sql
CREATE TABLE chat_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_recorded DATE NOT NULL,
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    avg_response_time_ms DECIMAL(8,2) DEFAULT 0,
    successful_resolutions INT DEFAULT 0,
    escalated_conversations INT DEFAULT 0,
    top_intents JSON NULL, -- Top 10 intents del día
    user_satisfaction_avg DECIMAL(3,2) NULL,
    unique_users INT DEFAULT 0,
    
    UNIQUE KEY unique_date (date_recorded),
    INDEX idx_date_recorded (date_recorded)
);
```

### **5. chat_feedback**
```sql
CREATE TABLE chat_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    message_id BIGINT NULL,
    feedback_type ENUM('helpful', 'not_helpful', 'suggestion', 'complaint'),
    rating TINYINT NULL, -- 1-5
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_feedback_type (feedback_type)
);
```

---

## 🎯 **DATOS DINÁMICOS PARA CHATBOT**

### **6. informacion_dinamica**
```sql
CREATE TABLE informacion_dinamica (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido JSON NOT NULL, -- Estructura flexible
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    prioridad INT DEFAULT 5,
    es_confidencial BOOLEAN DEFAULT FALSE,
    requiere_autenticacion BOOLEAN DEFAULT FALSE,
    tipos_usuario_permitidos JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_categoria (categoria),
    INDEX idx_clave (clave),
    INDEX idx_is_active (is_active)
);
```

---

## 🔧 **DATOS INICIALES PARA EL CHATBOT**

### **Inserción de Knowledge Base Básica**
```sql
-- Horarios
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, is_active) VALUES
('horarios_atencion', 'horarios', 'Horarios de Atención', '{
    "clases": "Lunes a Viernes de 8:00 AM a 1:30 PM",
    "administracion": "Lunes a Viernes de 8:00 AM a 1:30 PM",
    "biblioteca": "Lunes a Viernes de 8:00 AM a 2:00 PM",
    "cct": "21EBH0200X"
}', TRUE);

-- Contacto
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, is_active) VALUES
('informacion_contacto', 'contacto', 'Información de Contacto', '{
    "email": "21ebh0200x.sep@gmail.com",
    "facebook": "Bachillerato General Estatal Héroes de la Patria",
    "direccion": "C. Manuel Ávila Camacho #7, Col. Centro, Coronel Tito Hernández (María Andrea), Venustiano Carranza, Puebla, C.P. 73030",
    "telefono_disponible": false,
    "whatsapp_disponible": false
}', TRUE);

-- Personal Directivo
INSERT INTO informacion_dinamica (clave, categoria, titulo, contenido, is_active) VALUES
('personal_directivo', 'personal', 'Personal Directivo', '{
    "director": {
        "nombre": "Ing. Samuel Cruz Interial",
        "cargo": "Director General",
        "experiencia": "23+ años en educación",
        "formacion": "Ingeniero en Electrónica y Comunicaciones",
        "email": "21ebh0200x.sep@gmail.com"
    }
}', TRUE);
```

---

## 🤖 **FUNCIONES PHP PARA CHATBOT**

### **Conexión y Consultas Dinámicas**
```php
<?php
class ChatbotDB {
    private $pdo;
    
    public function __construct($database_config) {
        $this->pdo = new PDO(
            "mysql:host={$database_config['host']};dbname={$database_config['database']}",
            $database_config['username'],
            $database_config['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    
    // Buscar información dinámica
    public function buscarInformacion($query, $user_type = 'visitante') {
        $sql = "SELECT * FROM informacion_dinamica 
                WHERE is_active = TRUE 
                AND (tipos_usuario_permitidos IS NULL 
                     OR JSON_CONTAINS(tipos_usuario_permitidos, :user_type))
                AND (contenido LIKE :query 
                     OR titulo LIKE :query 
                     OR categoria LIKE :query)
                ORDER BY prioridad DESC, updated_at DESC
                LIMIT 5";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':query' => "%{$query}%",
            ':user_type' => "\"$user_type\""
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Registrar conversación
    public function iniciarConversacion($session_id, $user_type, $user_id = null) {
        $sql = "INSERT INTO chat_conversations 
                (session_id, user_type, user_id, ip_address, user_agent) 
                VALUES (:session_id, :user_type, :user_id, :ip, :user_agent)";
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':session_id' => $session_id,
            ':user_type' => $user_type,
            ':user_id' => $user_id,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
    
    // Registrar mensaje
    public function guardarMensaje($conversation_id, $sender_type, $message, $intent = null, $confidence = null) {
        $sql = "INSERT INTO chat_messages 
                (conversation_id, sender_type, message, intent_detected, confidence_score) 
                VALUES (:conv_id, :sender, :message, :intent, :confidence)";
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            ':conv_id' => $conversation_id,
            ':sender' => $sender_type,
            ':message' => $message,
            ':intent' => $intent,
            ':confidence' => $confidence
        ]);
    }
    
    // Obtener estadísticas
    public function obtenerEstadisticas($fecha_inicio, $fecha_fin) {
        $sql = "SELECT 
                    COUNT(*) as total_conversaciones,
                    COUNT(DISTINCT user_id) as usuarios_unicos,
                    AVG(total_messages) as promedio_mensajes,
                    AVG(satisfaction_rating) as satisfaccion_promedio
                FROM chat_conversations 
                WHERE started_at BETWEEN :inicio AND :fin";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':inicio' => $fecha_inicio, ':fin' => $fecha_fin]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
```

---

## 🚀 **INTEGRACIÓN CON CHATBOT ACTUAL**

### **JavaScript Mejorado (chatbot.js)**
```javascript
// Nueva clase para integración con BD
class ChatbotDatabase {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.sessionId = this.generateSessionId();
    }
    
    generateSessionId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async buscarInformacion(query, userType = 'visitante') {
        try {
            const response = await fetch(`${this.apiEndpoint}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    user_type: userType,
                    session_id: this.sessionId
                })
            });
            
            if (!response.ok) throw new Error('Error en la consulta');
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Error consultando BD:', error);
            return [];
        }
    }
    
    async guardarMensaje(message, senderType, intent = null) {
        try {
            await fetch(`${this.apiEndpoint}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    sender_type: senderType,
                    message: message,
                    intent: intent,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Error guardando mensaje:', error);
        }
    }
}

// Integración con el chatbot existente
const chatDB = new ChatbotDatabase('/api/chatbot');

// Función mejorada de procesamiento de mensajes
async function processMessageWithDB(message) {
    // Guardar mensaje del usuario
    await chatDB.guardarMensaje(message, 'user');
    
    // Buscar en la base de datos primero
    const dbResults = await chatDB.buscarInformacion(message);
    
    if (dbResults.length > 0) {
        // Usar información de la BD
        const response = formatDatabaseResponse(dbResults[0]);
        await chatDB.guardarMensaje(response, 'bot', 'database_match');
        return response;
    } else {
        // Usar el sistema estático actual como fallback
        const staticResponse = processMessage(message);
        await chatDB.guardarMensaje(staticResponse, 'bot', 'static_fallback');
        return staticResponse;
    }
}

function formatDatabaseResponse(dbResult) {
    return formatResponse({
        title: `🔍 ${dbResult.titulo}`,
        content: [
            {
                subtitle: 'Información Actualizada',
                text: formatDatabaseContent(dbResult.contenido)
            }
        ],
        footer: `Última actualización: ${new Date(dbResult.updated_at).toLocaleDateString()}`
    });
}
```

---

## 📈 **VENTAJAS DE LA INTEGRACIÓN BD + CHATBOT**

### **✅ Información en Tiempo Real**
- Datos siempre actualizados
- Sin necesidad de modificar código para cambios
- Información personalizada por tipo de usuario

### **✅ Analytics Avanzados**
- Métricas de uso detalladas
- Identificación de preguntas frecuentes
- Análisis de satisfacción de usuarios

### **✅ Escalabilidad**
- Fácil agregar nueva información
- Sistema de prioridades automático  
- Capacidad de manejar miles de conversaciones

### **✅ Personalización**
- Respuestas específicas por usuario
- Información confidencial protegida
- Historial de conversaciones

---

## 🎯 **SIGUIENTES PASOS RECOMENDADOS**

### **Fase 1: Setup Básico**
1. Crear base de datos MySQL/PostgreSQL
2. Ejecutar scripts de creación de tablas
3. Insertar datos iniciales
4. Configurar API REST básica

### **Fase 2: Integración**
1. Modificar chatbot.js para usar la BD
2. Crear endpoints API necesarios
3. Testing de funcionalidades básicas
4. Deploy en servidor de pruebas

### **Fase 3: Optimización**
1. Implementar analytics
2. Agregar sistema de feedback
3. Optimizar rendimiento
4. Lanzamiento en producción

¿Quieres que comience con la implementación del backend API para conectar el chatbot con la base de datos?