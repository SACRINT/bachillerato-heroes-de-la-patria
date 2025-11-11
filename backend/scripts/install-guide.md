# 🔧 GUÍA RÁPIDA DE INSTALACIÓN - BGE DATABASE

## ⚡ INSTALACIÓN EXPRESS (5 MINUTOS)

### 1. Descargar e Instalar MySQL
```bash
# Opción A: MySQL Community Server
# - Descargar: https://dev.mysql.com/downloads/mysql/
# - Instalar con configuración por defecto

# Opción B: XAMPP (Más fácil para desarrollo)
# - Descargar: https://www.apachefriends.org/
# - Instalar e iniciar MySQL desde panel de control
```

### 2. Configurar Base de Datos (2 comandos)
```bash
# Crear base de datos y usuario (como root)
mysql -u root -p < backend/scripts/setup-user.sql

# Crear todas las tablas y datos iniciales
mysql -u bge_user -pHeroesPatria2025DB! heroes_patria_db < backend/scripts/create-database.sql
```

### 3. Migrar Datos Existentes
```bash
cd backend
node scripts/migrate-json-data.js
```

### 4. Probar Conexión
```bash
cd backend
node scripts/test-connection.js
```

## ✅ VERIFICACIÓN RÁPIDA

Si ves estos mensajes, todo está funcionando:
```
✅ Conexión exitosa a MySQL
📊 MySQL Version: 8.x.x
📋 Tablas encontradas: 11
✅ Todas las tablas críticas están presentes
👥 Total usuarios: X
🎉 TODAS LAS PRUEBAS EXITOSAS
```

## 🚨 Si MySQL no está disponible

No hay problema. El sistema **automáticamente** usa archivos JSON:
```
❌ Error conectando a MySQL
🔄 Activando sistema JSON como fallback...
✅ Sistema JSON funcionando correctamente
```

## 📞 ¿Problemas?

1. **MySQL no inicia:** `net start MySQL80`
2. **Usuario no existe:** Re-ejecutar `setup-user.sql`
3. **Tablas faltantes:** Re-ejecutar `create-database.sql`
4. **Datos perdidos:** Ejecutar `migrate-json-data.js`

## 🎯 Una vez configurado

El sistema **automáticamente**:
- ✅ Usa MySQL si está disponible
- 🔄 Cambia a JSON si MySQL falla
- 📊 Registra todas las operaciones
- 🚀 Funciona sin interrupciones

**¡Listo para usar!** 🎉