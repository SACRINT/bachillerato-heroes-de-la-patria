# Accesibilidad WCAG: Auditoría y Corrección de Texto Alternativo en Imágenes

**Fecha:** 23 de Noviembre de 2025
**Feature:** `wcag-alt-text-audit`
**Tarea:** Semana 27 - WCAG Compliance

---

## 1. Resumen de la Tarea

Como parte de la mejora de accesibilidad del sitio para cumplir con las directrices WCAG 2.1, se realizó una auditoría para identificar imágenes que carecían de un texto alternativo (atributo `alt`).

El texto alternativo es fundamental, ya que describe el contenido de una imagen a usuarios que utilizan lectores de pantalla y se muestra si una imagen no puede cargarse.

---

## 2. Proceso de Auditoría

1.  **Búsqueda Inicial (Fallida):** Se intentó usar una expresión regular compleja (`<img(?!.*alt=)`) para encontrar directamente las imágenes sin `alt`. La herramienta de búsqueda no soportó esta sintaxis.
2.  **Búsqueda Amplia (Exitosa):** Se realizó una nueva búsqueda para encontrar todas las ocurrencias de la etiqueta `<img>` en todos los archivos `.html` del proyecto.
3.  **Análisis de Resultados:** Se analizaron manualmente las 73 ocurrencias encontradas. La gran mayoría ya contaba con un atributo `alt` descriptivo, lo que indica buenas prácticas previas.

---

## 3. Hallazgos y Correcciones

Se identificó un único archivo con problemas de accesibilidad en sus imágenes:

-   **Archivo:** `public/gamification-center.html`
-   **Problema:** Tres etiquetas `<img>`, utilizadas para mostrar avatares de usuarios, carecían por completo del atributo `alt`.

### Correcciones Aplicadas:

Se agregaron atributos `alt` descriptivos a las tres imágenes afectadas para que los lectores de pantalla puedan anunciar correctamente el contenido de la imagen.

**1. Avatar de Ana Martinez:**
-   **Antes:** `<img src="https://ui-avatars.com/api/?name=Ana+Martinez&...">`
-   **Después:** `<img src="https://ui-avatars.com/api/?name=Ana+Martinez&..." alt="Avatar de Ana Martinez">`

**2. Avatar de Carlos Lopez:**
-   **Antes:** `<img src="https://ui-avatars.com/api/?name=Carlos+Lopez&...">`
-   **Después:** `<img src="https://ui-avatars.com/api/?name=Carlos+Lopez&..." alt="Avatar de Carlos Lopez">`

**3. Avatar de Maria Garcia:**
-   **Antes:** `<img src="https://ui-avatars.com/api/?name=Maria+Garcia&...">`
-   **Después:** `<img src="https://ui-avatars.com/api/?name=Maria+Garcia&..." alt="Avatar de Maria Garcia">`

---

## 4. Conclusión

Con estas correcciones, todas las imágenes identificadas en el proyecto ahora cuentan con texto alternativo, cumpliendo con un punto de control esencial de las directrices WCAG (Criterio de Éxito 1.1.1 - Contenido no textual).

Esta tarea mejora la experiencia para usuarios con discapacidad visual y robustece la calidad general del sitio.
