# 🛡️ SISTEMA DE AUTENTICACIÓN SEGURO

## Cambios Principales

### ✅ Mejoras de Seguridad
- ❌ **Eliminado**: Contraseñas hardcoded en JavaScript
- ✅ **Agregado**: Autenticación server-side con JWT
- ✅ **Agregado**: Hash de contraseñas con bcrypt (12 salt rounds)
- ✅ **Agregado**: Rate limiting (5 intentos cada 15 minutos)
- ✅ **Agregado**: Validación y sanitización server-side
- ✅ **Agregado**: Headers de seguridad (Helmet.js)
- ✅ **Agregado**: Protección CORS configurada

### 🔧 Archivos Nuevos
- `server/` - Backend Express.js seguro
- `js/admin-auth-secure.js` - Frontend actualizado
- `setup-security.bat` - Script de instalación

### 📦 Archivos Respaldados
- `backup-old-auth/admin-auth.js` - Sistema antiguo
- `backup-old-auth/force-admin-nuclear.js` - Script nuclear

## 🚀 Uso

### 1. Instalar Backend
```bash
# Ejecutar script de instalación
setup-security.bat

# O manualmente:
cd server
npm install
```

### 2. Iniciar Servicios
```bash
# Terminal 1: Backend (puerto 3000)
cd server
npm start

# Terminal 2: Frontend (puerto 8080)
python -m http.server 8080
```

### 3. Acceder
- **URL**: http://localhost:8080
- **Contraseña**: HeroesPatria2024! (cambiar en producción)

## 🔒 Seguridad

### Contraseña en Producción
1. Cambiar `JWT_SECRET` en `server/.env`
2. Cambiar `SESSION_SECRET` en `server/.env`
3. Usar endpoint `POST /api/auth/change-password` para nueva contraseña
4. Actualizar `ADMIN_PASSWORD_HASH` en `.env` con el hash generado

### Variables de Entorno Críticas
```env
JWT_SECRET=tu_clave_jwt_super_segura_aqui
SESSION_SECRET=tu_clave_session_super_segura_aqui
ADMIN_PASSWORD_HASH=hash_generado_por_bcrypt
NODE_ENV=production
```

## 📊 Beneficios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Contraseñas | Hardcoded en JS | Hash bcrypt server-side |
| Autenticación | Client-side only | JWT server-side |
| Seguridad | Vulnerable | Múltiples capas |
| Rate Limiting | ❌ | ✅ 5 intentos/15min |
| Validación | Cliente | Cliente + Servidor |
| Headers | Básicos | Helmet.js completo |

---
**Migración completada**: $(date)
