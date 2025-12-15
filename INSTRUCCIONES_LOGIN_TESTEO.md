# 🧪 INSTRUCCIONES PARA PROBAR EL LOGIN

## ❌ Problema Identificado

El sistema de login falló porque **no hay usuarios en la base de datos de Neon**. Por eso cuando intentas iniciar sesión, las credenciales no se encuentran.

## ✅ Solución: Crear Usuarios de Prueba

### Paso 1: Ejecutar SQL en Neon Console

1. Ve a **Neon Console** (https://console.neon.tech)
2. Selecciona tu proyecto **BGE Heroes de la Patria**
3. Abre **SQL Editor**
4. **Copia el contenido completo** del archivo:
   ```
   backend/scripts/insert-test-users-2025.sql
   ```
5. **Pega el SQL** en Neon
6. Haz clic en **Execute**

### Paso 2: Usuarios Creados

Se crearán **3 usuarios de prueba**. **IMPORTANTE: El login usa EMAIL, no username**

| Email | Password | Rol |
|-------|----------|-----|
| `docente@test.com` | `Test123!` | Docente ✅ |
| `admin@test.com` | `Admin123!` | Admin ✅ |
| `estudiante@test.com` | `Estudiante123!` | Estudiante ✅ |

### Paso 3: Probar Login

1. **Abre el navegador** en `http://localhost:3000/` o `http://localhost:3000/docentes.html`
2. **Recarga con Ctrl+Shift+R** (limpiar cache del navegador)
3. **Haz clic en "Iniciar Sesión"**
4. **Ingresa credenciales (USA EMAIL, NO USERNAME)**:
   - **Email**: `docente@test.com` (o `admin@test.com`)
   - **Password**: `Test123!` (o `Admin123!`)
5. Haz clic en **Iniciar Sesión**

### Paso 4: Verificar Token

Si el login es exitoso:
- ✅ El modal de login desaparece
- ✅ El token se guarda en localStorage con clave `'bge_auth_token'`
- ✅ Puedes navegar a `soporte.html` y `mensajeria.html` sin prompts de login

### Paso 5: Probar Otras Páginas

Intenta acceder a:
- `http://localhost:3000/soporte.html` ✅ Deberías ver la página de tickets
- `http://localhost:3000/mensajeria.html` ✅ Deberías ver la página de mensajería

---

## 🔍 Si Aún No Funciona

**Abre la Consola del Navegador (F12)** e:

1. **Verifica que el token se guardó**:
   ```javascript
   // En la consola del navegador, escribe:
   console.log(localStorage.getItem('bge_auth_token'));
   console.log(sessionStorage.getItem('bge_auth_token'));
   ```

2. **Si no ves nada**, significa que el login FALLÓ. Busca mensajes de error como:
   - "Error de conexión"
   - "Credenciales inválidas"
   - "El usuario no existe"

3. **Copia TODOS los mensajes de error** de la consola y comparte conmigo

---

## 📝 SQL Manual (Si Prefieres)

Si no quieres usar el archivo SQL, puedes ejecutar esto directamente en Neon:

```sql
-- Usuario Docente (email: docente@test.com, password: Test123!)
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'docente_test',
    'docente@test.com',
    '$2a$10$zYgIkP51upm0kyxOP5asR.VpMJW.GZYSzjgI8/2B.IdnD4kDOSa6W',
    'docente',
    'activo',
    'Docente',
    'Test',
    'BGE'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Usuario Admin (email: admin@test.com, password: Admin123!)
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'admin_test',
    'admin@test.com',
    '$2a$10$lepyfr3qX6oUOvdaxn0TEeQQ4Aq/pGWyj9RdcQtkHNphgTLgcvR8a',
    'admin',
    'activo',
    'Admin',
    'Test',
    'BGE'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

---

## ⚠️ Notas Importantes

- Las **contraseñas están hasheadas con bcrypt** (nivel 10)
- Los hashes son **únicos e irreversibles**
- Después de probar, **elimina estos usuarios** de producción
- Usa contraseñas reales para usuarios en producción

---

¿Necesitas ayuda? Comparte:
1. ✅ Pantalla de la consola con los mensajes de error
2. ✅ El resultado de ejecutar el SQL
3. ✅ Las credenciales que intentaste usar
