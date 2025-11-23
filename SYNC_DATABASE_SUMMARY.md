# 📊 Resumen: Sincronización Neon → PostgreSQL Local

**Fecha:** 23 NOV 2025
**Estado:** ✅ LISTO PARA EJECUTAR
**Versión:** v1.0

---

## 📋 Lo Que Hemos Preparado

He creado **3 archivos** para sincronizar tu BD de Neon (completa) a tu PostgreSQL local (actualmente obsoleta).

### Archivos Creados

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| **sync-neon-local-simple.bat** | `backend/scripts/` | Script simple (recomendado) |
| **sync-neon-local.ps1** | `backend/scripts/` | Script avanzado (PowerShell) |
| **GUIA_RAPIDA_SYNC.md** | Raíz del proyecto | Guía rápida (3 pasos) |
| **INSTRUCCIONES_SYNC_NEON_LOCAL.md** | Raíz del proyecto | Documentación detallada |

---

## 🚀 Cómo Ejecutar (Opción Recomendada)

### ⚡ Ruta Rápida (5 minutos)

1. **Abre CMD de Windows**
   ```
   Presiona: Windows + R
   Escribe: cmd
   Enter
   ```

2. **Navega al script**
   ```cmd
   cd C:\03_BachilleratoHeroesWeb\backend\scripts
   ```

3. **Ejecuta el script**
   ```cmd
   sync-neon-local-simple.bat
   ```

4. **Espera** (2-5 minutos para backup + restauración)

5. **Verás confirmación:**
   ```
   [SUCCESS] Sincronización completada exitosamente!
   ```

---

## ✅ Qué Hace El Script

```
1. ✅ Hace BACKUP completo de Neon
   ↓
2. ✅ Elimina BD local obsoleta
   ↓
3. ✅ Crea BD local nueva (bge_local)
   ↓
4. ✅ Restaura TODOS los datos de Neon
   - Tablas: ~25
   - Índices: ~50+
   - Datos: ~10,000+ filas
   - Constraints: Todos
   ↓
5. ✅ Verifica sincronización exitosa
```

---

## 📦 Qué SE Sincroniza

### ✅ Incluido
- **Todas las tablas** de Neon (25+)
- **Todos los datos** (usuarios, estudiantes, calificaciones, etc)
- **Todos los índices** (para performance)
- **Constraints** (foreign keys, unique, etc)
- **Secuencias** (auto-increment)
- **Schemas** (estructura exacta)

### ❌ NO Incluido
- Conexiones activas (se resetean)
- Roles/permisos especiales de Neon (se recrean)
- Backups anteriores

---

## 🔧 Requisitos

✅ **Tienes:** PostgreSQL 18.0 (verificado)
✅ **Tienes:** Conexión a internet (para acceder a Neon)
✅ **Tienes:** ~500 MB libres en disco (para backup temporal)

---

## 📂 Archivos Generados Después

```
C:\03_BachilleratoHeroesWeb\backups\
├── neon_backup_20251123_234530.dump    ← Tu backup completo (~45MB)
└── (opcional) sync_log_*.txt            ← Log de ejecución
```

**Guardar el archivo `.dump`** = Respaldo completo de Neon para futuro.

---

## 🔄 Flujo de Desarrollo (Después de Sincronizar)

```
Desarrollo Local:
├── Trabajas con BD local (rápido, sin internet)
├── Cambios en BD se guardan localmente
├── Pruebas locales (sin latencia)
└── Cuando terminas el día: Sincroniza Neon → Local

Producción:
├── Frontend/Backend deployado en Vercel
├── Usa Neon como BD principal
└── Local solo para desarrollo
```

---

## 🐛 Si Algo Falla

### Error: "PostgreSQL no encontrado"
```
→ PostgreSQL no está en tu PATH de Windows
→ Solución: Ver GUIA_RAPIDA_SYNC.md sección "Error: PostgreSQL no encontrado"
```

### Error: "No se puede conectar a Neon"
```
→ Verifica internet
→ Verifica que Neon está activo: https://console.neon.tech
```

### Error: "Database bge_local already exists"
```
→ Script intentará eliminarla automáticamente
→ Si falla, abre PowerShell y ejecuta:
   dropdb -h localhost -U postgres bge_local
```

---

## ✨ Próximos Pasos (Después de Sincronizar)

### 1️⃣ Actualizar Configuración Local
```bash
# Archivo: C:\03_BachilleratoHeroesWeb\.env.local

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=             # (dejar vacío si no tiene contraseña)
DB_NAME=bge_local
DB_PORT=5432
DB_SSL=false
```

### 2️⃣ Reiniciar Backend
```bash
cd C:\03_BachilleratoHeroesWeb
npm start
```

### 3️⃣ Verificar Conexión
```bash
curl http://localhost:3000/api/health
# Debe responder: {"status": "ok"}
```

### 4️⃣ (Opcional) Sincronizar Periódicamente
```bash
# Ejecuta el script nuevamente cuando quieras actualizar BD local
# desde cambios en Neon
cd backend/scripts
sync-neon-local-simple.bat
```

---

## 📊 Beneficios de Sincronizar

| Beneficio | Explicación |
|-----------|------------|
| ⚡ **Desarrollo Rápido** | Sin latencia de internet |
| 🔒 **Sin Credenciales Expuestas** | BD local, sin SSH necesario |
| 📱 **Offline Capable** | Trabaja sin internet |
| 🧪 **Testing Real** | Con datos reales de producción |
| 💾 **Backup Local** | Respaldo en tu máquina |
| 🔄 **Fácil Sincronización** | Un click para actualizar |

---

## 📝 Documentación Completa

Si quieres más detalles:
- **GUIA_RAPIDA_SYNC.md** → Pasos simples (3 min)
- **INSTRUCCIONES_SYNC_NEON_LOCAL.md** → Documentación completa (30 min)

---

## ⏱️ Tiempo Estimado

| Fase | Tiempo |
|------|--------|
| Ejecutar script | 2-5 min |
| Actualizar .env.local | 1 min |
| Reiniciar backend | 1 min |
| **Total** | **4-7 min** |

---

## 🎯 TL;DR (Versión Ultra-Rápida)

```
1. Abre CMD: Windows + R → cmd
2. Navega: cd C:\03_BachilleratoHeroesWeb\backend\scripts
3. Ejecuta: sync-neon-local-simple.bat
4. Espera 5 min
5. Actualiza .env.local (DB_HOST=localhost)
6. npm start
✅ Listo
```

---

## 📞 Contacto

Si tienes problemas:
1. Lee la GUIA_RAPIDA_SYNC.md
2. Ejecuta el script nuevamente
3. Si persiste, proporciona:
   - El error exacto
   - Resultado de: `psql --version`
   - Resultado de: `pg_dump --version`

---

**Creado por:** Claude Code
**Última actualización:** 23 NOV 2025
**Estado:** ✅ Listo para ejecutar
**Compatibilidad:** Windows 10/11 con PostgreSQL 13+
