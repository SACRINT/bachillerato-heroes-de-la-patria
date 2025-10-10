# 🗄️ GUÍA DE INSTALACIÓN DE MYSQL SERVER EN WINDOWS

**Fecha**: 3 de Octubre 2025
**Versión recomendada**: MySQL 8.0.x
**Sistema**: Windows 10/11

---

## 📋 PASO 1: DESCARGAR MYSQL

### Opción A: MySQL Installer (Recomendada)

1. **Ir a la página oficial de MySQL:**
   ```
   https://dev.mysql.com/downloads/installer/
   ```

2. **Descargar MySQL Installer:**
   - Selecciona: **Windows (x86, 32-bit), MSI Installer** (mysql-installer-web-community-8.0.XX.msi)
   - O versión completa: **mysql-installer-community-8.0.XX.msi** (más grande pero no requiere internet)

3. **Click en "Download"**
   - Puedes saltar el login haciendo click en "No thanks, just start my download"

### Opción B: Chocolatey (Rápida)

Si tienes Chocolatey instalado:

```powershell
# Ejecutar como Administrador
choco install mysql
```

---

## 📋 PASO 2: INSTALAR MYSQL

### Con MySQL Installer (Opción A):

1. **Ejecutar el instalador descargado** (doble click)

2. **Choosing a Setup Type:**
   - Seleccionar: **"Developer Default"**
   - O si tienes poco espacio: **"Server only"**
   - Click en **"Next"**

3. **Check Requirements:**
   - Si falta algo, el instalador lo indicará
   - Click en **"Execute"** para instalar dependencias
   - Click en **"Next"**

4. **Installation:**
   - Click en **"Execute"** para iniciar instalación
   - Esperar a que todos los productos se instalen
   - Click en **"Next"**

5. **Product Configuration:**
   - Click en **"Next"**

---

## 📋 PASO 3: CONFIGURAR MYSQL SERVER

### Type and Networking:

1. **Config Type:**
   - Seleccionar: **"Development Computer"**
   - Puerto: **3306** (dejar por defecto)
   - ✅ Marcar: **"Open Windows Firewall ports for network access"**
   - Click en **"Next"**

### Authentication Method:

2. **Authentication Method:**
   - Seleccionar: **"Use Strong Password Encryption"** (Recomendado)
   - Click en **"Next"**

### Accounts and Roles:

3. **Root Password:**
   - Ingresar contraseña root: `HeroesPatria2025DB!`
   - Confirmar contraseña
   - **⚠️ IMPORTANTE: Guardar esta contraseña**

4. **MySQL User Accounts (Opcional pero recomendado):**
   - Click en **"Add User"**
   - User Name: `bge_user`
   - Host: `localhost`
   - Password: `HeroesPatria2025DB!`
   - Role: **"DB Admin"**
   - Click en **"OK"**
   - Click en **"Next"**

### Windows Service:

5. **Configure MySQL Server as Windows Service:**
   - ✅ **"Configure MySQL Server as a Windows Service"**
   - Service Name: `MySQL80` (o el que aparezca)
   - ✅ **"Start the MySQL Server at System Startup"**
   - Run Windows Service as: **"Standard System Account"**
   - Click en **"Next"**

### Server File Permissions:

6. **Server File Permissions:**
   - Dejar opciones por defecto
   - Click en **"Next"**

### Apply Configuration:

7. **Apply Configuration:**
   - Click en **"Execute"**
   - Esperar a que todos los pasos se completen con ✅
   - Click en **"Finish"**

8. **Product Configuration:**
   - Click en **"Next"**
   - Click en **"Finish"**

---

## 📋 PASO 4: VERIFICAR INSTALACIÓN

### Método 1: Desde CMD/PowerShell

```cmd
# Abrir CMD o PowerShell
mysql --version

# Debería mostrar algo como:
# mysql  Ver 8.0.XX for Win64 on x86_64
```

### Método 2: Conectarse a MySQL

```cmd
mysql -u root -p
# Ingresar contraseña: HeroesPatria2025DB!

# Deberías ver:
# Welcome to the MySQL monitor...
# mysql>

# Salir:
exit
```

### Método 3: Verificar servicio de Windows

```cmd
sc query MySQL80

# Debería mostrar:
# STATE : 4  RUNNING
```

---

## 📋 PASO 5: CREAR BASE DE DATOS Y USUARIO

### Conectarse como root:

```cmd
mysql -u root -p
# Ingresar contraseña root
```

### Ejecutar comandos SQL:

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS heroes_patria_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Crear usuario (si no lo creaste en el instalador)
CREATE USER IF NOT EXISTS 'bge_user'@'localhost'
IDENTIFIED BY 'HeroesPatria2025DB!';

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'bge_user';

-- Salir
EXIT;
```

---

## 📋 PASO 6: PROBAR CONEXIÓN CON EL PROYECTO

### Desde el proyecto BGE:

```cmd
cd C:\03 BachilleratoHeroesWeb
node backend/scripts/setup-egresados-table.js
```

**Resultado esperado:**
```
🔌 Conectando a la base de datos...
✅ Conexión establecida
📋 Creando tabla egresados...
✅ Tabla egresados creada exitosamente
```

---

## 🔧 CONFIGURAR VARIABLES DE ENTORNO (Ya están en .env)

Tu archivo `.env` ya tiene la configuración correcta:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=bge_user
DB_PASSWORD=HeroesPatria2025DB!
DB_NAME=heroes_patria_db
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "mysql: command not found"

**Solución:** Agregar MySQL a PATH:

1. Buscar la ruta de instalación (generalmente):
   ```
   C:\Program Files\MySQL\MySQL Server 8.0\bin
   ```

2. Agregar a PATH:
   - Windows + R → `sysdm.cpl`
   - Pestaña "Opciones avanzadas"
   - "Variables de entorno"
   - En "Variables del sistema", editar "Path"
   - Agregar: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
   - OK → OK → Reiniciar CMD

### Error: "Access denied for user 'bge_user'@'localhost'"

**Solución:** Verificar usuario y permisos:

```sql
mysql -u root -p

-- Verificar usuario
SELECT User, Host FROM mysql.user WHERE User = 'bge_user';

-- Recrear usuario si es necesario
DROP USER IF EXISTS 'bge_user'@'localhost';
CREATE USER 'bge_user'@'localhost' IDENTIFIED BY 'HeroesPatria2025DB!';
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'bge_user'@'localhost';
FLUSH PRIVILEGES;
```

### Servicio MySQL no inicia

**Solución:**

```cmd
# Verificar estado
sc query MySQL80

# Iniciar servicio
net start MySQL80

# O desde Services (services.msc)
# Buscar MySQL80 → Click derecho → Iniciar
```

---

## ✅ CHECKLIST POST-INSTALACIÓN

- [ ] MySQL Installer descargado e instalado
- [ ] Contraseña root configurada: `HeroesPatria2025DB!`
- [ ] Usuario `bge_user` creado con contraseña: `HeroesPatria2025DB!`
- [ ] Base de datos `heroes_patria_db` creada
- [ ] Servicio `MySQL80` corriendo
- [ ] Comando `mysql --version` funciona
- [ ] Script `setup-egresados-table.js` ejecuta sin errores

---

## 📞 PRÓXIMOS PASOS

Una vez completada la instalación:

1. ✅ Ejecutar: `node backend/scripts/setup-egresados-table.js`
2. ✅ Verificar que la tabla `egresados` se creó
3. ✅ Continuar con la creación de la API CRUD
4. ✅ Crear el panel de visualización en el dashboard

---

**Tiempo estimado de instalación:** 15-20 minutos

**¿Necesitas ayuda?** Avísame en qué paso estás y te ayudo a resolverlo.
