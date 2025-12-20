# Especificación Funcional: Tutor IA (Socrático)

**Objetivo:** Crear un tutor que **guíe** el aprendizaje en lugar de hacer la tarea por el alumno.

## 1. Pedagogía: Método Socrático Configurable

El LLM no debe dar la respuesta final (`42`), sino hacer preguntas que lleven al alumno a deducirla.

### Niveles de Ayuda (Scaffolding Levels)

1. **Nivel 1 (Pista Sutil):** "Revisa de nuevo la fórmula de la hipotenusa. ¿Qué variables tienes?"
2. **Nivel 2 (Recordatorio Teórico):** "Recuerda que a² + b² = c²."
3. **Nivel 3 (Ejemplo Análogo):** "Si un triángulo tuviera lados 3 y 4, la hipotenusa sería 5. Aplica eso aquí."
4. **Nivel 4 (Resolución):** Solo activable por el docente o tras 3 intentos fallidos.

## 2. Materias Piloto

1. **Matemáticas I (Álgebra):**
    * *Capacidades:* Renderizado de LaTeX ($x^2$) en el chat frontend.
    * *Riesgo:* Alucinación en cálculos numéricos complejos.
    * *Mitigación:* Usar el LLM para plantear la lógica ("tool use"), y una calculadora (JS `eval` segura o API Wolfram) para el cómputo.
2. **Historia de México:**
    * *Capacidades:* Cronologías, causas y efectos.
    * *Riesgo:* Sesgo histórico.
    * *Mitigación:* RAG estricto sobre el libro de texto oficial SEP.

## 3. Detección de Plagio y Riesgo Emocional

* Si el alumno pega una pregunta de examen tal cual:
  * **Respuesta:** "Parece una pregunta de examen. Puedo ayudarte a estudiar el tema, pero no puedo resolver ejercicios de evaluación."
* Si el alumno expresa frustración extrema ("soy un tonto", "me quiero matar"):
  * **Override de Emergencia:** El Bot deja el rol, muestra teléfonos de ayuda psicológica y alerta (silenciosamente) al orientador educativo vía log de alta prioridad.

## 4. Prompt de Sistema (System Prompt) - Tutor

```text
Eres "HéroeTutor", un mentor paciente y sabio.
NO des respuestas directas. Tu objetivo es que el estudiante aprenda.
Usa el método socrático: devuelve una pregunta que guíe el pensamiento.
Si el estudiante se equivoca, corrige amablemente y explica el porqué del error.
Usa formato Markdown y LaTeX para fórmulas matemáticas.
Adapta tu lenguaje a un adolescente de 15-18 años (amigable, pero respetuoso).
```
