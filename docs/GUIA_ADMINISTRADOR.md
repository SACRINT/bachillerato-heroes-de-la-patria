# 🛡️ Guía del Administrador - Gestión de Solicitudes

## 🔐 **ACCESO AL PANEL ADMINISTRATIVO**

### **PASO 1: Ir al Panel de Administración**
1. **URL directa:** `admin-dashboard.html`
2. **O desde la página principal:** Link en el footer que dice "Admin"

### **PASO 2: Iniciar Sesión como Administrador**
**Credenciales por defecto:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** Director

### **PASO 3: Acceder a Solicitudes**
1. Una vez dentro del dashboard
2. Click en la pestaña **"Solicitudes"** 
3. Verás un contador con el número de solicitudes pendientes

---

## 📋 **DÓNDE VER LAS SOLICITUDES PENDIENTES**

### **Ubicación Visual:**
- **Pestaña:** "Solicitudes" (con ícono de usuario + plus)
- **Contador:** Badge amarillo con número de pendientes
- **Sección:** "Solicitudes de Registro"

### **Información que Verás de Cada Solicitud:**
```
┌─────────────────────────────────────┐
│ 👤 Juan Pérez García          [Pendiente] │
├─────────────────────────────────────┤
│ Email: juan@example.com             │
│ Teléfono: 222-123-4567             │
│ Tipo: 👨‍🎓 Estudiante                │
│ Matrícula: 2024-0123                │
│ Fecha: 11/01/2025                   │
│ Motivo: "Necesito acceso para..."   │
├─────────────────────────────────────┤
│ [✅ Aprobar] [❌ Rechazar] [👁️ Ver] │
└─────────────────────────────────────┘
```

---

## ⚡ **PROCESO DE GESTIÓN DE SOLICITUDES**

### **Para APROBAR una solicitud:**
1. **Click en "✅ Aprobar"**
2. **Confirmar en el popup**
3. **El sistema:**
   - Marca la solicitud como aprobada
   - La elimina de la lista
   - Muestra notificación de éxito
   - Actualiza el contador

### **Para RECHAZAR una solicitud:**
1. **Click en "❌ Rechazar"**
2. **Escribir motivo** (opcional pero recomendado)
3. **El sistema:**
   - Marca como rechazada
   - La elimina de la lista
   - Guarda el motivo del rechazo
   - Actualiza el contador

### **Para VER DETALLES:**
1. **Click en "👁️ Ver Detalles"**
2. **Se abrirá modal** con información completa
3. **Desde ahí también puedes aprobar/rechazar**

---

## 🔄 **FLUJO COMPLETO DEL PROCESO**

### **1. Usuario solicita registro:**
```
Usuario llena formulario → Solicitud guardada → Aparece en tu panel
```

### **2. Tú como administrador decides:**
```
Panel Admin → Pestaña "Solicitudes" → Ver info → Aprobar/Rechazar
```

### **3. Resultado para el usuario:**
```
✅ APROBADO → Puede crear cuenta e iniciar sesión
❌ RECHAZADO → Recibe notificación con motivo
```

---

## 📊 **INDICADORES VISUALES**

### **Contador de Solicitudes:**
- **Badge amarillo** en la pestaña "Solicitudes"
- **Número** = solicitudes pendientes
- **"Sin solicitudes"** cuando no hay pendientes

### **Estados de las Solicitudes:**
- 🟡 **Pendiente** - Esperando tu decisión
- ✅ **Aprobada** - Usuario puede crear cuenta
- ❌ **Rechazada** - Usuario notificado del rechazo

---

## 🛠️ **ACCIONES DISPONIBLES**

### **En cada solicitud puedes:**
1. **✅ Aprobar** - Dar acceso al usuario
2. **❌ Rechazar** - Denegar acceso con motivo
3. **👁️ Ver Detalles** - Más información
4. **🔄 Actualizar** - Buscar nuevas solicitudes

### **Botones del Panel:**
- **"Actualizar"** - Recargar solicitudes
- **Badge contador** - Ver número pendiente
- **Filtros** (futuro) - Filtrar por tipo de usuario

---

## 📝 **TIPOS DE USUARIOS QUE PUEDEN SOLICITAR**

### **👨‍🎓 Estudiantes:**
- Requieren **matrícula válida**
- Acceso a calificaciones, horarios, materiales
- Necesitan aprobar para ver información académica

### **👨‍👩‍👧‍👦 Padres de Familia:**
- Requieren **matrícula de su hijo**
- Acceso a calificaciones del estudiante
- Comunicación con profesores

### **👨‍🏫 Docentes:**
- No requieren matrícula
- Acceso a herramientas de enseñanza
- Gestión de calificaciones y materiales

### **🏛️ Personal Administrativo:**
- No requieren matrícula
- Acceso completo al sistema
- Pueden aprobar otras solicitudes

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Verificaciones Recomendadas:**
1. **Email válido** - Verificar que sea real
2. **Matrícula correcta** - Para estudiantes/padres
3. **Motivo coherente** - Leer la justificación
4. **Tipo de usuario** - Confirmar rol solicitado

### **Criterios de Aprobación:**
- ✅ **Estudiantes:** Matrícula válida del plantel
- ✅ **Padres:** Matrícula de hijo inscrito
- ✅ **Docentes:** Verificar que trabajan en el plantel
- ✅ **Administrativos:** Autorización del director

### **Motivos de Rechazo Comunes:**
- ❌ Matrícula inexistente o incorrecta
- ❌ No pertenece al plantel
- ❌ Información falsa o incompleta
- ❌ Solicitud duplicada

---

## 🔐 **SEGURIDAD DEL SISTEMA**

### **Control de Acceso:**
- Solo usuarios **administrativos** pueden ver solicitudes
- Credenciales requeridas para acceder al panel
- Registro de todas las acciones realizadas

### **Datos Almacenados:**
- **Modo Actual:** localStorage del navegador
- **Modo Futuro:** Base de datos MySQL segura
- **Información:** Encriptada y protegida

---

## 🆘 **SOLUCIÓN DE PROBLEMAS**

### **"No veo solicitudes":**
1. **Click en "Actualizar"**
2. **Verificar que hay solicitudes:** Revisar localStorage
3. **Recargar página** del dashboard

### **"Error al aprobar/rechazar":**
1. **Verificar conexión** a internet
2. **Recargar página** y volver a intentar
3. **Contactar soporte técnico** si persiste

### **"No puedo acceder al panel":**
1. **Verificar credenciales:** admin / admin123
2. **Limpiar caché** del navegador
3. **Usar modo incógnito** para probar

---

## 📞 **CONTACTO Y SOPORTE**

### **Para problemas técnicos:**
- **Revisar consola** del navegador (F12)
- **Verificar errores** en JavaScript
- **Reiniciar navegador** si es necesario

### **Para cambiar credenciales:**
- **Editar archivo:** `admin-dashboard.html` línea 412
- **Cambiar usuario/contraseña** por valores seguros
- **Guardar cambios** y recargar

---

## 🎯 **RESUMEN RÁPIDO**

**Para gestionar solicitudes:**
1. Ir a `admin-dashboard.html`
2. Login: admin / admin123
3. Click pestaña "Solicitudes"
4. Ver lista de pendientes
5. Aprobar ✅ o Rechazar ❌
6. Usuario recibe notificación

**¡Ya está todo configurado y listo para usar!**