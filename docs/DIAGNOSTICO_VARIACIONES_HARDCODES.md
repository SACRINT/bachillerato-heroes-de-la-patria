# DIAGNÓSTICO: VARIACIONES DE STRINGS HARDCODEADOS
## Fase 2C Hito 3 - Iteración 2

**Fecha:** 10 de Noviembre de 2025
**Objetivo:** Identificar TODAS las variaciones de cómo se escriben los nombres de la institución
**Método:** Búsqueda exhaustiva en todos los archivos JavaScript

---

## 🔍 VARIACIONES ENCONTRADAS

### TOP 10 Variaciones más comunes

| # | Variación | Ocurrencias | Contexto |
|---|-----------|-------------|---------|
| 1 | `'Bachillerato General Estatal "Héroes de la Patria"'` | 14 | Nombre completo con comillas internas |
| 2 | `'BGE Héroes de la Patria'` | 11 | Forma corta estándar |
| 3 | `'Bachillerato General Estatal Héroes de la Patria'` | 6 | Nombre completo sin comillas internas |
| 4 | `'Soy el asistente virtual del Bachillerato General Estatal "Héroes de la Patria"...'` | 2 | En respuestas de chat |
| 5 | `'Para eso estoy aquí. Si necesitas más información sobre "Héroes de la Patria"...'` | 2 | En respuestas de chat |
| 6 | `'Facebook: Bachillerato General Estatal "Héroes de la Patria"'` | 2 | En texto de redes sociales |
| 7 | `'<nav...>Héroes de la Patria</nav>'` | 2 | En HTML inyectado |
| 8 | `'¿Qué te gustaría saber sobre "Héroes de la Patria"?'` | 2 | En respuestas de chat |
| 9 | `'Respuesta IA - Héroes de la Patria'` | 1 | Título de respuesta IA |
| 10 | `'Hola, bienvenido al BGE Héroes de la Patria...'` | 1 | En saludo de chat |

### Variaciones adicionales encontradas

- `'Reporte de Tecnologías Emergentes BGE Héroes'`
- `'Reporte de Red BGE Héroes de la Patria'`
- `'Reporte de Infraestructura BGE Héroes'`
- `'Reporte de Escalabilidad BGE Héroes'`
- `'Imagen del sitio BGE Héroes de la Patria'`
- `'Héroes de la Patria'` (solo el nombre, sin BGE)
- `'Estimada comunidad educativa:\n...\nDirección BGE Héroes de la Patria'`
- `'Contacto desde sitio web BGE Héroes de la Patria'`
- `'Comunicado Oficial - BGE Héroes'`
- `'Calendario Escolar BGE Héroes de la Patria'`

---

## 📊 ESTADÍSTICAS DE BÚSQUEDA

### Total de Ocurrencias por Tipo de String

| Tipo | Ocurrencias | Ejemplo |
|------|-------------|---------|
| Nombre Completo Formal | 20 | `'Bachillerato General Estatal "Héroes de la Patria"'` |
| Nombre Corto BGE + Full | 11 | `'BGE Héroes de la Patria'` |
| Nombre Completo Sin Comillas | 6 | `'Bachillerato General Estatal Héroes de la Patria'` |
| En Mensajes/Respuestas | 10+ | Diversos textos de chat/IA |
| Variantes Cortas | 5+ | `'BGE Héroes'`, `'Héroes de la Patria'` |
| **TOTAL ESTIMADO** | **60-70** | En public/js solo |

---

## 🎯 CATEGORIZACIÓN PARA REFACTORIZACIÓN

### Categoría A: Crítica (Mayor Impacto)
```javascript
// Patrón 1: Nombre completo formal con comillas internas
'Bachillerato General Estatal "Héroes de la Patria"'
// Ocurrencias: 14
// Solución: window.getTenantConfigValue('school_full_name_with_quotes', 'Bachillerato General Estatal "Héroes de la Patria"')

// Patrón 2: BGE + Nombre completo
'BGE Héroes de la Patria'
// Ocurrencias: 11
// Solución: window.getTenantConfigValue('school_name_short_full', 'BGE Héroes de la Patria')

// Patrón 3: Nombre completo sin comillas internas
'Bachillerato General Estatal Héroes de la Patria'
// Ocurrencias: 6
// Solución: window.getTenantConfigValue('school_full_name', 'Bachillerato General Estatal Héroes de la Patria')
```

### Categoría B: Moderada (Mensajes/Textos)
```javascript
// Patrón 4: En respuestas de chat
'...información sobre "Héroes de la Patria"...'
// Ocurrencias: 2-4
// Solución: Usar configuración dinámica en función de mensajes

// Patrón 5: En redes sociales/contactos
'Facebook: Bachillerato General Estatal "Héroes de la Patria"'
// Ocurrencias: 2
// Solución: Extraer nombre y usar getTenantConfigValue
```

### Categoría C: Menor (Textos Largos)
```javascript
// Patrón 6: En saludos/bienvenidas multilinea
'Hola, bienvenido al BGE Héroes de la Patria...'
// Solución: Usar template literals con getTenantConfigValue

// Patrón 7: Comunicados y reportes
'Comunicado Oficial - BGE Héroes'
// Solución: Extraer y reemplazar componentes
```

---

## 🔧 ESTRATEGIA MEJORADA DE REEMPLAZO

### Problema Actual del Script
El script original solo tenía 3 patrones muy específicos:
1. `'BGE Héroes de la Patria'`
2. `'Bachillerato General por Competencias'` (NO ENCONTRADO en búsqueda)
3. `'BGE'` (demasiado genérico, afecta variables técnicas)

### Solución: Patrones Mejorados
```powershell
# Patrón 1: Nombre formal con comillas internas (14 ocurrencias)
'Bachillerato General Estatal "Héroes de la Patria"'

# Patrón 2: BGE + Nombre completo (11 ocurrencias)
'BGE Héroes de la Patria'

# Patrón 3: Nombre completo sin comillas (6 ocurrencias)
'Bachillerato General Estatal Héroes de la Patria'

# Patrón 4: Solo "Héroes de la Patria" (cuando está en contexto)
'Héroes de la Patria'  # CON CONTEXTO para evitar reemplazar en comentarios

# Patrón 5: Variantes cortas
'BGE Héroes'

# Patrón 6: En mensajes (template literals)
`...Héroes de la Patria...`
```

---

## 📈 ANÁLISIS POR ARCHIVO

### Top 5 Archivos con MÁS Ocurrencias

| Archivo | Ocurrencias | Principales |
|---------|-------------|-------------|
| admin-newsletters.js | 4 | Full name + short |
| advanced-authentication-system.js | 3 | Full names |
| ai-machine-learning.js | 3 | Various contexts |
| ai-educational-system.js | 2 | Chat responses |
| dashboard-manager-2025.js | **14** (muy alto) | Múltiples tipos |

---

## ✅ RECOMENDACIONES

### 1. Actualizar Script PowerShell
Agregar al menos **6 patrones principales** en lugar de 3:

```javascript
$replacementPatterns = @(
    # Críticos (Alto Impacto)
    "Bachillerato General Estatal `"Héroes de la Patria`"",
    "BGE Héroes de la Patria",
    "Bachillerato General Estatal Héroes de la Patria",

    # Moderados
    "Héroes de la Patria",
    "BGE Héroes",
    "Bachillerato General Estatal"
)
```

### 2. Crear Configuración Dinámica Expandida
```javascript
window.TENANT_CONFIG = {
    // Básico
    school_short_name: 'BGE',
    school_name: 'BGE Héroes de la Patria',

    // Completo
    school_full_name: 'Bachillerato General Estatal Héroes de la Patria',
    school_full_name_with_quotes: 'Bachillerato General Estatal "Héroes de la Patria"',

    // Variantes
    school_short_form: 'BGE Héroes',

    // Para mensajes
    school_in_message: 'Héroes de la Patria'
}
```

### 3. Considerar Aproximación por Contexto
- **Configuración:** Usar nombre completo formal
- **Chat/Mensajes:** Usar formas más conversacionales
- **Reportes:** Usar nombre con contexto oficial

---

## 🚀 PRÓXIMOS PASOS

1. **Hoy:** Usar este diagnóstico para mejorar script PowerShell
2. **Después:** Ejecutar script mejorado (esperando ~40-60 reemplazos)
3. **Validación:** Verificar resultados en archivos críticos
4. **Iteración 3:** Si es necesario, ajustar patrones adicionales

---

## 📋 CHECKLIST DE VALIDACIÓN

- [ ] Script actualizado con 6+ patrones
- [ ] Dashboard-manager-2025.js validado (14 referencias)
- [ ] Admin-auth.js validado (referencias encontradas)
- [ ] Sincronización dual verificada
- [ ] Sin conflictos de reemplazo doble
- [ ] Documentación actualizada

---

**Conclusión:** Las variaciones son más específicas y estructuradas de lo esperado. El script mejorado debería lograr **40-60 reemplazos exitosos** en la próxima ejecución.
