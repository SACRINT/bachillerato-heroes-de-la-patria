# 🧠 MEMORIA CENTRAL PARA CLAUDE CODE - PROYECTO BGE

**Propósito:** Claude, este es tu archivo de memoria y protocolo. Contiene tus instrucciones, el estado del proyecto y el contexto para continuar el trabajo de forma consistente.

---

## 1. 📖 INSTRUCCIÓN DE CONTINUIDAD (LEER SIEMPRE PRIMERO)

**COMANDO ESPECIAL: "continua con el proyecto BGE"**

Cuando el usuario te dé esta instrucción, tu protocolo OBLIGATORIO es:

1.  **LEER ESTOS 2 ARCHIVOS EN ORDEN:**
    1.  `docs/historia_del_proyecto.md` - Para entender la historia completa, la arquitectura y el estado actual del proyecto. **Esta es tu fuente principal de contexto.**
    2.  `CLAUDE.md` (este archivo) - Para recordar tus instrucciones y los logros más recientes.

2.  **RESUMIR** brevemente al usuario tu entendimiento del punto en que se quedó el trabajo para confirmar que tienes el contexto correcto.

3.  **RETOMAR** el trabajo desde ese punto.

---

## 2. 📜 PROTOCOLOS DE TRABAJO OBLIGATORIOS

### 2.1. Regla de la Estructura Dual (¡CRÍTICA!)

Este proyecto tiene una arquitectura de directorios dual que **DEBE** mantenerse sincronizada.

*   **Directorio Raíz (`C:\03 BachilleratoHeroesWeb\`):** Servido por `localhost:3000` (Node.js).
*   **Directorio Público (`C:\03 BachilleratoHeroesWeb\public\`):** Servido por `127.0.0.1:8080` (Estático).

**REGLA DE ORO:** Cualquier modificación a un archivo estático (HTML, JS, CSS) en la raíz, **DEBE replicarse inmediatamente** en la carpeta `public/`, y viceversa.

### 2.2. Prioridad: Modificar Antes que Crear (Protocolo de Búsqueda Eficiente)

Para evitar la duplicación de código, sigue este protocolo de búsqueda antes de crear algo nuevo:

1.  **Consultar `docs/historia_del_proyecto.md`:** Busca palabras clave de la funcionalidad que necesitas.
2.  **Usar `search_file_content` y `glob`:** Busca en el código y nombres de archivo existentes.
3.  **Analizar Archivos Candidatos:** Solo después de acotar la búsqueda, lee los archivos específicos.
4.  **Extender o Modificar:** Prioriza siempre adaptar el código existente.

### 2.3. Instrucciones de Idioma

*   **TODO en Español:** Tus respuestas, comentarios de código y documentación.

---

## 3. ✍️ PROTOCOLO DE DOCUMENTACIÓN DE CAMBIOS

El método antiguo de crear un archivo por tarea queda descontinuado. Usa este nuevo protocolo:

### 3.1. Registro de Cambios (`CHANGELOG.md`)

Al completar una tarea, **DEBES** añadir una entrada al archivo `CHANGELOG.md`.

**Formato:**
```markdown
### [Fecha] - [Título del Cambio]
*   **Tipo:** [Feature | Bugfix | Refactor | Docs]
*   **Impacto:** [Descripción del cambio.]
*   **Archivos Modificados:** `ruta/al/archivo.js`
```

### 3.2. Mensajes de Commit Descriptivos

Usa "Conventional Commits" para tus mensajes de `git commit`.

---
## 4. 🏆 REGISTRO DE LOGROS RECIENTES (Actualizar al final de cada sesión)

*   **14 de Octubre de 2025:**
    *   **Tipo:** Docs
    *   **Logro:** Se consolidó toda la documentación del proyecto en `docs/historia_del_proyecto.md`. Se crearon los archivos de memoria para agentes `MEMORIA_AGENTE.md` y `CLAUDE.md`. Se archivó la documentación antigua.
