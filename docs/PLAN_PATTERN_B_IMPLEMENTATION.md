# Plan de Implementación: Patrón B (onclick con Parámetros)

**Fecha:** 12 de Noviembre de 2025
**Objetivo:** Extender `remove-inline-handlers.cjs` para manejar onclick con parámetros
**Estimado:** ~400 instancias en el codebase
**Complejidad:** Media

---

## 1. Análisis del Problema

### Patrón B Actual (No Soportado):
```html
<!-- Ejemplo 1: Parámetro numérico -->
<button onclick="deleteItem(123)">Eliminar</button>

<!-- Ejemplo 2: Parámetro string -->
<button onclick="showUser('john@example.com')">Ver Perfil</button>

<!-- Ejemplo 3: Parámetro con variable -->
<button onclick="editStudent(${student.id})">Editar</button>

<!-- Ejemplo 4: Múltiples parámetros -->
<button onclick="updateRecord(42, 'pending', true)">Actualizar</button>
```

### Desafíos de Implementación:

1. **Extracción de parámetros:** Necesitamos extraer tipos diferentes:
   - Números: `123`
   - Strings: `'texto'` o `"texto"`
   - Variables/templates: `${id}` o `${user.name}`
   - Booleanos: `true` o `false`
   - Expresiones: Evitar por ahora (Patrón D)

2. **Derivación de nombres de atributos:**
   - Si conocemos el parámetro por inspección previa: Usar nombre semántico
   - Si no: Usar nombre genérico `data-param-1`, `data-param-2`, etc.

3. **Generación de atributos data-*:**
   - Necesitamos mapping inteligente de parámetros a nombres

4. **Actualización del manejador de eventos:**
   - El registry debe leer todos los `data-*` y pasarlos como argumentos

---

## 2. Propuesta de Cambios en `remove-inline-handlers.cjs`

### 2.1 Agregar PATTERN_B (después de PATTERN_A)

```javascript
// Patrón B: onclick con parámetros
// Matches: onclick="deleteItem(123)" o onclick="showUser('john')" o onclick="update(id, true)"
const PATTERN_B = {
  name: 'onclick with parameters (Pattern B)',
  // Captura: función y todo dentro de paréntesis
  pattern: /onclick\s*=\s*['"`](\w+)\((.*?)\)['"`]/g,
  isSimple: false,

  // Extraer función y parámetros por separado
  parseParameters: (match, fullString) => {
    const funcMatch = fullString.match(/(\w+)\((.*?)\)/);
    if (!funcMatch) return null;

    const functionName = funcMatch[1];
    const paramsString = funcMatch[2];

    // Parsear parámetros individuales
    const params = parseParameters(paramsString);

    return {
      functionName,
      params,
      actionName: camelToKebab(functionName)
    };
  }
};
```

### 2.2 Función para Parsear Parámetros

```javascript
/**
 * Parsear string de parámetros en un array de objetos
 * Ejemplo: "123, 'john', true" →
 *   [{value: '123', type: 'number'},
 *    {value: 'john', type: 'string'},
 *    {value: 'true', type: 'boolean'}]
 */
function parseParameters(paramsString) {
  if (!paramsString || paramsString.trim() === '') {
    return [];
  }

  const params = [];
  // Dividir por comas, pero considerar strings entre comillas
  const parts = paramsString.split(/,(?=(?:[^'"]*['"]][^'"]*['"]*)*$)/);

  parts.forEach((part, index) => {
    part = part.trim();

    // Detectar tipo de parámetro
    let type = 'unknown';
    let value = part;

    if (/^\d+$/.test(part)) {
      // Número puro
      type = 'number';
    } else if (/^'[^']*'$/.test(part) || /^"[^"]*"$/.test(part)) {
      // String entre comillas
      type = 'string';
      value = part.slice(1, -1); // Remover comillas
    } else if (/^`[^`]*`$/.test(part)) {
      // Template literal
      type = 'template';
      value = part.slice(1, -1); // Remover backticks
    } else if (part === 'true' || part === 'false') {
      // Booleano
      type = 'boolean';
    } else if (/^\$\{.*\}$/.test(part)) {
      // Expresión template: ${variable}
      type = 'template-expression';
    } else {
      // Variable o expresión (no soportado aún)
      type = 'expression';
    }

    params.push({
      index,
      type,
      value,
      originalValue: part // Mantener original para casos especiales
    });
  });

  return params;
}
```

### 2.3 Función para Generar Nombre de Atributo Data

```javascript
/**
 * Generar nombre semantico de atributo data-*
 * Usa heurística: si el parámetro parece un ID/email/nombre, derivar del tipo
 * Fallback: data-param-N
 */
function generateDataAttributeName(params, functionName, paramIndex, paramInfo) {
  // Heurística 1: Si el parámetro es claramente un ID
  if (paramInfo.type === 'number' &&
      (functionName.includes('delete') ||
       functionName.includes('edit') ||
       functionName.includes('show') ||
       functionName.includes('update'))) {
    return 'data-id';
  }

  // Heurística 2: Si el parámetro es un string que parece email
  if (paramInfo.type === 'string' && paramInfo.value.includes('@')) {
    return 'data-email';
  }

  // Heurística 3: Si el parámetro es booleano
  if (paramInfo.type === 'boolean') {
    return `data-${camelToKebab(functionName)}-${paramInfo.value}`;
  }

  // Heurística 4: Template expression - derivar del nombre de variable
  if (paramInfo.type === 'template-expression') {
    const varMatch = paramInfo.value.match(/\{\s*(\w+)\s*\}/);
    if (varMatch) {
      return `data-${camelToKebab(varMatch[1])}`;
    }
  }

  // Fallback: Nombre genérico
  return `data-param-${paramIndex + 1}`;
}
```

### 2.4 Modificar `processFile()` para Soportar Patrón B

```javascript
processFile(filePath) {
  this.filesProcessed++;

  try {
    if (shouldSkipFile(filePath)) return;
    if (!EXTENSIONS.includes(path.extname(filePath))) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let filesModified = false;

    // ========== PATRÓN A: Simple onclick (sin parámetros) ==========
    if (PATTERN_A.pattern.test(content)) {
      PATTERN_A.pattern.lastIndex = 0;

      const newContent = content.replace(PATTERN_A.pattern, (match) => {
        const funcMatch = match.match(/onclick\s*=\s*['"`](\w+)\(\)['"`]/);
        if (funcMatch) {
          const functionName = funcMatch[1];
          const actionName = camelToKebab(functionName);
          this.allExtractedFunctions.push({
            name: functionName,
            pattern: 'A',
            params: []
          });
          return `data-action="${actionName}"`;
        }
        return match;
      });

      if (newContent !== content) {
        content = newContent;
        filesModified = true;
      }
    }

    // ========== PATRÓN B: onclick con parámetros ==========
    if (PATTERN_B.pattern.test(content)) {
      PATTERN_B.pattern.lastIndex = 0;

      const newContent = content.replace(PATTERN_B.pattern, (match) => {
        // Parsear función y parámetros
        const funcMatch = match.match(/onclick\s*=\s*['"`](\w+)\((.*?)\)['"`]/);
        if (!funcMatch) return match;

        const functionName = funcMatch[1];
        const paramsString = funcMatch[2];
        const params = parseParameters(paramsString);
        const actionName = camelToKebab(functionName);

        // Guardar función para registry
        this.allExtractedFunctions.push({
          name: functionName,
          pattern: 'B',
          params: params.map(p => ({ type: p.type, value: p.value }))
        });

        // Generar atributos data-*
        let dataAttrs = `data-action="${actionName}"`;

        params.forEach((param, index) => {
          const attrName = generateDataAttributeName(
            params,
            functionName,
            index,
            param
          );

          // Escapar valores si es necesario
          let attrValue = param.value;
          if (param.type === 'template-expression') {
            // Template: ${id} → mantener como está
            attrValue = param.originalValue;
          }

          dataAttrs += ` ${attrName}="${attrValue}"`;
        });

        return dataAttrs;
      });

      if (newContent !== content) {
        content = newContent;
        filesModified = true;
      }
    }

    // Escribir cambios si hay y no estamos en dry-run
    if (filesModified) {
      this.filesModified++;
      const replacementCount =
        (originalContent.match(PATTERN_A.pattern) || []).length +
        (originalContent.match(PATTERN_B.pattern) || []).length;

      this.totalReplacements += replacementCount;

      const status = this.dryRun ? '📋' : '✏️';
      this.log(
        `${status} ${filePath.replace(process.cwd(), '.')} (+${replacementCount})`,
        'cyan'
      );

      this.modifications.push({
        file: filePath,
        replacements: replacementCount,
        patterns: ['A', 'B'],
        modified: !this.dryRun
      });

      if (!this.dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

  } catch (error) {
    this.errors.push({
      file: filePath,
      error: error.message
    });
    this.log(`❌ Error processing ${filePath}: ${error.message}`, 'red');
  }
}
```

### 2.5 Actualizar `generateEventHandlerRegistry()` para Soportar Parámetros

```javascript
/**
 * Generar event handler registry inteligente que soporte parámetros
 * Lee data-* y los pasa como argumentos a la función
 */
function generateEventHandlerRegistry(allFunctions) {
  const uniqueFunctions = [...new Set(allFunctions.map(f => f.name))];

  return `
/**
 * Delegated Event Handler Registry (Auto-generated from remove-inline-handlers.cjs)
 *
 * Versión 2: Soporta Patrones A (simple) y B (con parámetros)
 *
 * Pattern A: data-action="func-name"
 * Pattern B: data-action="func-name" data-id="123" data-email="test@mail.com"
 *
 * El registry lee todos los atributos data-* y los pasa como argumentos
 */
(function initDelegatedEventHandlers() {
  'use strict';

  // Acción a mapeo de función
  const actionMap = {
${uniqueFunctions.map(fn => `    '${camelToKebab(fn)}': ${fn}`).join(',\n')}
  };

  // Listener delegado en document
  document.addEventListener('click', function(event) {
    const target = event.target;
    const action = target.getAttribute('data-action');

    if (action && actionMap[action]) {
      try {
        const fn = actionMap[action];

        if (typeof fn === 'function') {
          // Extraer parámetros de atributos data-*
          const params = [];

          // Recorrer todos los atributos del elemento
          for (let attr of target.attributes) {
            if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
              // Extraer valor y convertir tipo si es necesario
              let value = attr.value;

              // Intentar convertir a número si es posible
              if (!isNaN(value) && value !== '') {
                value = Number(value);
              }
              // Convertir booleanos
              else if (value === 'true') {
                value = true;
              } else if (value === 'false') {
                value = false;
              }
              // Si parece JSON, parsear
              else if (value.startsWith('{') || value.startsWith('[')) {
                try {
                  value = JSON.parse(value);
                } catch (e) {
                  // Mantener como string si no es JSON válido
                }
              }

              params.push(value);
            }
          }

          // Llamar función con parámetros extraídos
          fn.apply(target, [event, ...params]);
        } else {
          console.warn(\`[EVENT-HANDLER] Action '\${action}' is not a function\`);
        }
      } catch (error) {
        console.error(\`[EVENT-HANDLER] Error executing action '\${action}':\`, error);
      }
    }
  });

  console.log('[EVENT-HANDLER] Delegated event handler initialized (v2 - Pattern A & B)');
})();
`;
}
```

### 2.6 Agregar PATTERN_B a Configuración

```javascript
// Después de PATTERN_A, antes de EXTENSIONS
const PATTERN_B = {
  name: 'onclick with parameters (Pattern B)',
  pattern: /onclick\s*=\s*['"`](\w+)\((.*?)\)['"`]/g,
  isSimple: false
};

// Actualizar comentarios en el header del archivo
/**
 * Supported Patterns (Phase 2):
 * - Pattern A: Simple onclick without parameters (onclick="toggleMenu()")
 * - Pattern B: onclick with parameters (onclick="deleteItem(123)" or onclick="showUser('john')")
 *
 * TODO (Future Phases):
 * - Pattern C: onclick with multiple actions
 * - Pattern D: onclick with conditionals
 * - Pattern E: onchange handlers
 */
```

---

## 3. Cambios en la Lógica de Detección

### 3.1 Actualizar `detectPattern()` para detectar ambos

```javascript
/**
 * Detectar qué patrón está presente en el contenido
 */
function detectPatterns(content) {
  const patterns = [];

  if (PATTERN_A.pattern.test(content)) {
    PATTERN_A.pattern.lastIndex = 0;
    patterns.push('A');
  }

  if (PATTERN_B.pattern.test(content)) {
    PATTERN_B.pattern.lastIndex = 0;
    patterns.push('B');
  }

  return patterns;
}
```

---

## 4. Ejemplos de Transformación

### Ejemplo 1: onclick con ID numérico

**Antes:**
```html
<button onclick="deleteItem(123)">Eliminar</button>
```

**Después:**
```html
<button data-action="delete-item" data-id="123">Eliminar</button>
```

**En JavaScript:**
```javascript
// El event handler registry hace:
deleteItem(event, 123); // Primer param es event, luego los data-*
```

### Ejemplo 2: onclick con string

**Antes:**
```html
<button onclick="showUser('john@example.com')">Ver</button>
```

**Después:**
```html
<button data-action="show-user" data-email="john@example.com">Ver</button>
```

### Ejemplo 3: onclick con template expression

**Antes:**
```html
<button onclick="editStudent(${student.id})">Editar</button>
```

**Después:**
```html
<button data-action="edit-student" data-student-id="${student.id}">Editar</button>
```

### Ejemplo 4: onclick con múltiples parámetros

**Antes:**
```html
<button onclick="updateRecord(42, 'pending', true)">Actualizar</button>
```

**Después:**
```html
<button data-action="update-record" data-id="42" data-param-2="pending" data-param-3="true">Actualizar</button>
```

---

## 5. Consideraciones Especiales

### 5.1 Precedencia de Patrones

- Patrón A (sin parámetros) debe procesarse primero
- Patrón B (con parámetros) puede coexistir en el mismo archivo
- Usar flags globales en regex para procesar múltiples matches

### 5.2 Casos Edge

1. **Parámetros que contienen comillas:**
   ```html
   <!-- Problema: onclick="showMsg('It\'s working')" -->
   <!-- Solución: Escapar correctamente en data-* -->
   ```

2. **Template literals con expresiones complejas:**
   ```html
   <!-- onclick="process(`Value: ${obj.prop.nested}`)" -->
   <!-- Mantener como string en data-* -->
   ```

3. **Parámetros que son objeto/array:**
   ```html
   <!-- No soportado aún - Sería Patrón D (condicionales) -->
   <!-- Ejemplo: onclick="update({id: 1, name: 'test'})" -->
   ```

### 5.3 Extracción de Nombre de Atributo

**Estrategia en orden de preferencia:**

1. Análisis léxico (heurística): `deleteItem(123)` → `data-id`
2. Nombre de variable en template: `${userId}` → `data-user-id`
3. Nombre genérico: `data-param-1`, `data-param-2`, etc.

---

## 6. Testing del Patrón B

### Casos de Test Propuestos:

```javascript
// Test 1: Parámetro numérico simple
testCase('deleteItem(123)', {
  action: 'delete-item',
  params: { 'data-id': '123' }
});

// Test 2: Parámetro string
testCase("showUser('john@example.com')", {
  action: 'show-user',
  params: { 'data-email': 'john@example.com' }
});

// Test 3: Template expression
testCase('editRecord(${id})', {
  action: 'edit-record',
  params: { 'data-id': '${id}' }
});

// Test 4: Múltiples parámetros
testCase("updateRecord(42, 'pending', true)", {
  action: 'update-record',
  params: {
    'data-id': '42',
    'data-param-2': 'pending',
    'data-param-3': 'true'
  }
});

// Test 5: Booleano
testCase('toggleFeature(false)', {
  action: 'toggle-feature',
  params: { 'data-toggle-feature-false': 'false' }
});
```

---

## 7. Resumen de Cambios Necesarios

| Componente | Cambios | Líneas |
|-----------|---------|--------|
| PATTERN_B definición | Agregar nuevo patrón | +10 |
| parseParameters() | Nueva función | +50 |
| generateDataAttributeName() | Nueva función | +35 |
| generateEventHandlerRegistry() | Mejorar para soportar params | +40 |
| processFile() | Procesar ambos patrones | +80 |
| detectPatterns() | Detectar múltiples | +15 |
| **TOTAL** | | **~230 líneas** |

---

## 8. Ventajas del Enfoque Propuesto

✅ **Modular:** Cada patrón es independiente y extensible
✅ **Escalable:** Fácil agregar Patrones C, D, E sin cambiar arquitectura
✅ **Robusto:** Heurística inteligente para nombres de atributos
✅ **Compatible:** Patrón A sigue funcionando sin cambios
✅ **Type-Safe:** El registry infiere tipos de datos automáticamente
✅ **Reversible:** Los datos se mantienen en HTML, fácil de depurar

---

## 9. Próximos Pasos Después de Implementar

1. ✅ Crear versión v2.0 del script
2. ✅ Testing exhaustivo con dry-run
3. ✅ Estimar cantidad real de Patrón B en el codebase
4. ✅ Ejecutar con -x flag
5. ✅ Validar con npm test
6. ✅ Commit atómico a GitHub
7. ⏳ Planificar Patrón C (múltiples acciones)

---

**Estado:** Propuesta lista para implementación
**Aprobación requerida:** Antes de escribir código
