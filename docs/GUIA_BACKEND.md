# 🚀 GUÍA COMPLETA DEL BACKEND
## Bachillerato General Estatal "Héroes de la Patria"

---

## 📋 **ÍNDICE**
1. [¿Qué es el Backend?](#qué-es-el-backend)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [APIs Implementadas](#apis-implementadas)
4. [Base de Datos](#base-de-datos)
5. [Cómo Instalar y Configurar](#cómo-instalar-y-configurar)
6. [Cómo Usar las APIs](#cómo-usar-las-apis)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 **¿QUÉ ES EL BACKEND?**

El **backend** es la parte "invisible" de tu página web que:
- 🗄️ **Guarda datos** (estudiantes, calificaciones, usuarios)
- 🔐 **Maneja seguridad** (login, passwords)
- 📊 **Procesa información** (reportes, estadísticas)
- 💳 **Gestiona pagos** (transacciones, comprobantes)
- 🤖 **Responde al chatbot** (preguntas automáticas)

**Analogía simple**: Si tu página web es una tienda, el backend es el almacén y la oficina administrativa.

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   BASE DE       │
│   (Lo que ves)  │◄──►│   (Servidor)    │◄──►│   DATOS         │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │    │ • Node.js       │    │ • MySQL         │
│ • Formularios   │    │ • Express       │    │ • Tablas        │
│ • Chatbot       │    │ • APIs          │    │ • Relaciones    │
│ • Pagos         │    │ • Autenticación │    │ • Backup        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📡 **APIS IMPLEMENTADAS**

### **1. API de Autenticación** (`/api/auth/`)
- **POST** `/api/auth/login` - Iniciar sesión
- **POST** `/api/auth/register` - Registrar usuario
- **POST** `/api/auth/logout` - Cerrar sesión
- **GET** `/api/auth/verify` - Verificar token

### **2. API de Estudiantes** (`/api/students/`)
- **GET** `/api/students/` - Lista de estudiantes
- **GET** `/api/students/:id` - Datos de un estudiante
- **POST** `/api/students/` - Crear estudiante
- **PUT** `/api/students/:id` - Actualizar estudiante
- **DELETE** `/api/students/:id` - Eliminar estudiante

### **3. API de Calificaciones** (`/api/grades/`)
- **GET** `/api/grades/student/:id` - Calificaciones de estudiante
- **POST** `/api/grades/` - Agregar calificación
- **PUT** `/api/grades/:id` - Actualizar calificación

### **4. API del Chatbot** (`/api/chatbot/`)
- **POST** `/api/chatbot/message` - Enviar mensaje
- **GET** `/api/chatbot/context/:id` - Obtener contexto

### **5. API de Pagos** (`/api/payments/`)
- **POST** `/api/payments/process` - Procesar pago
- **GET** `/api/payments/history/:id` - Historial de pagos
- **POST** `/api/payments/receipt` - Generar comprobante

### **6. API de Analytics** (`/api/analytics/`)
- **POST** `/api/analytics/track` - Registrar evento
- **GET** `/api/analytics/dashboard` - Datos del dashboard
- **POST** `/api/analytics/session` - Datos de sesión

---

## 🗄️ **BASE DE DATOS**

### **Estructura Principal:**

#### **Tabla: usuarios**
```sql
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('estudiante', 'padre', 'docente', 'admin'),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);
```

#### **Tabla: estudiantes**
```sql
CREATE TABLE estudiantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nia VARCHAR(15),
    curp VARCHAR(18),
    fecha_nacimiento DATE,
    direccion TEXT,
    telefono VARCHAR(15),
    especialidad VARCHAR(50),
    semestre INT,
    generacion VARCHAR(10),
    tutor_id INT,
    fecha_ingreso DATE,
    estatus ENUM('activo', 'baja', 'egresado'),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

#### **Tabla: calificaciones**
```sql
CREATE TABLE calificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT,
    materia_id INT,
    periodo VARCHAR(20),
    calificacion DECIMAL(4,2),
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    docente_id INT,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
);
```

---

## ⚙️ **CÓMO INSTALAR Y CONFIGURAR**

### **Opción 1: Servidor Local (Desarrollo)**

#### **1. Instalar Node.js**
```bash
# Descargar de: https://nodejs.org/
# Versión recomendada: 18 LTS o superior
```

#### **2. Crear Proyecto Backend**
```bash
# Crear carpeta del backend
mkdir bachillerato-backend
cd bachillerato-backend

# Inicializar proyecto
npm init -y

# Instalar dependencias
npm install express mysql2 bcryptjs jsonwebtoken cors dotenv multer
npm install --save-dev nodemon
```

#### **3. Crear Archivo Principal** (`server.js`)
```javascript
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'tu_password',
    database: 'bachillerato_db'
});

// Verificar conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// Rutas básicas
app.get('/', (req, res) => {
    res.json({ 
        message: '🎓 API Bachillerato Héroes de la Patria',
        version: '1.0.0',
        endpoints: [
            '/api/auth',
            '/api/students', 
            '/api/grades',
            '/api/chatbot',
            '/api/payments'
        ]
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

#### **4. Configurar Variables de Entorno** (`.env`)
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=bachillerato_db

# Autenticación
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=7d

# Configuración del servidor
PORT=3000
NODE_ENV=development

# APIs externas
STRIPE_SECRET_KEY=sk_test_tu_clave_stripe
PAYPAL_CLIENT_ID=tu_client_id_paypal
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_email
```

#### **5. Crear Script de Inicio** (`package.json`)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node scripts/init-database.js"
  }
}
```

### **Opción 2: Servidor en la Nube**

#### **Heroku (Gratis)**
```bash
# Instalar Heroku CLI
# Crear app
heroku create bachillerato-heroes

# Configurar variables
heroku config:set DB_HOST=tu_host_mysql
heroku config:set DB_USER=tu_usuario
heroku config:set DB_PASSWORD=tu_password
heroku config:set JWT_SECRET=tu_clave_secreta

# Desplegar
git push heroku main
```

#### **Railway (Fácil)**
```bash
# Conectar con GitHub
# Railway detecta automáticamente Node.js
# Agregar variables de entorno en el dashboard
```

#### **DigitalOcean/AWS (Profesional)**
- Crear droplet/instancia
- Instalar Node.js y MySQL
- Configurar firewall
- Usar PM2 para gestión de procesos

---

## 🎯 **CÓMO USAR LAS APIS**

### **Ejemplo 1: Autenticación**

#### **Registro de Usuario**
```javascript
// En tu JavaScript del frontend
async function registrarUsuario() {
    const userData = {
        nombre: 'Juan',
        apellidos: 'Pérez García',
        email: 'juan@email.com',
        password: 'password123',
        tipo_usuario: 'estudiante'
    };

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Usuario registrado:', result.user);
            localStorage.setItem('token', result.token);
        } else {
            console.error('❌ Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}
```

#### **Iniciar Sesión**
```javascript
async function iniciarSesion() {
    const loginData = {
        email: 'juan@email.com',
        password: 'password123'
    };

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Login exitoso');
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Redirigir al dashboard
            window.location.href = '/dashboard.html';
        } else {
            alert('❌ Credenciales incorrectas');
        }
    } catch (error) {
        alert('❌ Error de conexión con el servidor');
    }
}
```

### **Ejemplo 2: Obtener Calificaciones**

```javascript
async function obtenerCalificaciones(estudianteId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/grades/student/${estudianteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            mostrarCalificaciones(result.grades);
        } else {
            console.error('❌ Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

function mostrarCalificaciones(calificaciones) {
    const tbody = document.getElementById('tablaCalificaciones');
    tbody.innerHTML = '';
    
    calificaciones.forEach(cal => {
        const row = `
            <tr>
                <td>${cal.materia}</td>
                <td>${cal.periodo}</td>
                <td>${cal.calificacion}</td>
                <td>${new Date(cal.fecha_captura).toLocaleDateString()}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
```

### **Ejemplo 3: Chatbot Inteligente**

```javascript
async function enviarMensajeChatbot(mensaje) {
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user')).id;
    
    try {
        const response = await fetch('http://localhost:3000/api/chatbot/message', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: mensaje,
                userId: userId,
                context: 'general'
            })
        });

        const result = await response.json();
        
        if (result.success) {
            mostrarRespuestaChatbot(result.response);
        } else {
            mostrarRespuestaChatbot('❌ Lo siento, no pude procesar tu mensaje.');
        }
    } catch (error) {
        mostrarRespuestaChatbot('❌ Error de conexión con el servidor.');
    }
}

function mostrarRespuestaChatbot(respuesta) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-robot"></i>
            <span>${respuesta}</span>
        </div>
        <small>${new Date().toLocaleTimeString()}</small>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
```

---

## 💡 **EJEMPLOS PRÁCTICOS**

### **Escenario 1: Un Padre Consulta Calificaciones**

**1. Frontend (lo que ve el padre):**
```html
<div class="grades-section">
    <h4>📊 Calificaciones de mi hijo</h4>
    <button onclick="cargarCalificaciones()">Ver Calificaciones</button>
    <div id="resultados"></div>
</div>
```

**2. JavaScript (Frontend):**
```javascript
async function cargarCalificaciones() {
    const estudianteId = '20230001'; // ID del estudiante
    
    // Mostrar loading
    document.getElementById('resultados').innerHTML = 
        '<div class="spinner">Cargando...</div>';
    
    try {
        // Llamar al backend
        const response = await fetch(`/api/grades/student/${estudianteId}`);
        const data = await response.json();
        
        // Mostrar resultados
        mostrarTablaCalificaciones(data.calificaciones);
        
    } catch (error) {
        document.getElementById('resultados').innerHTML = 
            '<div class="alert alert-danger">Error al cargar calificaciones</div>';
    }
}
```

**3. Backend (lo que hace el servidor):**
```javascript
// En el servidor (server.js)
app.get('/api/grades/student/:id', async (req, res) => {
    const estudianteId = req.params.id;
    
    try {
        // Consultar base de datos
        const query = `
            SELECT c.*, m.nombre as materia_nombre 
            FROM calificaciones c 
            JOIN materias m ON c.materia_id = m.id 
            WHERE c.estudiante_id = ?
            ORDER BY c.fecha_captura DESC
        `;
        
        const [rows] = await db.execute(query, [estudianteId]);
        
        // Enviar respuesta
        res.json({
            success: true,
            calificaciones: rows
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener calificaciones'
        });
    }
});
```

### **Escenario 2: Procesar un Pago**

**1. Usuario hace clic en "Pagar"**
**2. Frontend envía datos al backend**
```javascript
async function procesarPago(datosPago) {
    try {
        const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosPago)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarConfirmacionPago(result.transactionId);
        }
    } catch (error) {
        mostrarErrorPago(error.message);
    }
}
```

**3. Backend procesa el pago**
```javascript
app.post('/api/payments/process', async (req, res) => {
    const { amount, method, studentId } = req.body;
    
    try {
        // Procesar con Stripe/PayPal
        const paymentResult = await processPaymentWithProvider(method, amount);
        
        // Guardar en base de datos
        const query = `
            INSERT INTO pagos (estudiante_id, monto, metodo, referencia, estado)
            VALUES (?, ?, ?, ?, 'completado')
        `;
        await db.execute(query, [studentId, amount, method, paymentResult.id]);
        
        // Enviar email de confirmación
        await sendPaymentConfirmationEmail(studentId, paymentResult);
        
        res.json({
            success: true,
            transactionId: paymentResult.id
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Problema 1: "Cannot connect to database"**
```bash
# Verificar que MySQL esté corriendo
sudo service mysql start

# Verificar credenciales en .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_correcto
```

### **Problema 2: "Port 3000 already in use"**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso que usa el puerto
sudo lsof -ti:3000 | xargs kill -9
```

### **Problema 3: "CORS error"**
```javascript
// Agregar CORS con configuración específica
app.use(cors({
    origin: ['http://localhost:8080', 'https://tu-dominio.com'],
    credentials: true
}));
```

### **Problema 4: "JWT token invalid"**
```javascript
// Verificar que el token se envíe correctamente
headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
}
```

---

## 📞 **SOPORTE Y RECURSOS**

### **Documentación Oficial:**
- 📚 [Node.js](https://nodejs.org/docs/)
- 🚀 [Express.js](https://expressjs.com/)
- 🗄️ [MySQL](https://dev.mysql.com/doc/)

### **Herramientas Útiles:**
- 🔧 [Postman](https://postman.com) - Para probar APIs
- 💾 [phpMyAdmin](https://phpmyadmin.net) - Para administrar MySQL
- 📊 [MongoDB Compass](https://mongodb.com/compass) - Si usas MongoDB

### **Comandos Útiles:**
```bash
# Ver logs del servidor
npm run dev

# Reiniciar base de datos
npm run init-db

# Ver procesos corriendo
ps aux | grep node

# Backup de base de datos
mysqldump -u root -p bachillerato_db > backup.sql
```

---

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar servidor local** con Node.js
2. **Crear base de datos** MySQL
3. **Probar APIs** con Postman
4. **Integrar con frontend** paso a paso
5. **Desplegar en la nube** cuando esté listo

¿Por dónde quieres empezar? ¡Te ayudo con cualquier paso específico!