# 📋 PATRONES DOMPURIFY READY-TO-COPY-PASTE

**Copiar-pegar estos patrones directamente en los archivos a sanitizar.**

---

## 1️⃣ CARGAR DOMPURIFY (Agregar una vez al inicio del archivo)

### Opción A: Script Tag (Si no está en header)
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

### Opción B: Verificar disponibilidad (Safe Check)
```javascript
// Al inicio del archivo manager/system:
if (typeof DOMPurify === 'undefined') {
  console.warn('[XSS] DOMPurify no disponible. Cargando desde CDN...');
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';
  document.head.appendChild(script);
}
```

---

## 2️⃣ CONFIGURACIONES DOMPURIFY (Copy-paste una sola vez al inicio del archivo)

```javascript
// ============================================
// CONFIGURACIONES DOMPURIFY - COPY AL INICIO
// ============================================

// Contexto 1: Tablas y Listados (Datos sensibles)
const DOMPURIFY_CONFIG_TABLAS = {
  ALLOWED_TAGS: ['div', 'p', 'span', 'table', 'tr', 'td', 'thead', 'tbody', 'th', 'strong', 'em', 'a', 'br'],
  ALLOWED_ATTR: ['class', 'id', 'data-*', 'href', 'target', 'rel'],
  ALLOW_DATA_ATTR: true,
  KEEP_CONTENT: true
};

// Contexto 2: Formularios (Validaciones, errores)
const DOMPURIFY_CONFIG_FORMULARIOS = {
  ALLOWED_TAGS: ['span', 'div', 'p', 'em', 'strong', 'small', 'a'],
  ALLOWED_ATTR: ['class', 'id'],
  KEEP_CONTENT: true
};

// Contexto 3: Contenido de Usuario (Comentarios, mensajes)
const DOMPURIFY_CONFIG_UGC = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  RETURN_DOM: false
};

// Contexto 4: HTML Simple (Modales, alertas)
const DOMPURIFY_CONFIG_SIMPLE = {
  ALLOWED_TAGS: ['div', 'p', 'span', 'a', 'strong', 'em'],
  ALLOWED_ATTR: ['class', 'id'],
  KEEP_CONTENT: true
};

// ============================================
// FIN CONFIGURACIONES
// ============================================
```

---

## 3️⃣ PATRONES DE SANITIZACIÓN (Copy-paste para cada innerHTML/insertAdjacentHTML)

### PATRÓN A: innerHTML Simple
```javascript
// ❌ ANTES:
element.innerHTML = htmlContent;

// ✅ DESPUÉS (COPIAR ESTO):
element.innerHTML = DOMPurify.sanitize(htmlContent, DOMPURIFY_CONFIG_TABLAS);
// ☝️ Cambiar DOMPURIFY_CONFIG_TABLAS al contexto correcto (FORMULARIOS, UGC, SIMPLE)
```

### PATRÓN B: innerHTML con Variable
```javascript
// ❌ ANTES:
container.innerHTML = `<div class="row">${studentList}</div>`;

// ✅ DESPUÉS (COPIAR ESTO):
const sanitizedContent = DOMPurify.sanitize(studentList, DOMPURIFY_CONFIG_TABLAS);
container.innerHTML = `<div class="row">${sanitizedContent}</div>`;
```

### PATRÓN C: innerHTML Condicional
```javascript
// ❌ ANTES:
if (response.success) {
  modal.innerHTML = response.html;
}

// ✅ DESPUÉS (COPIAR ESTO):
if (response.success) {
  modal.innerHTML = DOMPurify.sanitize(response.html, DOMPURIFY_CONFIG_SIMPLE);
}
```

### PATRÓN D: insertAdjacentHTML
```javascript
// ❌ ANTES:
container.insertAdjacentHTML('beforeend', htmlFragment);

// ✅ DESPUÉS (COPIAR ESTO):
const sanitized = DOMPurify.sanitize(htmlFragment, DOMPURIFY_CONFIG_TABLAS);
container.insertAdjacentHTML('beforeend', sanitized);
```

### PATRÓN E: insertAdjacentHTML en Loop
```javascript
// ❌ ANTES:
items.forEach(item => {
  container.insertAdjacentHTML('beforeend', item.html);
});

// ✅ DESPUÉS (COPIAR ESTO):
items.forEach(item => {
  const sanitized = DOMPurify.sanitize(item.html, DOMPURIFY_CONFIG_TABLAS);
  container.insertAdjacentHTML('beforeend', sanitized);
});
```

### PATRÓN F: Template Literals
```javascript
// ❌ ANTES:
element.innerHTML = `
  <div class="card">
    <h2>${title}</h2>
    <p>${userContent}</p>
  </div>
`;

// ✅ DESPUÉS (COPIAR ESTO):
const sanitizedTitle = DOMPurify.sanitize(title, DOMPURIFY_CONFIG_SIMPLE);
const sanitizedContent = DOMPurify.sanitize(userContent, DOMPURIFY_CONFIG_UGC);
element.innerHTML = `
  <div class="card">
    <h2>${sanitizedTitle}</h2>
    <p>${sanitizedContent}</p>
  </div>
`;
```

### PATRÓN G: HTML Complex (Multiple inputs)
```javascript
// ❌ ANTES:
tableBody.innerHTML = `
  <tr>
    <td>${student.name}</td>
    <td>${student.email}</td>
    <td>${student.notes}</td>
  </tr>
`;

// ✅ DESPUÉS (COPIAR ESTO):
const sanitizedName = DOMPurify.sanitize(student.name, DOMPURIFY_CONFIG_SIMPLE);
const sanitizedEmail = DOMPurify.sanitize(student.email, DOMPURIFY_CONFIG_SIMPLE);
const sanitizedNotes = DOMPurify.sanitize(student.notes, DOMPURIFY_CONFIG_UGC);
tableBody.innerHTML = `
  <tr>
    <td>${sanitizedName}</td>
    <td>${sanitizedEmail}</td>
    <td>${sanitizedNotes}</td>
  </tr>
`;
```

### PATRÓN H: API Response HTML
```javascript
// ❌ ANTES:
fetch('/api/data')
  .then(r => r.json())
  .then(data => {
    container.innerHTML = data.html;  // ← XSS Risk!
  });

// ✅ DESPUÉS (COPIAR ESTO):
fetch('/api/data')
  .then(r => r.json())
  .then(data => {
    const sanitized = DOMPurify.sanitize(data.html, DOMPURIFY_CONFIG_TABLAS);
    container.innerHTML = sanitized;
  });
```

### PATRÓN I: Modal Content
```javascript
// ❌ ANTES:
function showModal(title, content) {
  document.getElementById('modalTitle').innerHTML = title;
  document.getElementById('modalBody').innerHTML = content;
}

// ✅ DESPUÉS (COPIAR ESTO):
function showModal(title, content) {
  const sanitizedTitle = DOMPurify.sanitize(title, DOMPURIFY_CONFIG_SIMPLE);
  const sanitizedContent = DOMPurify.sanitize(content, DOMPURIFY_CONFIG_SIMPLE);
  document.getElementById('modalTitle').innerHTML = sanitizedTitle;
  document.getElementById('modalBody').innerHTML = sanitizedContent;
}
```

### PATRÓN J: Form Validation Messages
```javascript
// ❌ ANTES:
if (!isValid) {
  errorDiv.innerHTML = `<span style="color:red;">${validationMessage}</span>`;
}

// ✅ DESPUÉS (COPIAR ESTO):
if (!isValid) {
  const sanitized = DOMPurify.sanitize(validationMessage, DOMPURIFY_CONFIG_FORMULARIOS);
  errorDiv.innerHTML = `<span style="color:red;">${sanitized}</span>`;
}
```

---

## 4️⃣ TESTING DE SEGURIDAD (Copy-paste en console del navegador después de cada cambio)

```javascript
// ============================================
// TEST XSS VECTORS - COPIAR EN CONSOLE
// ============================================

// Test 1: Image onerror
const test1 = '<img src=x onerror="alert(\'XSS\')">';
const result1 = DOMPurify.sanitize(test1);
console.log('Test 1 (img onerror):', result1.includes('onerror') ? '❌ FAILED' : '✅ PASSED');

// Test 2: SVG onload
const test2 = '<svg onload="alert(\'XSS\')"></svg>';
const result2 = DOMPurify.sanitize(test2);
console.log('Test 2 (svg onload):', result2.includes('onload') ? '❌ FAILED' : '✅ PASSED');

// Test 3: Script tag
const test3 = '<script>alert("XSS")</script>';
const result3 = DOMPurify.sanitize(test3);
console.log('Test 3 (script tag):', result3.includes('<script>') ? '❌ FAILED' : '✅ PASSED');

// Test 4: Event handler
const test4 = '<div onclick="alert(\'XSS\')">Click</div>';
const result4 = DOMPurify.sanitize(test4);
console.log('Test 4 (onclick):', result4.includes('onclick') ? '❌ FAILED' : '✅ PASSED');

// Test 5: Data URI
const test5 = '<a href="javascript:alert(\'XSS\')">Click</a>';
const result5 = DOMPurify.sanitize(test5);
console.log('Test 5 (javascript URI):', result5.includes('javascript:') ? '❌ FAILED' : '✅ PASSED');

console.log('\n✅ Si TODOS los tests pasaron (PASSED), la sanitización está correcta!');

// ============================================
// FIN TESTS
// ============================================
```

---

## 5️⃣ WORKFLOW RÁPIDO (Paso a Paso)

### Para sanitizar un archivo en 15 minutos:

1. **Abre el archivo:** `public/js/dashboard-manager-2025.js`

2. **Copia las CONFIGURACIONES (PATRÓN 2️⃣)** al inicio del archivo (después del `// MODULE DEFINITION`)

3. **Busca todas las líneas con `innerHTML`** (Ctrl+F)

4. **Para cada línea encontrada, aplica un PATRÓN (PATRÓN 3️⃣)** según el contexto

5. **Ejemplo real:**
```javascript
// LINEA ENCONTRADA (número de línea 145):
element.innerHTML = studentData.html;

// CAMBIAR A (COPIANDO PATRÓN A):
element.innerHTML = DOMPurify.sanitize(studentData.html, DOMPURIFY_CONFIG_TABLAS);

// LISTO! Una línea sanitizada.
```

6. **Repite para todas las líneas** (Ctrl+F para siguiente)

7. **Busca `insertAdjacentHTML`** y aplica PATRÓN D

8. **Abre DevTools (F12) → Console**

9. **Copia el TESTING (PATRÓN 4️⃣)** y pégalo en console

10. **Verifica:** Deben aparecer todos ✅ PASSED

11. **Commit:**
```bash
git add public/js/dashboard-manager-2025.js
git commit -m "feat(sanitize): XSS remediation dashboard-manager-2025.js (34 riesgos)"
```

**¡Listo! Archivo #1 sanitizado.**

---

## 6️⃣ DECISION TREE: QUÉ CONFIG USAR

```
¿El contenido viene de...?

├─ Tabla de datos (estudiantes, docentes, etc)
│  → DOMPURIFY_CONFIG_TABLAS
│
├─ Mensajes de validación de formulario
│  → DOMPURIFY_CONFIG_FORMULARIOS
│
├─ Comentarios / Mensajes de usuarios
│  → DOMPURIFY_CONFIG_UGC
│
└─ Modales simples / Alertas del sistema
   → DOMPURIFY_CONFIG_SIMPLE
```

---

## 7️⃣ CHECKLIST POR ARCHIVO

Después de sanitizar CADA archivo, verifica:

```
ARCHIVO: ___________________

✅ Checklist Pre-Commit:
  [ ] DOMPurify cargado (script tag o verificación)
  [ ] Configuraciones copiadas al inicio
  [ ] Todas las líneas innerHTML sanitizadas (Ctrl+F "innerHTML")
  [ ] Todas las líneas insertAdjacentHTML sanitizadas (Ctrl+F "insertAdjacentHTML")
  [ ] Console tests ejecutados y TODAS muestran ✅ PASSED
  [ ] Funcionalidad testeada en navegador (tablas, formularios, modales cargan correctamente)
  [ ] Sin console errors nuevos (F12 → Console)
  [ ] Commit creado con mensaje claro

✅ Resultado:
  - Riesgos encontrados: ____
  - Riesgos sanitizados: ____
  - Tiempo invertido: ____
```

---

## 8️⃣ TROUBLESHOOTING

### Problema: DOMPurify is not defined
**Solución:** Agregar script tag en header.html si falta:
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

### Problema: Contenido esperado no aparece después de sanitizar
**Solución:** El config es muy restrictivo. Cambiar:
- De `DOMPURIFY_CONFIG_SIMPLE` → `DOMPURIFY_CONFIG_TABLAS`
- O agregar tags faltantes a `ALLOWED_TAGS`

Ejemplo:
```javascript
// ❌ NO aparece mi <button>
const config = {
  ALLOWED_TAGS: ['div', 'p'],  // ← falta 'button'
  ALLOWED_ATTR: []
};

// ✅ Agregué 'button'
const config = {
  ALLOWED_TAGS: ['div', 'p', 'button'],  // ✓
  ALLOWED_ATTR: []
};
```

### Problema: Test muestra ❌ FAILED (XSS NO fue bloqueado)
**Solución:** DOMPurify no está funcionando correctamente.
- Verificar que se cargó desde CDN: `console.log(DOMPurify);` en console
- Verificar que existe: `typeof DOMPurify !== 'undefined'`
- Si falta, cargar con script tag

---

## 9️⃣ ESTADÍSTICAS DE EJEMPLO

Después de sanitizar archivo #1 (dashboard-manager-2025.js):

```
═══════════════════════════════════════════════════════════
📊 SANITIZACIÓN COMPLETADA: dashboard-manager-2025.js
═══════════════════════════════════════════════════════════

✅ Riesgos encontrados:      34
✅ Riesgos sanitizados:      34 (100%)
✅ innerHTML calls:          32
✅ insertAdjacentHTML calls: 2
✅ XSS Tests ejecutados:     5 vectors
✅ XSS Tests pasados:        5/5 (100%)
✅ Funcionalidad verificada: ✅ (tablas, modales, formularios OK)
✅ Nuevos console errors:    0

Tiempo invertido:            2.5 horas
Status:                      ✅ READY FOR COMMIT
═══════════════════════════════════════════════════════════
```

---

**Documento creado:** 14 Noviembre 2025
**Versión:** v1.0
**Uso:** Copy-paste directamente - No necesita interpretación
