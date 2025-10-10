# 🚀 INICIO RÁPIDO - Sistema de Registro de Usuarios

## ⚡ Comandos de Inicio

```bash
# 1. Navegar a la carpeta backend
cd C:\03BachilleratoHeroesWeb\backend

# 2. Instalar dependencias (solo primera vez)
npm install

# 3. Iniciar servidor
node server.js

# O con nodemon para desarrollo:
npm run dev
```

## 🔑 Credenciales de Administrador

```
Username: admin
Password: Admin123!@#
Email: admin@heroespatria.edu.mx
```

## 🧪 Testing Rápido

### 1. Verificar que el servidor está corriendo:
```bash
curl http://localhost:3000/api/health
```

### 2. Login de administrador:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"Admin123!@#\"}"
```

### 3. Enviar solicitud de registro de prueba:
```bash
curl -X POST http://localhost:3000/api/auth/request-registration \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Juan Perez Garcia\",\"email\":\"juan.perez@bge.edu.mx\",\"requestedRole\":\"docente\",\"reason\":\"Necesito acceso al sistema para gestionar calificaciones de mis grupos de matematicas. Requiero subir material didactico y comunicarme con padres.\",\"phone\":\"3312345678\"}"
```

### 4. Ejecutar suite completa de tests:
```bash
node test-registration-system.js
```

## 📁 Archivos Importantes

- **Datos**: `backend/data/registration-requests.json`
- **Usuarios**: `backend/data/usuarios.json`
- **Logs**: `backend/server.log`
- **Config**: `backend/.env`

## 📚 Documentación Completa

- **Testing Manual**: `INSTRUCCIONES-TESTING-FASE2.md`
- **Reporte Técnico**: `../REPORTE-FASE2-BACKEND-REGISTRO-USUARIOS.md`

## 🆘 Problemas Comunes

### Puerto 3000 ocupado:
```bash
# Ver proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso (reemplazar PID)
taskkill /PID {PID} /F
```

### Error de módulos:
```bash
cd backend
npm install
```

### Limpiar datos de prueba:
```bash
# Resetear solicitudes
echo {\"requests\":[],\"lastId\":0} > data/registration-requests.json
```

## ✅ Todo Listo!

El sistema está funcionando cuando ves:
```
🚀 Servidor backend iniciado:
   📡 Puerto: 3000
   🌍 Entorno: production
   🔒 Seguridad: Helmet + CORS + Rate Limiting
   🛡️  JWT: Habilitado
```

**¡Estás listo para probar el sistema!** 🎉
