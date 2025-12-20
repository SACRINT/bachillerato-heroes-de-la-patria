# Esquema de Metadatos: Expediente del Estudiante 360

Este esquema JSON define la estructura de datos unificada que la IA utilizará para "entender" al estudiante.

## JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Student360Profile",
  "description": "Perfil integral del estudiante para personalización educativa",
  "type": "object",
  "properties": {
    "identity": {
      "type": "object",
      "properties": {
        "student_hash": { "type": "string", "description": "Hash SHA-256 de la matrícula" },
        "grade_level": { "type": "integer", "minimum": 1, "maximum": 6 },
        "enrollment_year": { "type": "integer" }
      },
      "required": ["student_hash", "grade_level"]
    },
    "academics": {
      "type": "object",
      "properties": {
        "gpa_current": { "type": "number" },
        "failed_subjects_count": { "type": "integer" },
        "strengths": { 
          "type": "array", 
          "items": { "type": "string", "enum": ["Math", "History", "Science", "Arts", "Sports"] } 
        },
        "weaknesses": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "behavior": {
      "type": "object",
      "properties": {
        "attendance_rate": { "type": "number", "minimum": 0, "maximum": 1 },
        "lms_login_frequency": { "type": "string", "enum": ["Daily", "Weekly", "Rarely"] },
        "submission_punctuality": { "type": "number", "description": "0-1 score, 1 is always on time" }
      }
    },
    "learning_style": {
      "type": "object",
      "description": "Inferido por IA basado en interacciones",
      "properties": {
        "visual_learner_score": { "type": "number" },
        "text_learner_score": { "type": "number" },
        "active_learner_score": { "type": "number" },
        "preferred_content_format": { "type": "string", "enum": ["Video", "Text", "Quiz", "Interactive"] }
      }
    },
    "risks": {
      "type": "object",
      "properties": {
        "dropout_risk_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "last_risk_assessment_date": { "type": "string", "format": "date-time" },
        "risk_factors": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "required": ["identity", "academics"]
}
```

## Uso del Esquema

1. **Input del Modelo:** Este JSON se serializa y se pasa como contexto al System Prompt del Tutor IA:
    * *Prompt:* "Eres un tutor. Estás ayudando al estudiante ID:X. Ten en cuenta que es un aprendiz visual y tiene dificultades en Matemáticas."
2. **Feature Vector:** Los campos numéricos se concatenan para formar el vector de entrada del modelo de predicción de deserción.
