# Guía de Migración de localStorage a PostgreSQL

## 📋 Descripción

Este script permite migrar datos del CMS que puedan existir en localStorage del navegador a las tablas de PostgreSQL correspondientes.

## ⚠️ Importante

- Este script está diseñado para ejecutarse **una sola vez** cuando sea necesario migrar datos históricos.
- Los datos NO se eliminan automáticamente de localStorage para permitir verificación antes de la limpieza final.
- La migración se ejecuta **en el navegador** mediante la consola de desarrollador.

## 🚀 Cómo usar

### Paso 1: Abrir la consola de desarrollador

1. Abrir el navegador (Chrome, Firefox, Edge, etc.)
2. Navegar a `http://localhost:3000/admin-dashboard.html`
3. Iniciar sesión como administrador
4. Abrir la consola de desarrollador:
   - **Windows/Linux:** `F12` o `Ctrl + Shift + J`
   - **Mac:** `Cmd + Option + J`

### Paso 2: Cargar el script

Copiar el contenido completo del archivo `migrate-localStorage-to-postgresql.js` y pegarlo en la consola.

### Paso 3: Ejecutar la migración

En la consola, ejecutar:

```javascript
migrateLocalStorageToPG()
```

### Paso 4: Revisar el resumen

El script mostrará un resumen detallado de la migración:

```
📊 [MIGRACIÓN] RESUMEN FINAL:
=====================================
📰 NOTICIAS:
   Encontradas: 5
   Migradas: 5
   Errores: 0

📅 EVENTOS:
   Encontrados: 3
   Migrados: 3
   Errores: 0
...
```

### Paso 5: Verificar en la base de datos

Verificar que los datos se migraron correctamente:

```bash
# Verificar noticias
curl http://localhost:3000/api/noticias

# Verificar eventos
curl http://localhost:3000/api/eventos

# Verificar avisos
curl http://localhost:3000/api/avisos

# Verificar comunicados
curl http://localhost:3000/api/comunicados
```

### Paso 6: Limpiar localStorage (Opcional)

⚠️ **SOLO si la migración fue exitosa y los datos están verificados en PostgreSQL**, ejecutar:

```javascript
cleanupLocalStorage()
```

Esta función mostrará un diálogo de confirmación antes de eliminar los datos.

## 📝 Formato de datos esperado

El script busca datos en localStorage con las siguientes claves:

- `noticias`
- `eventos`
- `avisos`
- `comunicados`

Los datos deben estar en formato JSON array. Ejemplos:

### Noticias
```json
[
  {
    "titulo": "Título de la noticia",
    "contenido": "Contenido completo...",
    "categoria": "Académico",
    "estado": "activo",
    "autor": "Nombre del autor"
  }
]
```

### Eventos
```json
[
  {
    "titulo": "Nombre del evento",
    "descripcion": "Descripción del evento",
    "fecha": "2025-11-01",
    "lugar": "Auditorio",
    "categoria": "Cultural"
  }
]
```

## 🔍 Troubleshooting

### No se encontraron datos

Si el script muestra "No se encontraron [tipo] en localStorage", significa que no hay datos que migrar para ese tipo de contenido.

### Errores durante la migración

Si hay errores, revisar:

1. Que el servidor backend esté corriendo (`localhost:3000`)
2. Que la base de datos PostgreSQL esté conectada
3. Que los endpoints de la API estén funcionando
4. Los logs en la consola para detalles del error

### Verificar localStorage manualmente

Para ver qué hay en localStorage:

```javascript
// Ver todas las claves
Object.keys(localStorage)

// Ver datos específicos
localStorage.getItem('noticias')
localStorage.getItem('eventos')
```

## 📊 Estadísticas de la migración

El script retorna un objeto con estadísticas detalladas:

```javascript
const resultado = await migrateLocalStorageToPG();
console.log(resultado);
```

## ⚙️ Opciones de configuración

El script utiliza el endpoint base `/api/` por defecto. Si tu configuración es diferente, modifica la constante `apiBase` en el código.

## 🛡️ Seguridad

- El script requiere que el usuario esté autenticado como administrador
- No hace cambios destructivos en localStorage a menos que se ejecute `cleanupLocalStorage()`
- Todas las operaciones se registran en la consola para auditoría

## 📞 Soporte

Si encuentras problemas durante la migración, contacta al equipo de desarrollo con:

1. Capturas de pantalla de la consola
2. Resumen de la migración
3. Cualquier mensaje de error
