# Ejemplos Detallados de Transformación - Patrón B

**Archivo:** `EJEMPLOS_TRANSFORMACION_PATTERN_B.md`
**Creado:** 12 de Noviembre de 2025

---

## 1. Ejemplo Simple: Parámetro Numérico

### Ubicación: `public/js/admin-dashboard.js`

**ANTES:**
```html
<button onclick="deleteNoticia(42)">Eliminar Noticia</button>
```

**DESPUÉS:**
```html
<button data-action="delete-noticia" data-id="42">Eliminar Noticia</button>
```

**En JavaScript (Event Handler Registry):**
```javascript
// Cuando usuario hace click en el botón:
// 1. Se dispara el delegated event listener
// 2. Lee data-action="delete-noticia"
// 3. Busca en actionMap: deleteNoticia ✓
// 4. Extrae data-id="42"
// 5. Llama: deleteNoticia(event, 42)

document.addEventListener('click', function(event) {
  const target = event.target;
  const action = target.getAttribute('data-action'); // "delete-noticia"

  if (action && actionMap[action]) {
    const fn = actionMap[action]; // deleteNoticia

    const params = [];
    for (let attr of target.attributes) {
      if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
        // data-id="42" → params.push(42)
        params.push(Number(attr.value)); // Type inference
      }
    }

    fn.apply(target, [event, ...params]); // deleteNoticia(event, 42)
  }
});
```

---

## 2. Ejemplo Intermedio: Parámetro String (Email)

### Ubicación: `public/js/admin-dashboard.js`

**ANTES:**
```html
<button onclick="editTeacher('john@example.com')">Editar Docente</button>
```

**DESPUÉS:**
```html
<button data-action="edit-teacher" data-email="john@example.com">Editar Docente</button>
```

**Lógica de Heurística:**
```javascript
// Función: generateDataAttributeName()
// Parámetro: 'john@example.com' (string con @)
// → Heurística 2 detecta email
// → Retorna: "data-email"

function generateDataAttributeName(params, functionName, paramIndex, paramInfo) {
  // Heurística 2: Si parámetro string contiene @
  if (paramInfo.type === 'string' && paramInfo.value.includes('@')) {
    return 'data-email'; // ← ESTE CASO
  }
  // ...
}
```

**En JavaScript (Extracción):**
```javascript
// Valor extraído: "john@example.com" (string puro)
// No requiere conversión (JSON.parse falla, se mantiene como string)
// Llamada: editTeacher(event, "john@example.com")
```

---

## 3. Ejemplo Avanzado: Múltiples Parámetros

### Ubicación: `public/js/admin-dashboard.js`

**ANTES:**
```html
<button onclick="updateRecord(42, 'pending', true)">Actualizar</button>
```

**DESPUÉS:**
```html
<button data-action="update-record" data-id="42" data-param-2="pending" data-param-3="true">Actualizar</button>
```

**Análisis Detallado:**

| Parámetro | Índice | Tipo | Heurística Aplicada | Atributo Data |
|-----------|--------|------|---------------------|---|
| `42` | 0 | number | Heurística 1 (numérico + update) | `data-id="42"` |
| `'pending'` | 1 | string | Fallback (generic) | `data-param-2="pending"` |
| `true` | 2 | boolean | Heurística 3 (booleano) | `data-param-3="true"` |

**Conversión de Tipos en Registry:**
```javascript
// data-id="42" → Number("42") → 42
// data-param-2="pending" → String("pending") → "pending"
// data-param-3="true" → Boolean("true") → true

// Resultado final:
// updateRecord(event, 42, "pending", true)
```

---

## 4. Ejemplo Especial: Template Expression

### Ubicación: `public/js/dashboard-manager-2025.js`

**ANTES:**
```html
<button onclick="editComunicado(${comunicadoId})">Editar</button>
```

**DESPUÉS:**
```html
<button data-action="edit-comunicado" data-comunicado-id="${comunicadoId}">Editar</button>
```

**Lógica de Heurística:**
```javascript
// Parámetro: "${comunicadoId}" (template-expression)
// → Heurística 4 detecta template
// → Extrae nombre variable: "comunicadoId"
// → Convierte a kebab: "comunicado-id"
// → Retorna: "data-comunicado-id"

function generateDataAttributeName(params, functionName, paramIndex, paramInfo) {
  // Heurística 4: Template expression
  if (paramInfo.type === 'template-expression') {
    const varMatch = paramInfo.value.match(/\{\s*(\w+)\s*\}/);
    if (varMatch) {
      return `data-${camelToKebab(varMatch[1])}`; // "data-comunicado-id"
    }
  }
  // ...
}
```

**En Runtime (En navegador):**
```javascript
// data-comunicado-id="${comunicadoId}"
// El valor literal es la string "${comunicadoId}"
// (no es evaluada como JavaScript)

// Si necesitas el valor evaluado, la función debe hacerlo:
function editComunicado(event, comunicadoIdStr) {
  // comunicadoIdStr = "${comunicadoId}" (literal)
  // Necesitas parsearlo en JavaScript if needed
}
```

---

## 5. Ejemplo Real: admin-dashboard-events.js (+3 Pattern B)

### Caso 1: approveSubmission

**ANTES:**
```html
<tr>
  <td><button onclick="approveSubmission(submissionId)">Aprobar</button></td>
</tr>
```

**DESPUÉS:**
```html
<tr>
  <td><button data-action="approve-submission" data-param-1="submissionId">Aprobar</button></td>
</tr>
```

### Caso 2: rejectSubmission

**ANTES:**
```html
<tr>
  <td><button onclick="rejectSubmission(id)">Rechazar</button></td>
</tr>
```

**DESPUÉS:**
```html
<tr>
  <td><button data-action="reject-submission" data-id="id">Rechazar</button></td>
</tr>
```

---

## 6. Comparativa: A vs B

### Patrón A (Simple)
```html
<!-- ANTES -->
<button onclick="toggleMenu()">Toggle</button>

<!-- DESPUÉS -->
<button data-action="toggle-menu">Toggle</button>

<!-- Llamada -->
toggleMenu(event)
```

### Patrón B (Con Parámetros)
```html
<!-- ANTES -->
<button onclick="toggleMenu(menuId)">Toggle</button>

<!-- DESPUÉS -->
<button data-action="toggle-menu" data-menu-id="menuId">Toggle</button>

<!-- Llamada -->
toggleMenu(event, "menuId")
```

---

## 7. Casos Edge: Heurísticas Avanzadas

### Edge Case 1: String que parece email

**ANTES:**
```html
<button onclick="sendNotification('user@domain.com', 'title')">Enviar</button>
```

**DESPUÉS:**
```html
<!-- Parámetro 1: 'user@domain.com' contiene @ -->
<!-- → data-email (Heurística 2) -->
<button data-action="send-notification" data-email="user@domain.com" data-param-2="title">Enviar</button>
```

### Edge Case 2: Delete function con ID

**ANTES:**
```html
<button onclick="deleteEvent(eventId)">Eliminar</button>
```

**DESPUÉS:**
```html
<!-- Función contiene "delete" + parámetro es variable -->
<!-- → Intenta inferir tipo variable, fallback a data-param-1 -->
<button data-action="delete-event" data-param-1="eventId">Eliminar</button>
```

---

## 8. Flujo Completo: De Onclick a Función

```
HTML ORIGINAL:
<button onclick="editStudent(123, 'john')">Editar</button>

↓ (Pattern B detection)

TRANSFORMACIÓN SCRIPT:
- Detecta: onclick="editStudent(123, 'john')"
- Parsea: functionName="editStudent", params=[{type:number, value:123}, {type:string, value:'john'}]
- Genera atributos:
  * data-action="edit-student"
  * data-id="123" (Heurística 1: número + edit)
  * data-param-2="john" (Fallback)

↓ (resultado HTML)

HTML TRANSFORMADO:
<button data-action="edit-student" data-id="123" data-param-2="john">Editar</button>

↓ (usuario hace click en navegador)

EVENT LISTENER (delegated):
1. document.addEventListener('click', function(event) {...})
2. Lee: data-action="edit-student"
3. Busca en actionMap: editStudent ✓
4. Extrae parámetros:
   - data-id="123" → Number("123") → 123
   - data-param-2="john" → String("john") → "john"
5. params = [123, "john"]
6. Llama: editStudent.apply(target, [event, 123, "john"])

↓ (en el JavaScript handler)

FUNCIÓN EDITADA:
function editStudent(event, studentId, studentName) {
  console.log(`Editando estudiante ${studentId}: ${studentName}`);
  // ... lógica de edición
}
```

---

## 9. Validación Type Inference

El registry automáticamente convierte tipos:

```javascript
// En HTML data attributes (todo es string por default):
<button data-id="123" data-active="true" data-email="test@mail.com">

// En JavaScript registry (type inference):
data-id="123" → Number(123) → 123 (número)
data-active="true" → Boolean(true) → true (booleano)
data-email="test@mail.com" → String (se mantiene)

// Intenta JSON.parse como último recurso:
data-payload='{"user":{"id":1}}' → Object (parseado)
```

---

## 10. Testing Manual (Después de Ejecución)

Cuando se ejecute con `-x`, puedes validar así:

```javascript
// En navegador DevTools Console:

// 1. Verificar que event-handler-registry está cargado
console.log(window.actionMap);
// {delete-noticia: deleteNoticia(), edit-teacher: editTeacher(), ...}

// 2. Simular click en button con data attributes
const btn = document.querySelector('[data-action="edit-student"]');
btn.click(); // Debe llamar editStudent(event, 123, "john")

// 3. Verificar logs en consola
// [EVENT-HANDLER] Action 'edit-student' executed successfully
```

---

## 📊 Resumen de Transformaciones Pattern B

| Caso | Tipo Parámetro | Heurística | Atributo Data | Conversión |
|------|----------------|-----------|---|---|
| deleteItem(123) | number | delete+number | data-id | → 123 |
| showUser('john@x.com') | string@email | email detect | data-email | → "john@x.com" |
| toggleFeature(false) | boolean | boolean | data-toggle-feature-false | → false |
| editStudent(${id}) | template | var parse | data-id | → "${id}" literal |
| updateRecord(42, 'x') | mixed | multi-rule | data-id + data-param-2 | → 42, "x" |

---

**Nota:** Los ejemplos anteriores asumen que las funciones JavaScript (deleteNoticia, editTeacher, etc.) están disponibles globalmente en el scope. El event-handler-registry las mapea desde el objeto `actionMap`.
