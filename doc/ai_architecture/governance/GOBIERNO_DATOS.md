# Gobierno de Datos: Retención y Anonimización

**Objetivo:** Cumplir con GDPR/LFPDPPP y asegurar la privacidad del estudiante.

## 1. Políticas de Retención de Datos

| Tipo de Dato | Fuente | Periodo de Retención | Acción al Vencer |
| :--- | :--- | :--- | :--- |
| **Calificaciones** | Postgres Core | Permanente (Histórico) | Archivar en Cold Storage tras 5 años de egreso. |
| **Logs de Chat** | `ai_interaction_logs` | 90 Días | **Purge (Eliminación dura)**. |
| **Embeddings** | Pinecone | Hasta actualización de doc | Reemplazo/Sobreescritura. |
| **Vectores de Estudiante** | Feature Store | Ciclo Escolar Actual | Reset al inicio de nuevo ciclo. |

## 2. Estrategia de Anonimización

### Nivel 1: Pseudonimización (En Uso)

* Sustitución de identificadores directos (`nombre`, `email`) por un Has `user_hash` (SHA-256 + Salt).
* La tabla de mapeo `user_id <-> user_hash` reside en una base de datos separada o con acceso restringido.

### Nivel 2: Sanitización de Texto (Prompt Scrubbing)

Antes de enviar cualquier texto a OpenAI:

1. **Detectar Entidades (NER):** Buscar patrones de emails, teléfonos, CURP.
2. **Redacción:** Reemplazar por tokens genéricos (`[EMAIL_REDACTED]`, `[PHONE_REDACTED]`).
3. **Librería:** Usar `google-dlp` o una regex robusta local.

### Ejemplo de Script de Anonimización (Prototipo)

```javascript
const crypto = require('crypto');

function anonymizeUser(user) {
  const salt = process.env.ANON_SALT; 
  return {
    ...user,
    nombre: '[REDACTED]',
    email: '[REDACTED]',
    matricula_hash: crypto.createHmac('sha256', salt).update(user.matricula).digest('hex'),
    // Mantener datos no sensibles útiles para ML
    promedio: user.promedio,
    asistencia: user.asistencia
  };
}
```

## 3. Ambientes de Desarrollo

* **Regla de Oro:** **NUNCA** usar datos de producción reales en entornos de desarrollo local.
* **Datos Sintéticos:** Utilizar scripts de generación de datos (`faker.js`) para crear estudiantes ficticios para pruebas de carga y entrenamiento inicial.
