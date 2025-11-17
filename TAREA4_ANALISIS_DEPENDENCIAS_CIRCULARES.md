# 🔄 TAREA 4: REFACTORIZAR 3 DEPENDENCIAS CIRCULARES

**Objetivo:** Resolver 3 cadenas de dependencias circulares detectadas en auditoría

---

## 📊 DEPENDENCIAS CIRCULARES ENCONTRADAS

### Circular 1: auth ↔ context

```
auth.js → context-manager.js → auth.js (circular)
```

**Análisis:**
- `auth.js` probablemente necesita context para guardar estado del usuario
- `context-manager.js` probablemente necesita auth para autenticar

**Impacto:**
- Carga no determinística
- Posible race condition en inicialización
- Difícil para testing y debugging

**Solución Propuesta:**
- Crear interfaz intermediaria: `auth-context-bridge.js`
- Desacoplar mediante eventos o callbacks
- Context NO debe importar auth directamente

---

### Circular 2: api-client ↔ auth

```
api-client.js → auth.js → api-client.js (circular)
```

**Análisis:**
- API client usa auth para obtener tokens
- Auth usa API client para refresh tokens

**Impacto:**
- Imposible cargar api-client sin auth
- Tests unitarios de API client complicados

**Solución Propuesta:**
- Inyectar `getToken()` callback en api-client
- Auth NO debe importar api-client
- Patrón: Dependency Injection

---

### Circular 3: dashboard ↔ data

```
dashboard.js → data-service.js → dashboard.js (circular)
```

**Análisis:**
- Dashboard carga datos del data-service
- Data-service actualiza el dashboard en tiempo real

**Impacto:**
- Cambios en data-service afectan todos los dashboards
- Difícil de testear en aislamiento

**Solución Propuesta:**
- Usar event emitter centralizado
- Data-service EMITE eventos, NO actualiza dashboard
- Dashboard ESCUCHA eventos, NO es actualizado directamente

---

## 🎯 PLAN DE REFACTORIZACIÓN

### Paso 1: Crear Module Interfaces (Cada archivo ~50 líneas)

```javascript
// ✅ Crear: auth-api-bridge.js
// Inyecta token en api-client sin imports circulares

// ✅ Crear: auth-context-bridge.js
// Desacopla auth de context mediante eventos

// ✅ Crear: data-event-emitter.js
// Emite eventos en lugar de actualizar directamente
```

### Paso 2: Refactorizar Archivos Principales (10-15 líneas cada uno)

```javascript
// ✅ Modificar: api-client.js (quitar import de auth)
// Agregar: setTokenProvider(function)

// ✅ Modificar: auth.js (quitar import de api-client)
// Usar: auth-api-bridge.js

// ✅ Modificar: context-manager.js (quitar import de auth)
// Escuchar: eventos de auth
```

### Paso 3: Validación y Testing

```bash
✅ node -c api-client.js
✅ node -c auth.js
✅ node -c context-manager.js
✅ Verificar carga en navegador sin errores
```

---

## 📋 FICHEROS AFECTADOS (3 bridges + 6 modificaciones)

| Archivo | Tipo | Líneas | Cambios |
|---------|------|--------|---------|
| auth-api-bridge.js | NUEVO | 50 | Inyectar token en API |
| auth-context-bridge.js | NUEVO | 40 | Eventos en lugar de imports |
| data-event-emitter.js | NUEVO | 45 | Emitter centralizado |
| api-client.js | MODIFICAR | -5 | Quitar import auth |
| auth.js | MODIFICAR | -3 | Quitar import api-client |
| context-manager.js | MODIFICAR | -2 | Quitar import auth |
| dashboard.js | MODIFICAR | -5 | Escuchar eventos |
| data-service.js | MODIFICAR | -10 | Emitir en lugar de actualizar |
| main.js | MODIFICAR | +5 | Cargar bridges primero |
| **TOTAL** | | **135** | Resolver 3 circulares |

---

## ✅ MÉTRICAS DE ÉXITO

- ✅ 0 imports circulares en el codebase
- ✅ Cada módulo tiene responsabilidad única
- ✅ Testing unitario posible sin mocks complejos
- ✅ Performance: carga determinística
- ✅ Logging de dependencias visible en consola

---

## 📅 TIEMPO ESTIMADO

| Tarea | Tiempo |
|-------|--------|
| Crear 3 bridges | 3 horas |
| Refactorizar archivos | 4 horas |
| Testing y validación | 3 horas |
| **TOTAL** | **10 horas** |

---

**Estado:** Análisis completado, listo para implementación
**Próximo paso:** Crear auth-api-bridge.js
