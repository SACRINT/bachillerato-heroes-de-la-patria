# Pipeline CI/CD para Componentes de IA (MLOps Lite)

**Objetivo:** Automatizar el despliegue seguro de cambios en prompts y configuraciones de IA sin romper producción.

## 1. Flujo de Trabajo (Workflow)

El pipeline de IA se integra al pipeline existente de la web, pero con pasos adicionales de validación.

### Etapas del Pipeline

1. **Code Commit:** Desarrollador empuja cambios (ej. mejora en el `System Prompt` del Tutor).
2. **Lint & Static Analysis:** Verificar sintaxis JSON/JS y secretos hardcodeados (GitGuardian).
3. **Unit Tests (IA):**
    * Verificar que los prompts renderizan correctamente.
    * Verificar que los parsers de respuesta (JSON Output) funcionan.
4. **Evaluation Tests (LLM Eval):**
    * *Paso Crítico:* Ejecutar un set de 20 preguntas de prueba contra el nuevo prompt.
    * *Aserción:* "El bot NO debe responder groserías", "El bot DEBE citar fuentes".
    * *Herramienta:* Script simple usando `promptfoo` o tests custom en Jest.
5. **Build & Deploy:** Si pasan los tests, Vercel construye y despliega a Preview/Staging.
6. **Human Review:** El equipo prueba el bot en el entorno de Preview.
7. **Promotion to Prod:** Merge a `main`.

## 2. Configuración de GitHub Actions

Archivo sugerido `.github/workflows/ai-ci.yml`:

```yaml
name: AI Quality Checks
on: [push, pull_request]

jobs:
  test-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run AI Unit Tests
        run: npm test --testPathPattern=tests/ai/
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
      
      - name: Check for PII Leaks in Prompts
        run: node scripts/security/scan-prompts.js
```

## 3. Versionado de Prompts

No hardcodear prompts en el código. Usar un archivo centralizado `config/prompts.json` o una base de datos.

* **Estructura:**

    ```json
    {
      "tutor_prompt": {
        "v1": "Eres un tutor...",
        "v2": "Eres un mentor socrático...",
        "active_version": "v2"
      }
    }
    ```

* Esto permite "Rollback" inmediato si la v2 falla, sin redeployar todo el código.
