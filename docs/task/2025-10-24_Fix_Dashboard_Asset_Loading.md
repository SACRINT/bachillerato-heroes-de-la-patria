# Bitácora de Tarea: Corrección de Carga de Assets y Proceso de Build

**Fecha:** 24 de Octubre, 2025

## 1. Objetivo Inicial

El objetivo era corregir un bug en el `admin-dashboard.html` donde las pestañas de "Estudiantes" y "Docentes" no cargaban datos.

## 2. Diagnóstico y Descubrimiento de Problemas Raíz

- **Error Superficial:** El error inicial parecía ser un selector DOM incorrecto en los archivos `dynamic-student-loader.js` y `dynamic-teacher-loader.js`.
- **Descubrimiento Crítico:** Al intentar aplicar el fix, se observó que ningún cambio en los directorios `js/` o `css/` se reflejaba en el sitio desplegado.
- **Causa Raíz:** Se descubrió una duplicación masiva de directorios de código fuente (`js`, `css`, `data`, `partials`, etc.) dentro de la carpeta `public`. Dado que Vercel sirve `public` como el directorio raíz, siempre estaba sirviendo estos archivos duplicados y obsoletos, ignorando por completo el proceso de `build` y cualquier cambio en los directorios de origen correctos.

## 3. Plan de Acción y Correcciones Implementadas

Se determinó que era necesaria una refactorización completa de la estructura de assets y del proceso de `build` para alinear el proyecto con las prácticas estándar.

### 3.1. Limpieza de la Carpeta `public`

- Con la aprobación del usuario, se eliminaron todos los directorios de código fuente duplicados de `public/` para eliminar el conflicto.
- **Directorios Eliminados de `public/`:** `css`, `js`, `data`, `partials`, `lib`, `templates`.

### 3.2. Corrección del Proceso de Build (Webpack)

- **Análisis de `webpack.config.cjs`:** Se observó que el archivo de configuración de Webpack estaba configurado para generar bundles en `public/dist/` pero el HTML no los utilizaba.
- **Instalación de `copy-webpack-plugin`:** Se añadió este plugin para manejar correctamente los assets estáticos que no son parte del bundle principal, como los parciales de HTML.
- **Configuración de `CopyWebpackPlugin`:** Se configuró el plugin para copiar el directorio `partials/` a `public/partials/` durante cada `build`, asegurando que las llamadas `fetch` del lado del cliente al `header.html` funcionen correctamente.

### 3.3. Refactorización de `public/admin-dashboard.html`

- **Eliminación de CSS Hardcodeado:** Se eliminó la etiqueta `<link rel="stylesheet" href="css/style.css">`.
- **Inyección de CSS vía JS:** Se añadió `import '../css/style.css';` al archivo `js/admin-dashboard.js`, permitiendo que Webpack procese y bundle el CSS.
- **Eliminación de Scripts Hardcodeados:** Se eliminó un bloque de más de 20 etiquetas `<script>` que apuntaban a archivos individuales en `js/`. Esto permite que `HtmlWebpackPlugin` inyecte automáticamente los bundles correctos y optimizados (`admin.bundle.js`, `vendors.bundle.js`, etc.).
- **Corrección de `fetch` de Datos:** Se modificó una llamada `fetch` que apuntaba a `data/somefile.json` para que ahora apunte a la API (`/api/somefile`), centralizando la obtención de datos.

### 3.4. Verificación de la API

- A raíz de una advertencia del usuario, se investigó `api/app.js` para asegurar que la eliminación de `public/data` no rompiera la API.
- Se confirmó que la API lee correctamente desde el directorio `data/` raíz del proyecto y no desde `public/data`, por lo que no se vio afectada por la limpieza.

## 4. Commits y Despliegue

- Se agruparon todos los cambios (limpieza de `public`, refactorización de `webpack.config.cjs` y `admin-dashboard.html`, y la importación de CSS en JS) en un único commit.
- **Commit:** `refactor(build): Clean up HTML asset loading and Webpack config` (ID: `472e1ca`)
- Se subieron los cambios a la rama `fix/dashboard-tabs` para su despliegue en Vercel.

## 5. Siguientes Pasos

- Esperar la finalización del despliegue en Vercel.
- Realizar una verificación exhaustiva del `admin-dashboard.html` en el entorno de producción utilizando las herramientas de desarrollo de Chrome para confirmar que todos los assets cargan correctamente y que la funcionalidad de las pestañas ha sido restaurada.
