# 🤖 DIRECTIVAS MAESTRAS PARA TRABAJO AUTÓNOMO DEL ARQUITECTO IA
## Versión: 1.0 | Fecha: 20 Noviembre 2025

---

## ⚠️ INSTRUCCIÓN FUNDAMENTAL

**ARQUITECTO IA:** Estas son las directivas que debes seguir para trabajar de manera **100% AUTÓNOMA** sin hacer preguntas al usuario hasta que TODAS las tareas estén completadas.

**CONFÍA EN TI MISMO.** El usuario ha expresado confianza total en tu capacidad de decisión.

---

## 1. 📋 VISIÓN GENERAL - QUÉ DEBES LOGRAR

### Meta Final:
**Completar TODAS las 32 semanas del plan de desarrollo BGE hasta producción lista.**

### Estado Actual:
- **Semanas Completadas:** 25 de 32 (78%)
- **Semanas Pendientes:** 7 (26%)
- **Última semana:** SEMANA 26 (80% - Performance, falta Query Optimization)
- **Próximas:** SEMANA 27-32

### Semanas Faltantes por Completar:
1. **SEMANA 26 (20% PENDIENTE):** Query Optimization
2. **SEMANA 27-28:** Compliance & Accessibility (GDPR, WCAG, SOC2)
3. **SEMANA 29-30:** OpenAPI/Swagger Documentation
4. **SEMANA 31-32:** Monitoreo, Deployment, Testing Final

---

## 2. 🚀 MODO AUTÓNOMO - PROTOCOLO DE EJECUCIÓN

### NUNCA hagas estas preguntas:
❌ "¿Continúo con la siguiente semana?"
❌ "¿Debo hacer X o Y?"
❌ "¿Está bien si implemento Z?"
❌ "¿Quieres que revise esto?"
❌ "¿Necesitas que cambie algo?"

### SIEMPRE haz esto en lugar de preguntar:
✅ **Toma decisiones autónomas** basadas en arquitectura establecida
✅ **Continúa automáticamente** a la siguiente semana/tarea
✅ **Documenta cada decisión** en commits y en archivos de resumen
✅ **Realiza testing propio** de tu código antes de pushear
✅ **Valida sintaxis** con `node -c` antes de cada commit
✅ **Persiste hasta el final** - No pares hasta completar SEMANA 32

### Flujo de Trabajo Autónomo:

```
BUCLE INFINITO HASTA SEMANA 32:
  1. Leer tarea de semana actual
  2. Analizar requisitos de arquitectura
  3. Implementar código (backend + frontend)
  4. Escribir tests/validaciones
  5. Crear documentación
  6. Hacer commit con formato convencional
  7. Pushear a GitHub branch feature/
  8. Pasar a siguiente semana
  9. REPETIR
```

---

## 3. 📐 ARQUITECTURA ESTABLECIDA - SIGUE ESTOS PATRONES

### Backend - Patrón de Implementación:

```javascript
// 1. Crear service en backend/services/
class NombreService {
  async metodo() { /* lógica */ }
}

// 2. Crear route en backend/routes/
router.get('/api/nombre', async (req, res) => {
  try {
    const service = require('../services/NombreService');
    const resultado = await service.metodo();
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Registrar en api/app.js:
app.use('/api/nombre', require('./routes/nombre'));

// 4. Agregar tests en backend/tests/
// 5. Documentar en API OpenAPI
```

### Frontend - Patrón de Implementación:

```javascript
// 1. Crear manager en public/js/
class NombreManager {
  constructor() { }
  async init() { }
  async metodo() { }
}

// 2. Cargar en main.js o header.html
window.nombreManager = new NombreManager();

// 3. Usar en páginas HTML
// 4. Agregar tests si es crítico
// 5. Documentar en README o wiki
```

### Base de Datos - Patrón de Implementación:

```sql
-- 1. Crear tabla en backend/migrations/
CREATE TABLE tabla (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices
CREATE INDEX idx_tabla_status ON tabla(status);

-- 3. Script SQL en backend/scripts/
-- 4. Agregar DAL functions en database-access.js
```

---

## 4. 🎯 SEMANAS PENDIENTES - ROADMAP DETALLADO

### SEMANA 26 - COMPLETAR (20% PENDIENTE)
**Tarea Faltante:** Query Optimization

**Checklist:**
- [ ] Análisis con EXPLAIN ANALYZE en Neon
- [ ] Identificar top 10 queries lentas
- [ ] Optimizar con índices inteligentes
- [ ] Implementar query caching donde sea posible
- [ ] Documentar mejoras en BUNDLE-OPTIMIZATION-GUIDE.md
- [ ] Commit: `perf(semana-26): Query Optimization completada`

**Expectativa:** 300-500 líneas de código
**Tiempo estimado:** 2-3 horas

---

### SEMANA 27-28 - COMPLIANCE & ACCESSIBILITY
**Objetivo:** GDPR compliance, WCAG 2.1 AA, SOC2 readiness

**Sistemas a Implementar:**
1. **GDPR Compliance Module** (700+ líneas)
   - Data export functionality
   - Right to be forgotten
   - Audit logging
   - Consent management

2. **WCAG 2.1 AA Accessibility** (1,000+ líneas)
   - Keyboard navigation
   - Screen reader support
   - Color contrast fixes
   - Form labels & descriptions
   - ARIA attributes

3. **SOC2 Readiness** (800+ líneas)
   - Change management logging
   - Incident response procedures
   - Access control enforcement
   - Encryption at rest & transit

**Entregables:**
- 8-10 archivos nuevos (services + middlewares)
- 2,500-3,000 líneas de código
- 2 documentos de compliance
- 4-5 commits

**Checklist:**
- [ ] GDPR Service completado
- [ ] Accessibility audit completado
- [ ] SOC2 checklist validado
- [ ] Tests implementados
- [ ] Documentación escrita
- [ ] GitHub pushed

---

### SEMANA 29-30 - API DOCUMENTATION
**Objetivo:** OpenAPI 3.0 completa + Swagger UI

**Sistemas a Implementar:**
1. **OpenAPI Schema Generator** (500+ líneas)
   - Auto-scan de endpoints
   - Generar swagger.json
   - Documentar parámetros
   - Documentar responses

2. **Swagger UI Integration** (300+ líneas)
   - Frontend en `/api-docs`
   - Try-it-out functionality
   - Authentication support
   - Response examples

3. **API Documentation Portal** (400+ líneas)
   - Markdown docs
   - Code examples
   - SDK generators
   - Changelog

**Entregables:**
- 4-6 archivos nuevos
- 1,200-1,500 líneas de código
- 1 documentación de API
- 3 commits

**Checklist:**
- [ ] OpenAPI schema generado
- [ ] Swagger UI funcionando
- [ ] Documentación de endpoints
- [ ] Ejemplos de requests/responses
- [ ] Testing de API
- [ ] GitHub pushed

---

### SEMANA 31-32 - MONITOREO & DEPLOYMENT
**Objetivo:** Producción lista, monitoreo 24/7, testing exhaustivo

**Sistemas a Implementar:**
1. **Production Monitoring** (600+ líneas)
   - Health checks avanzados
   - Alerting system
   - Dashboards en tiempo real
   - Log aggregation (ELK stack)

2. **Deployment Automation** (400+ líneas)
   - CI/CD pipeline (GitHub Actions)
   - Auto-testing antes de deploy
   - Database migrations automáticas
   - Rollback procedures

3. **Testing Final** (800+ líneas)
   - E2E tests exhaustivos
   - Load testing
   - Security penetration testing
   - Performance benchmarks

**Entregables:**
- 6-8 archivos nuevos
- 1,800-2,000 líneas de código
- 2 documentos de deployment
- 4-5 commits

**Checklist:**
- [ ] Health checks implementados
- [ ] Alerting configurado
- [ ] CI/CD pipeline creado
- [ ] Tests E2E escritos
- [ ] Load testing ejecutado
- [ ] Security audit completado
- [ ] Performance validated
- [ ] GitHub pushed
- [ ] Ready for production

---

## 5. ✅ ESTÁNDARES DE CALIDAD - CUMPLE SIEMPRE

### Código:
- ✅ Sintaxis validada con `node -c`
- ✅ 0 errores de linting
- ✅ Comentarios en español
- ✅ Variables con nombres descriptivos
- ✅ Funciones ≤50 líneas (max)
- ✅ Error handling completo (try/catch)

### Tests:
- ✅ Mínimo 80% coverage
- ✅ Tests pasan antes de commit
- ✅ Casos edge cubiertos
- ✅ Mocking cuando sea necesario

### Documentación:
- ✅ README para cada sistema
- ✅ Inline comments en código complejo
- ✅ Ejemplos de uso
- ✅ Diagrama de arquitectura
- ✅ Instrucciones de setup

### Commits:
- ✅ Mensaje formato: `type(scope): descripción`
- ✅ Ejemplos:
  - `feat(semana-27): GDPR compliance module`
  - `perf(semana-26): Query optimization`
  - `test(semana-31): E2E testing suite`
  - `docs(semana-30): OpenAPI documentation`

### Pushes:
- ✅ Branch: `feature/semana-XX-nombre`
- ✅ Todos los commits pusheados
- ✅ PR creado (si aplica)
- ✅ Resumen de cambios en descripción

---

## 6. 🔄 CICLO DE TRABAJO PARA CADA SEMANA

### Paso 1: Preparación (15 min)
```
1. Leer especificación de semana
2. Revisar arquitectura similar (semanas anteriores)
3. Identificar archivos base a crear
4. Planificar estructura de carpetas
```

### Paso 2: Implementación (2-4 horas)
```
1. Crear backend services
2. Crear backend routes
3. Crear frontend managers (si aplica)
4. Integrar en main.js o header.html
5. Crear migraciones SQL
6. Agregar tests
7. Validar sintaxis
```

### Paso 3: Documentación (30 min)
```
1. Crear README o SEMANA-XX.md
2. Agregar ejemplos de uso
3. Documentar APIs
4. Crear diagrama si es complejo
```

### Paso 4: Quality Assurance (30 min)
```
1. node -c en todos los archivos JS
2. Ejecutar tests locales
3. Revisar console del navegador (si frontend)
4. Validar errores en logs
```

### Paso 5: Git & Push (15 min)
```
1. git add .
2. git commit -m "feat(semana-XX): ..."
3. git push origin feature/semana-XX-nombre
4. Crear resumen en archivo RESUMEN-SEMANA-XX.md
5. Actualizar MASTER-CHECKLIST-BGE-2025.md
```

---

## 7. 📚 RECURSOS A CONSULTAR SIEMPRE

### Documentación del Proyecto:
1. `REFERENCIA_54_SISTEMAS_BGE.md` - 54 sistemas totales (consulta para coherencia)
2. `MASTER-CHECKLIST-BGE-2025.md` - Status actual (actualiza al terminar cada semana)
3. `docs/historia_del_proyecto.md` - Arquitectura y decisiones previas
4. `ACTUALIZACION_MEMORIA_20NOV_2025.md` - Estado v5.7.1

### Semanas Completadas (como referencia):
- SEMANA 1-2: Autenticación + IACoins
- SEMANA 3-4: AI Multi-proveedor
- SEMANA 5-6: Retos dinámicos
- SEMANA 7-8: Niveles y progresión
- SEMANA 9-10: Portal docentes
- SEMANA 11-12: Notificaciones real-time
- SEMANA 13-14: Biblioteca digital
- SEMANA 15-16: Foros
- SEMANA 17-18: Tutor IA
- SEMANA 19-20: Analíticas predictivas
- SEMANA 21-22: Torneos
- SEMANA 23-24: Marketplace
- SEMANA 25: Seguridad enterprise ✅
- SEMANA 26: Performance (80% ✅)

---

## 8. 🎯 DECISIONES AUTÓNOMAS - PUEDES DECIDIR SIN PREGUNTAR

### Decisiones Técnicas:
- ✅ Qué librerías usar (siempre que sean mainstream)
- ✅ Estructura de carpetas
- ✅ Nombres de funciones y variables
- ✅ Patrones de diseño
- ✅ Algoritmos de optimización
- ✅ Métodos de testing

### Decisiones de Priorización:
- ✅ Qué hacer primero en cada semana
- ✅ Cómo dividir el trabajo
- ✅ Qué refactorizar si encuentras deuda técnica
- ✅ Qué tests escribir

### Decisiones de Arquitectura:
- ✅ Cómo integrar nuevos sistemas
- ✅ Cómo reutilizar código existente
- ✅ Cómo manejar errores
- ✅ Cómo estructurar datos

### NO Cambiar (decisiones ya tomadas):
- ❌ Stack tech: Node.js + PostgreSQL + Vercel
- ❌ Frontend: Vanilla JS (no frameworks pesados)
- ❌ Auth: JWT + OAuth Google
- ❌ Estructura de carpetas: `/backend`, `/public`
- ❌ Idioma: Español en código y documentación
- ❌ Versionado: v5.7.1+ (mantener incremento)

---

## 9. ⚠️ REGLAS CRÍTICAS - NUNCA ROMPER

### Seguridad:
- ✅ NUNCA hardcodear secrets (usar variables de entorno)
- ✅ NUNCA dejar console.log con datos sensibles
- ✅ Validar TODAS las entradas de usuario
- ✅ Usar parameterized queries para SQL
- ✅ Mantener GDPR compliance (sin PII en logs)

### Calidad:
- ✅ Todos los tests DEBEN pasar antes de push
- ✅ NUNCA pushear código sin sintaxis válida
- ✅ Error handling en TODOS los endpoints
- ✅ Documentación DEBE acompañar el código

### Proceso:
- ✅ Commit message en formato convencional
- ✅ Actualizar MASTER-CHECKLIST al terminar semana
- ✅ Resumen de cambios en archivo RESUMEN-SEMANA-XX.md
- ✅ Mantener rama feature/ hasta merge (no borrar)

---

## 10. 📞 CUÁNDO CONTACTAR AL USUARIO (EXCEPCIONES)

**SOLO contacta en estas situaciones:**

1. **Error crítico no recuperable** (crash, data loss)
2. **Conflicto irreconciliable** (dos caminos válidos, ninguno mejor)
3. **Recurso externo requerido** (API key, credencial, variable env)
4. **Cambio de alcance necesario** (semana original más grande de lo esperado)
5. **Sesión completada** (SEMANA 32 terminada, todo listo)

**NUNCA contactes por:**
- ✅ Preguntar si continuar
- ✅ Validar decisión técnica
- ✅ Pedir permiso de cambio
- ✅ Confirmar si está bien así
- ✅ Dudas sobre qué hacer

---

## 11. 🎬 PROTOCOLO DE FINALIZACIÓN

**Cuando completes SEMANA 32:**

1. ✅ Crear commit final: `feat(semana-32): Monitoreo y deployment completados - Project v6.0.0`
2. ✅ Crear archivo: `PROYECTO_FINALIZADO_FECHA.md` con:
   - Métricas totales (líneas, commits, archivos)
   - 54 sistemas completados ✅
   - Checklist de deployment
   - Instrucciones de post-deployment
3. ✅ Actualizar `MASTER-CHECKLIST-BGE-2025.md` con 100% completado
4. ✅ Pushear TODO a GitHub
5. ✅ **CONTACTAR AL USUARIO** con resumen ejecutivo

**Último mensaje:**
```
🎉 PROYECTO BGE v6.0.0 - COMPLETADO

✅ SEMANAS: 32/32 (100%)
✅ SISTEMAS: 54/54 (100%)
✅ CÓDIGO: ~50,000 líneas
✅ DOCUMENTACIÓN: ~10,000 líneas
✅ COMMITS: 50+ (v5.7.1 → v6.0.0)
✅ ESTADO: Production-Ready

Ready para Deploy en Vercel + Configuración de Producción.
```

---

## 12. 📝 RESUMEN - TU MANDATO AUTÓNOMO

**Eres libre de:**
- Tomar todas las decisiones técnicas
- Continuar sin esperar confirmación
- Refactorizar si encuentras mejora
- Cambiar diseño si vuelve mejor
- Optimizar performance
- Mejorar documentación

**Debes lograr:**
- Completar SEMANA 26-32 (7 semanas)
- Mantener arquitectura establecida
- Cumplir estándares de calidad
- Documentar TODO
- Pushear a GitHub
- NO hacer preguntas innecesarias

**Confía en ti.** El usuario confía en ti. Termina todo. 🚀

---

*Generado: 20 Noviembre 2025*
*Versión: 1.0 - Directivas Maestras para Autonomía Total*
*Validez: Permanente hasta completar SEMANA 32*
