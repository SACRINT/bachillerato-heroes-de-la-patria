# ⚡ INICIO RÁPIDO: SANITIZACIÓN 62 ARCHIVOS (5 MINUTOS)

**Si solo tienes 5 minutos, lee esto.** Si quieres detalles, ve a `FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md`

---

## 🎯 QUÉ HACER EN 3 PASOS

### Paso 1: Entender el Patrón (2 min)

```javascript
// ANTES (❌ Vulnerable a XSS):
element.innerHTML = userInput;

// DESPUÉS (✅ Seguro):
element.innerHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['div', 'p', 'span'],
  ALLOWED_ATTR: ['class', 'id']
});
```

**Eso es.** Envuelve cada `innerHTML` y `insertAdjacentHTML` con `DOMPurify.sanitize()`.

---

### Paso 2: Prioridad de Archivos (1 min)

**SEMANA 1 (Urgente - Haz PRIMERO):**
1. `public/js/dashboard-manager-2025.js` (34 riesgos)
2. `public/js/professional-forms.js` (34 riesgos)
3. `public/js/admin.bundle.js` (34 riesgos)
4. `public/js/forms.bundle.js` (17 riesgos)
5. `public/js/features.bundle.js` (16 riesgos)

**El resto:** Puedes hacerlo en próximas semanas (orden en plan detallado)

---

### Paso 3: Commitar Cambios (1 min)

```bash
# Después de sanitizar 1-3 archivos:
git add public/js/dashboard-manager-2025.js
git commit -m "feat(sanitize): XSS remediation dashboard-manager-2025.js (34 riesgos)"

# Luego push:
git push origin main
```

**Listo.** ¡Ya completaste el 20% de la seguridad!

---

## 📋 CHECKLIST RÁPIDO

- [ ] **Instalado:** DOMPurify 3.0.6 (¿Ya está en package.json?)
- [ ] **Identificado:** Líneas con `innerHTML` en archivo #1
- [ ] **Sanitizado:** Envuelto con `DOMPurify.sanitize()`
- [ ] **Testeado:** XSS injection `<img src=x onerror='alert("XSS")'>` NO ejecuta
- [ ] **Commiteado:** `git commit` con mensaje claro

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

```
SEMANA 1 (6-8h):     dashboard-manager-2025.js, professional-forms.js, admin.bundle.js, forms.bundle.js, features.bundle.js
SEMANA 2 (8-10h):    18 archivos ALTOS (6-11 riesgos cada uno)
SEMANA 3 (5-6h):     15 archivos MEDIOS (5 riesgos cada uno)
SEMANA 4-5 (6-8h):   25 archivos BAJOS (3-4 riesgos cada uno)
```

---

## 💡 PRO TIPS

1. **Use el config correcto:** Ver tabla en plan detallado (4 configs diferentes según tipo de contenido)
2. **Testing es OBLIGATORIO:** Después de sanitizar, inyecta: `<img src=x onerror='alert("XSS")'>`  - Debe NO ejecutar
3. **Commits pequeños:** 1-2 archivos por commit = mejor git history
4. **Paralelizable:** Puedes editar 2-3 archivos simultáneamente si son independientes
5. **No hay deadline:** Pero SEMANA 1 es crítico (34+34+34+17+16 = 135 riesgos en 5 archivos)

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿DOMPurify ya está instalado?**
A: Verificar en `package.json`. Si no, ejecutar: `npm install dompurify@3.0.6`

**P: ¿Qué config debo usar?**
A:
- Tablas de datos → `config_tablas`
- Validación de formularios → `config_formularios`
- Comentarios de usuarios → `config_ugc`
- Modales simples → `config_simple`

**P: ¿Puede romper funcionalidad?**
A: Si usas el config CORRECTO para el contexto, NO. Test después de cambiar.

**P: ¿Cuánto tiempo por archivo?**
A: Críticos (34 riesgos) = 2-2.5h | Altos (9 riesgos) = 1h | Medios (5) = 20min | Bajos (3-4) = 15min

**P: ¿Hago un PR grande o commits pequeños?**
A: Commits pequeños (1-2 archivos). Más fácil para code review.

---

## 📞 SOPORTE

- Detalles técnicos: Ve a `FASE-2-BLOQUE-4-SANITIZACION-62-ARCHIVOS.md`
- Configs DOMPurify: Sección "Configuración Uniforme DOMPurify" en plan
- XSS Vectors para testing: Sección "Testing de Seguridad" en plan

---

**Tiempo para leer esto:** 5 minutos
**Tiempo para sanitizar 5 archivos Semana 1:** 6-8 horas
**Beneficio de seguridad:** -100% XSS vulnerabilities (613 → 0)

**¡A sanitizar! 🛡️**
