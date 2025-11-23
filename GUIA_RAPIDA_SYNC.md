# ⚡ Guía Rápida: Sincronizar Neon → PostgreSQL Local

## 3 Pasos Simples (5 minutos)

### Paso 1: Abre CMD de Windows
```
Presiona: Windows + R
Escribe: cmd
Presiona: Enter
```

### Paso 2: Navega a la carpeta de scripts
```cmd
cd C:\03_BachilleratoHeroesWeb\backend\scripts
```

### Paso 3: Ejecuta el script de sincronización
```cmd
sync-neon-local-simple.bat
```

**Verás:** Mensajes de progreso (2-5 minutos)
- Backup de Neon
- Creación de BD local
- Restauración de datos
- Verificación

---

## Qué Verás

```
===============================================
    SINCRONIZACION NEON to PostgreSQL LOCAL
===============================================

[INFO] PostgreSQL encontrado
[INFO] Haciendo backup de Neon...
[SUCCESS] Backup completado

[INFO] Eliminando BD local si existe...
[INFO] Creando BD local 'bge_local'...
[SUCCESS] BD local creada

[INFO] Restaurando datos...
[SUCCESS] Datos restaurados

[INFO] Verificando sincronización...
[SUCCESS] Se encontraron 25 tablas en BD local

===============================================
             RESUMEN FINAL
===============================================
[SUCCESS] Sincronización completada exitosamente!

Archivo de backup: C:\03_BachilleratoHeroesWeb\backups\neon_backup_20251123_234530.dump
Base de datos local: bge_local
Host: localhost
Usuario: postgres
Tablas: 25

Próximo paso:
1. Actualiza .env.local con:
   DB_HOST=localhost
   DB_USER=postgres
   DB_NAME=bge_local

2. Reinicia tu servidor backend
   npm start
```

---

## Si Sale Error: "PostgreSQL no encontrado"

PostgreSQL **no está en tu PATH de Windows**.

### Solución Rápida (2 minutos):

**Opción A: Instalar PostgreSQL**
1. Descarga: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. Selecciona todas las herramientas (importante)
4. Instala con usuario/password predeterminados
5. Reinicia CMD
6. Vuelve a ejecutar el script

**Opción B: Agregar al PATH (si ya está instalado)**
1. Presiona: Windows + X
2. Selecciona "Sistema"
3. Haz clic en "Configuración avanzada del sistema"
4. Haz clic en "Variables de entorno"
5. Haz clic en "Editar" (variable Path)
6. Agrega: `C:\Program Files\PostgreSQL\18\bin`
7. Reinicia CMD
8. Vuelve a ejecutar el script

---

## Después de Ejecutar Exitosamente

### 1. Verifica BD Local
```cmd
psql -h localhost -U postgres -d bge_local -c "\dt"
```

Debes ver: Lista de tablas (25+ tablas)

### 2. Actualiza `.env.local`
Abre: `C:\03_BachilleratoHeroesWeb\.env.local`

```env
# Cambio de Neon a Local:
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=             (dejar vacío si no tiene contraseña)
DB_NAME=bge_local
DB_PORT=5432
DB_SSL=false
```

### 3. Reinicia Backend
```cmd
cd C:\03_BachilleratoHeroesWeb
npm start
```

Debe conectarse a BD local sin errores.

---

## Archivos Generados

```
C:\03_BachilleratoHeroesWeb\backups\
├── neon_backup_20251123_234530.dump   (Tu backup completo)
└── (archivo de log - opcional)
```

**Guarda el `.dump`** - Es tu respaldo de Neon.

---

## Datos Incluidos en Sincronización

✅ **Todas las tablas**
✅ **Todos los datos**
✅ **Todos los índices**
✅ **Todas las constrains**
✅ **Secuencias y auto-increment**

---

## Si Algo Falla

Proporciona:
1. El error exacto que viste
2. Resultado de: `psql --version`
3. Resultado de: `pg_dump --version`

Puedo ayudarte a solucionarlo.

---

## Próximo Paso Importante

Una vez sincronizado local, tu flujo de desarrollo es:
```
1. Trabajas con BD local (rápido, sin internet)
2. Periódicamente sincronizas Neon → Local (este script)
3. En producción, usas Neon
```

¡Listo! Ya puedes desarrollar sin depender de Neon para cada cambio.

---

**Creado:** 23 NOV 2025
**Estado:** ✅ Listo
