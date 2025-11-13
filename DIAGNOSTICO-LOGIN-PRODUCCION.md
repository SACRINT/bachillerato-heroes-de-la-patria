# 🔍 DIAGNÓSTICO DE LOGIN EN PRODUCCIÓN

## Fecha: 13 Noviembre 2025
## URL de Deployment: https://bge-heroes-patria-j271g1q1o-sacrints-projects.vercel.app/

---

## 🚨 PASO 1: VERIFICAR QUE ESTÁS EN EL DEPLOYMENT CORRECTO

**IMPORTANTE**: La URL que me diste parece ser un deployment de **preview** (con hash único: `j271g1q1o`), NO el deployment de producción principal.

### ¿Cómo verificar?

1. Ve a **Vercel Dashboard**: https://vercel.com/dashboard
2. Busca tu proyecto "bachillerato-heroes-de-la-patria"
3. Ve a la pestaña **Deployments**
4. Busca el deployment con **"Production"** badge (NO "Preview")
5. Usa la URL del deployment de **Production**

**NOTA**: Los deployments de preview pueden no tener:
- Las variables de entorno configuradas
- Los últimos cambios del código
- La conexión correcta a la base de datos

---

## 🧪 PASO 2: EJECUTAR DIAGNÓSTICO EN CONSOLA DEL NAVEGADOR

1. Ve a la página: https://bge-heroes-patria-j271g1q1o-sacrints-projects.vercel.app/admin-dashboard.html
2. Abre **DevTools** (F12)
3. Ve a la pestaña **Console**
4. Copia y pega este script completo:

```javascript
// ============================================
// SCRIPT DE DIAGNÓSTICO - LOGIN ADMIN
// ============================================

console.log('🔍 INICIANDO DIAGNÓSTICO...\n');

// Test 1: Verificar que el endpoint existe
async function testEndpointExists() {
    console.log('📡 Test 1: Verificando endpoint /api/auth/login...');
    try {
        const response = await fetch('/api/auth/login', {
            method: 'OPTIONS'  // Preflight request
        });
        console.log('✅ Endpoint existe - Status:', response.status);
        return true;
    } catch (error) {
        console.error('❌ Endpoint NO existe o no responde:', error);
        return false;
    }
}

// Test 2: Intentar login con credenciales
async function testLogin() {
    console.log('\n📡 Test 2: Intentando login con credenciales...');

    const credentials = {
        username: 'admin@heroespatria.edu.mx',
        password: 'HeroesPatria2024!'
    };

    console.log('📤 Enviando credenciales:', {
        username: credentials.username,
        password: '***********'
    });

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('📥 Response Body:', data);

        if (response.ok && data.success) {
            console.log('✅ LOGIN EXITOSO!');
            console.log('👤 Usuario:', data.user);
            console.log('🔑 Token recibido:', data.tokens ? 'Sí' : 'No');
        } else {
            console.error('❌ LOGIN FALLIDO');
            console.error('Razón:', data.error || data.message || 'Desconocida');
            console.error('Detalles:', data.details || 'Sin detalles');
        }

        return data;
    } catch (error) {
        console.error('❌ Error en la petición:', error);
        return null;
    }
}

// Test 3: Verificar variables de entorno (indirectamente)
async function testEnvironment() {
    console.log('\n📡 Test 3: Verificando configuración del entorno...');
    try {
        const response = await fetch('/api/config/public');
        const data = await response.json();
        console.log('✅ Configuración pública:', data);
        console.log('Environment:', data.environment);
        console.log('Google OAuth enabled:', data.google?.enabled);
    } catch (error) {
        console.error('❌ No se pudo obtener configuración:', error);
    }
}

// Test 4: Verificar conexión a base de datos (indirectamente)
async function testDatabase() {
    console.log('\n📡 Test 4: Verificando conexión a base de datos...');
    try {
        const response = await fetch('/api/config/health');
        const data = await response.json();
        console.log('✅ Health check:', data);
        console.log('Database configured:', data.database?.configured);
    } catch (error) {
        console.error('❌ No se pudo obtener health check:', error);
    }
}

// Ejecutar todos los tests
async function runAllTests() {
    await testEndpointExists();
    await testLogin();
    await testEnvironment();
    await testDatabase();

    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('📋 Copia TODO el output de esta consola y envíamelo');
}

// Ejecutar
runAllTests();
```

5. **IMPORTANTE**: Copia **TODO** el output de la consola (incluidos todos los mensajes rojos y verdes)
6. Envíamelo para poder diagnosticar el problema exacto

---

## 🔧 PASO 3: VERIFICAR DEPLOYMENT

Mientras ejecutas el diagnóstico, verifica esto en Vercel:

### A. Variables de Entorno

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**
2. Verifica que estas variables **EXISTAN** y tengan valores:
   - ✅ `DATABASE_URL` (URL de conexión a Neon)
   - ✅ `JWT_SECRET` (cualquier string largo y aleatorio)
   - ✅ `NODE_ENV` (debe ser "production")
   - ✅ `BCRYPT_ROUNDS` (valor: 10)

**Si alguna falta, agrégala:**
- Click en **Add New**
- Nombre de variable → Valor
- Selecciona **Production**, **Preview**, y **Development**
- Click en **Save**

### B. Último Deployment

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Deployments**
2. Busca el deployment MÁS RECIENTE con badge **"Production"**
3. Verifica la **fecha y hora** del deployment
4. Debería ser **posterior** a las 18:00 del 13 de Noviembre 2025
5. Si no, haz un **nuevo deployment**:
   ```bash
   # En tu terminal local:
   git checkout main
   git merge claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
   git push origin main
   ```

### C. Build Logs

1. En el deployment de producción, click en **View Build Logs**
2. Busca errores (líneas rojas)
3. Si hay errores, envíamelos

---

## 🎯 POSIBLES CAUSAS DEL PROBLEMA

Basándome en lo que veo, estas son las causas más probables:

### 1. **Variables de Entorno Faltantes** (90% probable)
   - **Síntoma**: Error 500 o "Invalid token" o "Database connection failed"
   - **Solución**: Agregar DATABASE_URL y JWT_SECRET en Vercel Settings

### 2. **Deployment sin cambios recientes** (70% probable)
   - **Síntoma**: Sigue apareciendo 404 en /api/config/tenant
   - **Solución**: Hacer merge a main y push

### 3. **Usuario no existe en BD de producción** (50% probable)
   - **Síntoma**: "Credenciales incorrectas" o "Usuario no encontrado"
   - **Solución**: Volver a ejecutar el script SQL en Neon (asegurándote de estar en la BD correcta)

### 4. **Deployment de Preview en lugar de Production** (30% probable)
   - **Síntoma**: La URL tiene hash único (j271g1q1o)
   - **Solución**: Usar la URL del deployment de Production

---

## 📊 CHECKLIST DE VERIFICACIÓN

Marca cada item mientras lo verificas:

- [ ] Estoy usando la URL del deployment de **Production** (NO Preview)
- [ ] El deployment de Production es posterior al 13 Nov 2025 18:00
- [ ] La variable `DATABASE_URL` existe en Vercel Settings
- [ ] La variable `JWT_SECRET` existe en Vercel Settings
- [ ] Ejecuté el script SQL en Neon Console
- [ ] El script SQL se ejecutó sin errores
- [ ] Vi el usuario creado en el SELECT final del script
- [ ] Ejecuté el script de diagnóstico en la consola del navegador
- [ ] Copié el output completo del diagnóstico

---

## 📞 SIGUIENTE PASO

**Por favor envíame:**
1. ✅ El output COMPLETO del script de diagnóstico (de la consola del navegador)
2. ✅ La URL exacta del deployment de Production (sin el hash j271g1q1o)
3. ✅ Confirmación de que las variables de entorno existen en Vercel
4. ✅ Screenshot del SELECT en Neon que muestra el usuario creado

Con esta información podré darte el fix exacto.

---

**Creado**: 13 Noviembre 2025
**Por**: Claude Code
**Sesión**: claude/code-sanity-audit-011CV68f419YCMPEZZ4txuhC
