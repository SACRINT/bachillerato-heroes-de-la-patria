# Seguridad y Gestión de Secretos (IAM & API Keys)

**Objetivo:** Proteger las llaves del reino. Una fuga de la API Key de OpenAI puede costar miles de dólares en minutos.

## 1. Gestión de Variables de Entorno (.env)

### Reglas de Oro

1. **NUNCA** commitear archivos `.env` al repositorio Git.
2. Usar `Vercel Environment Variables` para inyectar secretos en tiempo de despliegue.
3. Rotación de llaves cada 90 días (o inmediata ante sospecha de brecha).

### Inventario de Secretos Críticos

* `OPENAI_API_KEY`: Acceso a LLMs. (Riesgo Financiero Alto).
* `PINECONE_API_KEY`: Acceso a base de conocimiento. (Riesgo de Datos).
* `DATABASE_URL`: Acceso a datos de alumnos. (Riesgo Crítico PII).
* `JWT_SECRET`: Firma de sesiones de usuario. (Riesgo de Suplantación).
* `AISERVICE_INTERNAL_KEY`: Llave maestra para comunicación interna entre servicios.

## 2. Control de Acceso Basado en Roles (RBAC) para IA

Definición de permisos específicos para los módulos de IA en la aplicación:

| Rol Usuario | Chatbot Admin | Tutor IA | Stats Dashboard | Logs Completos |
| :--- | :---: | :---: | :---: | :---: |
| **Estudiante** | ❌ | ✅ (Limitado) | ❌ | ❌ |
| **Docente** | ❌ | ✅ (Vista Docente) | ✅ (Su grupo) | ❌ |
| **Admin** | ✅ (Total) | ✅ | ✅ (Global) | ❌ (Solo Staff TI) |
| **SuperAdmin/Dev**| ✅ | ✅ | ✅ | ✅ |

## 3. Estrategia "Least Privilege" (Menor Privilegio)

* La **Database User** que usa la IA para leer datos del estudiante debe ser **SOLO LECTURA** (`GRANT SELECT ON estudiantes, calificaciones TO ai_reader_user`).
* La IA **NO DEBE** tener permisos de `DELETE` o `UPDATE` sobre tablas core (solo `INSERT` en sus propias tablas de logs).

## 4. Protección contra Abusos (Rate Limiting)

Implementación de límites duros en el API Gateway (`api/index.js`):

```javascript
// Ejemplo de configuración de Rate Limit
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // límite de 50 peticiones por IP/Usuario
  message: "Has excedido tu cuota de consultas al Asistente IA por esta hora."
});

app.use('/api/ai/', aiRateLimiter);
```
