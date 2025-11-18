# 📋 TAREAS PENDIENTES - SIGUIENTES PASOS

**Fecha:** 17 de Noviembre de 2025
**Estado Base:** Modal de autenticación ✅ COMPLETADO

---

## 🎯 PROBLEMAS PENDIENTES REPORTADOS POR USUARIO

Del reporte original, quedan 4 problemas sin resolver:

### 1. ❌ Botón "Más" - NO FUNCIONAL
**Estado actual:** El botón existe pero está `display: none` (oculto)
**Ubicación:** `public/partials/header.html` línea 351
**Problema:** El menú desplegable está vacío y JS debería llenarlo

```html
<li class="nav-item dropdown" style="display: none;">  <!-- 🔴 OCULTO -->
    <a class="nav-link dropdown-toggle" href="#">Más</a>
    <ul class="dropdown-menu dropdown-menu-end" id="more-dropdown-menu">
        <!-- JS llenará esto -->
    </ul>
</li>
```

**Solución Requerida:**
- [ ] Buscar archivo JS que debería llenar `#more-dropdown-menu`
- [ ] Implementar lógica para poblar opciones del menú
- [ ] Mostrar el botón (`style="display: none"` → `display: block`)
- [ ] Validar que las opciones sean relevantes para usuario

---

### 2. ❌ Buscador PEQUEÑO y SIN FUNCIONALIDAD
**Estado actual:** Input existe pero es muy pequeño (< 100px de ancho)
**Ubicación:** `public/partials/header.html` línea 364
**Problema:** Buscador no permite escribir cómodamente, sin búsqueda implementada

```html
<input type="search" class="form-control search-input"
       id="siteSearch" placeholder="Buscar en el sitio..."
       autocomplete="off">
```

**Solución Requerida:**
- [ ] Aumentar ancho del input (min 200px recomendado)
- [ ] Implementar búsqueda en tiempo real (búsqueda con debounce)
- [ ] Conectar con API backend o índice local
- [ ] Mostrar resultados en dropdown mientras escriba

---

### 3. ❌ ESPACIOS FLOTANTES ABAJO DE LA PÁGINA
**Estado actual:** 1 elemento flotante + 2 elementos con `position: fixed`
**Problema:** Causa scroll innecesario y espacio en blanco al pie

**Investigación Requerida:**
- [ ] Identificar cuáles son esos 3 elementos flotantes
- [ ] Determinar si son necesarios o solo decorativos
- [ ] Ajustar su posicionamiento o ocultarlos
- [ ] Validar que no causen problemas de UX

---

### 4. ⚠️ HEADER PADDING - PARCIALMENTE RESUELTO
**Estado actual:** Padding reducido pero aún hay espacio
**Padding actual:** `8px 15px 8px 0px` (muy pequeño)

**Situación:**
- ✅ Logo tamaño correcto (45x45)
- ✅ Botones funcionales
- ⏳ Altura header sigue siendo grande (medida: 0px en algunos contextos)

**Validación Requerida:**
- [ ] Revisar altura total del header
- [ ] Verificar si el usuario está satisfecho con el espacio
- [ ] Si no, reducir aún más el padding vertical

---

## 📊 RESUMEN DE CAMBIOS PENDIENTES

| # | Tarea | Prioridad | Dificultad | Tiempo Estimado |
|---|-------|-----------|-----------|-----------------|
| 1 | Botón "Más" funcional | 🔴 ALTA | Media | 30 min |
| 2 | Buscador grande + búsqueda | 🔴 ALTA | Media-Alta | 45 min |
| 3 | Investigar elementos flotantes | 🟡 MEDIA | Baja | 15 min |
| 4 | Verificar header padding | 🟢 BAJA | Baja | 10 min |

**Total Estimado:** ~100 minutos (1.5 horas)

---

## 🔧 ARCHIVOS A REVISAR

### Para el botón "Más":
- `public/js/main.js` - Búscar setup de dropdown
- `public/partials/header.html` - Línea 351-358
- Buscar en `/public/js/` por "more-dropdown" o "Más"

### Para el buscador:
- `public/js/global-search.js` (probable)
- `public/partials/header.html` - Línea 362-373
- Backend: `/api/search` o similar

### Para elementos flotantes:
- DevTools → Inspect → Buscar elementos en bottom
- Probables: `.floating-toolbar`, `.floating-button`, `[data-floating]`

---

## ✅ CHECKLIST PARA COMPLETAR

### Sesión Actual (COMPLETADA)
- [x] Arreglar modal de autenticación
- [x] Verificar que login funciona
- [x] Commit a GitHub
- [x] Documentar cambios

### Próxima Sesión (PROPUESTA)
- [ ] Implementar botón "Más"
- [ ] Ampliar y funcionalizar buscador
- [ ] Resolver elementos flotantes
- [ ] Testing final de header
- [ ] Commit y push a GitHub

---

## 📝 NOTAS

- El usuario reportó: "algo se esta creando abajo del footer"
- Esto podría ser un elemento flotante no removido de sesión anterior
- Requiere inspección visual en DevTools para identificar
- El spacing extra podría estar relacionado con elemento flotante

---

## 🎬 PRÓXIMO PASO RECOMENDADO

**Cuando usuario esté listo para continuar:**

```bash
# 1. Revisar header nuevamente
npm start
# Abrir http://localhost:3000/index.html en Chrome

# 2. DevTools Inspection
# F12 → Elements → Buscar elementos flotantes

# 3. Confirmar satisfacción con:
# ✅ Logo tamaño
# ✅ Header padding
# ✅ Modal login

# 4. Si todo bien, proceder con tareas pendientes
```

---

**Commit Base:** `07a4b6f`
**Estado:** Listo para próxima fase
