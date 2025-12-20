# Checklist de Hardening de Seguridad (IA & Web)

**Fecha:** 17 Oct 2025
**Fase:** Pre-Despliegue Fase 1

## 1. API & Backend (Node.js)

- [ ] **Rate Limiting:** Implementado en todas las rutas `/api/ai/*`.
- [ ] **Validación de Input:** Todos los prompts usuario pasan por `sanitize()` (eliminar scripts, SQL).
- [ ] **Dependency Scan:** `npm audit` corre limpio sin vulnerabilidades altas.
- [ ] **Headers HTTP:** Security headers (Helmet) activados (CSP, HSTS, X-Frame-Options).
- [ ] **Error Handling:** El backend NO devuelve stack traces al frontend en producción.

## 2. LLM & Prompt Injection

- [ ] **System Prompt Lock:** El System Prompt está inyectado como mensaje `system` y no concatenado al `user`.
- [ ] **Input Truncation:** Limitar input de usuario a max 1000 caracteres para evitar desbordamiento de contexto o ataques de denegación de servicio económico.
- [ ] **Output Validation:** La respuesta del LLM se escanea en busca de patrones prohibidos antes de mostrarse.

## 3. Base de Datos (Postgres & Pinecone)

- [ ] **Least Privilege:** El usuario de DB de la aplicación NO es superusuario.
- [ ] **Encryption at Rest:** Confirmar que Neon/Pinecone cifran datos en disco.
- [ ] **No Public Access:** La base de datos no es accesible desde 0.0.0.0/0 (solo desde Vercel IPs).

## 4. Gestión de Secretos

- [ ] **.env Audit:** Verificar que no hay secretos hardcodeados en el código fuente.
- [ ] **Git History:** Verificar que no se commitearon secretos en el pasado (usar `git-secrets`).
- [ ] **Access Review:** Revocar API Keys de prueba antiguas.
