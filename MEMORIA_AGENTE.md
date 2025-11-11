# 🧠 MEMORIA CENTRAL Y PROTOCOLO OPERATIVO PARA AGENTES DE IA
## Proyecto: Bachillerato General Estatal "Héroes de la Patria"

**Propósito:** Este documento es la memoria central y el conjunto de instrucciones operativas para cualquier agente de IA que trabaje en este proyecto.

**Instrucción Primordial:** Antes de realizar cualquier acción, lee y comprende este documento en su totalidad.

---

## 1. 📖 La Fuente Única de Verdad (Contexto del Proyecto)

Para comprender el proyecto, su historia, arquitectura, estado actual y planes a futuro, existe un **único documento maestro** que DEBES leer al iniciar cualquier sesión de trabajo:

### 📄 **[docs/historia_del_proyecto.md](docs/historia_del_proyecto.md)**

Este archivo reemplaza toda la documentación fragmentada anterior y contiene el contexto consolidado de todo el proyecto. **La lectura de este documento es tu primera y más importante tarea para recuperar el contexto completo y evitar tener que re-analizar todo el código base, ahorrando tiempo y recursos.**

---

## 2. 📜 Protocolo de Trabajo Obligatorio

### 2.1. Instrucción de Continuidad del Proyecto

Cuando el usuario te pida continuar con el proyecto (ej. "continua con el proyecto BGE"), tu protocolo debe ser:

1.  **LEER** el documento maestro: `docs/historia_del_proyecto.md`.
2.  **IDENTIFICAR** la última tarea documentada o el último estado conocido del proyecto (se encuentra al final de la sección 9 del documento).
3.  **RESUMIR** brevemente al usuario tu entendimiento del punto en que se quedó el trabajo para confirmar que tienes el contexto correcto.
4.  **RETOMAR** el trabajo desde ese punto.

### 2.2. Regla de la Estructura Dual (¡CRÍTICA!)

Este proyecto tiene una arquitectura de directorios dual que **DEBE** mantenerse sincronizada en todo momento.

*   **Directorio Raíz (`C:\03 BachilleratoHeroesWeb\`):** Usado por el servidor de desarrollo de Node.js (`localhost:3000`).
*   **Directorio Público (`C:\03 BachilleratoHeroesWeb\public\`):** Usado por el servidor estático y representa la versión para despliegue.

**REGLA DE ORO:** Cualquier modificación, creación o eliminación de un archivo estático (HTML, JS, CSS, imágenes) en la raíz, **DEBE replicarse inmediatamente** en la carpeta `public/`, y viceversa.

### 2.3. Prioridad: Modificar Antes que Crear (Protocolo de Búsqueda Eficiente)

Para evitar la duplicación de código y el consumo innecesario de recursos, sigue este protocolo de búsqueda antes de escribir cualquier función o archivo nuevo:

1.  **Consultar la Documentación Maestra:** Primero, busca palabras clave relevantes dentro del archivo `docs/historia_del_proyecto.md`. Este documento resume todos los sistemas y funcionalidades principales. Es la forma más rápida de saber si algo ya existe.

2.  **Usar Búsqueda de Contenido (`search_file_content`):** Si la documentación no es concluyente, usa la herramienta `search_file_content` con patrones de texto o expresiones regulares para encontrar fragmentos de código relevantes en todo el proyecto. Por ejemplo, para una función de pagos, busca "payment", "pago", "stripe".

3.  **Usar Búsqueda de Archivos (`glob`):** Para encontrar archivos con nombres relevantes, usa la herramienta `glob`. Por ejemplo, `glob(pattern="**/*auth*")` para encontrar archivos relacionados con la autenticación.

4.  **Analizar el Código Específico:** Solo después de que los pasos anteriores te hayan dado una lista corta de archivos candidatos, usa `read_file` para analizar su contenido en detalle.

5.  **Modificar o Extender:** Si encuentras una funcionalidad similar, prioriza siempre extenderla o modificarla antes de crear una nueva.

6.  **Consolidar:** Si encuentras funcionalidades duplicadas, propone un plan para consolidarlas.

### 2.4. Instrucciones de Idioma

*   **TODO en Español:** Todas tus respuestas, comentarios en el código y la documentación que generes deben estar en español.

---

## 3. ✍️ Protocolo de Documentación de Cambios

El antiguo método de crear un archivo `.md` por cada tarea ha sido descontinuado para evitar la acumulación de archivos. Se reemplaza por el siguiente estándar profesional:

### 3.1. Registro de Cambios (`CHANGELOG.md`)

Para cada tarea significativa completada (un bug corregido, una nueva función implementada), **DEBES** añadir una entrada concisa al archivo `CHANGELOG.md` en la raíz del proyecto.

**Formato de la Entrada:**
```markdown
### [Fecha: DD de Mes de AAAA] - [Título del Cambio]
*   **Tipo:** [Feature | Bugfix | Refactor | Docs | Chore]
*   **Impacto:** [Descripción breve del cambio y qué problema resuelve o qué valor añade.]
*   **Archivos Modificados:**
    *   `ruta/al/archivo1.js`
    *   `ruta/al/archivo2.html`
```

### 3.2. Mensajes de Commit Descriptivos

Los mensajes de `git commit` son una forma primaria de documentación. Deben ser claros y seguir la convención "Conventional Commits".

**Formato del Commit:**
```
feat: Añadir panel de visualización de egresados

Se integra un nuevo panel en el dashboard de administración que consume la API de `/api/egresados` para mostrar estadísticas, una tabla con filtros y un modal de detalles.

Resuelve la necesidad de visualizar los datos de egresados que se almacenan en la base de datos.
```

---

## 4. 🔄 Ciclo de Vida de la Documentación Maestra

### `docs/historia_del_proyecto.md`
*   **¿Quién lo actualiza?** Nadie, en el día a día.
*   **¿Cuándo se actualiza?** Es un documento histórico. Solo se debería añadir una nueva sección si se completa un hito masivo de desarrollo que dure varios meses (ej. la finalización de una de las grandes Fases del proyecto). **No se usa para registrar cambios pequeños o diarios.**

### `MEMORIA_AGENTE.md` (Este archivo)
*   **¿Quién lo actualiza?** El Agente Principal (actualmente tú).
*   **¿Cuándo se actualiza?** Solo si el **protocolo de trabajo fundamental cambia**. Por ejemplo, si se decide abandonar la estructura dual o se adopta un nuevo sistema de documentación.

---

## 5. 🤖 Estructura de Agentes (Contexto Histórico)

El proyecto fue concebido para ser trabajado por un sistema híbrido de agentes:

*   **Agente Padre (Principal):** Orquestador e implementador final.
*   **Equipo Central (Planificadores):** 5 agentes especializados en Arquitectura, UI/UX, Backend, Base de Datos y DevOps.
*   **Especialistas de Consulta (Auditores):** 4 agentes para requisitos, seguridad, QA y frontend.

Tú operas como el **Agente Padre**.
