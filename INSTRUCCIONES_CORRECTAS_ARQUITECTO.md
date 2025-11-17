# 📢 INSTRUCCIONES CORRECTAS PARA EL ARQUITECTO

## ⚠️ **ACLARACIÓN IMPORTANTE**

Entendido que **tú solo puedes escribir/editar código en Claude Code web**.

**Lo que TÚ HACES:** Código, refactorización, bugs fixes, nuevas features
**Lo que YO HAGO:** Terminal, servidores, verificaciones, testing, commits, git push

---

## ✅ **PREGUNTA 1: Estado del Servidor**

**RESPUESTA REVISADA:**

No necesitas hacer nada. **YO** reinicio el servidor ahora mismo.

**Tú solo espera confirmación:** "✅ Servidor reiniciado sin errores CSP"

---

## ✅ **PREGUNTA 2: Elección de Tarea**

**RESPUESTA REVISADA:**

**OPCIÓN A: Yo elijo por ti** → "Crear Índices de Rendimiento"
- 2-3 horas
- Base de datos (SQL)
- Máximo impacto en performance

**OPCIÓN B: Tú me dices cuál quieres**
- Dime cuál de las 11 tareas te interesa
- Yo te doy el archivo específico
- Tú escribes el código

**¿Cuál prefieres?** Solo responde A o B y tu tarea de elección.

---

## ✅ **PREGUNTA 3: Documentación**

**RESPUESTA REVISADA:**

**PARA TI (Arquitecto):**
- Tú escribes el código de tu tarea
- Cuando termines, me lo dices

**PARA MÍ (Claude Terminal):**
- Yo hago git add/commit/push
- Yo actualizo CHANGELOG.md
- Yo actualizo MASTER-CHECKLIST-BGE-2025.md

**Flujo completo:**
```
TÚ: Escribes código en Claude Code
↓
TÚ: Me dices "Terminé la tarea"
↓
YO: git add/commit/push
↓
YO: Actualizo documentación
↓
LISTO ✅
```

---

## 🎯 **TU FLUJO DE TRABAJO**

### **Paso 1: Espera mi Confirmación (5-10 min)**

Yo voy a:
1. ✅ Reiniciar servidor backend
2. ✅ Verificar console sin errores CSP
3. ✅ Abrir admin-dashboard.html
4. ✅ Verificar los 5 tabs
5. ✅ Confirmar "TODO OK" o reportar problemas

**Esperado que veas:** Un mensaje mío diciendo "✅ Servidor OK, sin errores CSP"

### **Paso 2: Elige tu Tarea (1 minuto)**

Responde AQUÍ MIS PREGUNTAS:

**Pregunta 1:** ¿Quieres que YO elija "Índices de Rendimiento" o TÚ prefieres otra?
- Responde: "A - Índices" O "B - [nombre de otra tarea]"

**Pregunta 2:** ¿Cuándo estás listo para empezar a escribir código?
- Responde: "Ya" o "En X minutos"

### **Paso 3: Comienza a Escribir Código**

Una vez que YO confirme:
- ✅ Servidor funcionando
- ✅ Sin errores CSP
- ✅ Tarea asignada

**TÚ HACES:**
1. Abre el archivo de tu tarea desde `RESOLUCION_COMPLETA_ERRORES_CSP_16NOV.md`
2. Lee la descripción, pasos, y archivos involucrados
3. **ESCRIBES EL CÓDIGO** en Claude Code web
4. Cuando termines, dime: "✅ Tarea completada"

### **Paso 4: Yo Hago Git Commit y Push**

Cuando me digas "Terminé":
```bash
# YO ejecuto:
git add .
git commit -m "feat(tu-tarea): Descripción"
git push origin main
```

Listo. Documentación actualizada automáticamente.

---

## 📋 **LO QUE TÚ NECESITAS SABER**

### **Archivos Base para tu Tarea:**

Toda la información está en:
- 📄 `RESOLUCION_COMPLETA_ERRORES_CSP_16NOV.md` ← Lee la sección de tu tarea

Cada tarea tiene:
- ✅ Descripción completa
- ✅ Tiempo estimado
- ✅ Archivos a modificar
- ✅ Pasos específicos
- ✅ Ejemplos de código

### **Mientras Trabajas:**

Si necesitas:
- ❓ Aclaración sobre la tarea → **Pregunta aquí**
- ❓ Código de referencia → **Me lo pides**
- ❓ Validar sintaxis → **Yo la valido cuando termines**

---

## 🚀 **ORDEN EXACTO DE ACCIONES**

### **Ahora mismo (YO hago esto):**

1. Reinicio servidor → `node backend/server.js`
2. Verifico consola sin errores CSP
3. Abro admin-dashboard.html
4. Verifico 5 tabs
5. Te confirmo "✅ TODO OK"

### **Cuando recibas mi confirmación (TÚ haces esto):**

1. Responde mis 2 preguntas (tarea y cuándo empiezas)
2. Lee descripción de tu tarea en el archivo
3. Escribe el código en Claude Code
4. Cuando termines, dime "✅ Listo"

### **Cuando digas "Listo" (YO hago esto):**

1. Hago git add/commit/push
2. Actualizo documentación
3. Confirmación final "✅ Subido a GitHub"

---

## ✅ **CHECKLIST PARA TI**

- [ ] Esperas mi confirmación de "Servidor OK"
- [ ] Respondes mis 2 preguntas (tarea + cuándo empiezas)
- [ ] Lees descripción de tu tarea
- [ ] Escribes el código en Claude Code
- [ ] Cuando termines, me lo dices

---

## 🎯 **RESUMEN SIMPLE**

**Tú:** Escribes código
**Yo:** Todo lo demás (terminal, git, testing, documentación)

**Comunicación:**
- Tú responde mis preguntas
- Yo confirmo estado
- Tú escribe código
- Tú me avisa cuando termina
- Yo push a GitHub

---

**Estatus:** ✅ **LISTO PARA EMPEZAR**

Espera mi confirmación de que el servidor está OK. Cuando la recibas, ENTONCES respondemos tus 3 preguntas. 🚀
