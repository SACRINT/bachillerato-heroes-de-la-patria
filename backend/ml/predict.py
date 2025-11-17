"""
🔮 STUDENT SUCCESS PREDICTION - INFERENCE SCRIPT
SEMANA 17 - Machine Learning & AI

Script para predicciones individuales (llamado desde backend API)

Uso:
    echo '{"attendance_rate": 75, "avg_grade": 7.5, ...}' | python3 predict.py

Fecha: 17 Noviembre 2025
Estado: ✅ PRODUCTION-READY
"""

import sys
import json
import numpy as np
import joblib
import os

# =============================================================================
# CONFIGURATION
# =============================================================================

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'student_success_model.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'student_success_scaler.pkl')

# =============================================================================
# LOAD MODEL
# =============================================================================

def load_model():
    """Carga modelo y scaler pre-entrenados"""
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        return model, scaler
    except FileNotFoundError:
        print(json.dumps({
            'error': 'Model not found. Please run student-success-model.py first to train the model.'
        }), file=sys.stderr)
        sys.exit(1)

# =============================================================================
# PREDICTION
# =============================================================================

def predict(student_features):
    """
    Predice riesgo de deserción

    Args:
        student_features (dict): Features del estudiante

    Returns:
        dict: Predicción con probabilidad y categoría
    """
    model, scaler = load_model()

    # Orden de features (debe coincidir con entrenamiento)
    feature_columns = [
        'attendance_rate',
        'avg_grade',
        'min_grade',
        'max_grade',
        'grade_stddev',
        'login_count',
        'assignments_submitted',
        'age',
        'engagement_score',
        'grade_consistency',
        'preliminary_risk',
        'gender_male',
        'gender_female'
    ]

    # Extraer features en el orden correcto
    features_array = np.array([[
        student_features.get(f, 0) for f in feature_columns
    ]])

    # Normalizar
    features_scaled = scaler.transform(features_array)

    # Predicción
    dropout_probability = float(model.predict_proba(features_scaled)[0][1])
    success_probability = float(1 - dropout_probability)

    # Categoría de riesgo
    if dropout_probability >= 0.7:
        risk_category = 'high'
        risk_label = 'Alto Riesgo'
        color = '#dc3545'  # Bootstrap danger
    elif dropout_probability >= 0.4:
        risk_category = 'medium'
        risk_label = 'Riesgo Medio'
        color = '#ffc107'  # Bootstrap warning
    else:
        risk_category = 'low'
        risk_label = 'Bajo Riesgo'
        color = '#28a745'  # Bootstrap success

    # Recomendación
    recommendation = get_recommendation(risk_category, student_features)

    return {
        'dropout_probability': dropout_probability,
        'success_probability': success_probability,
        'risk_category': risk_category,
        'risk_label': risk_label,
        'risk_color': color,
        'recommendation': recommendation,
        'confidence': get_confidence_level(dropout_probability)
    }

def get_recommendation(risk_category, features):
    """
    Genera recomendación personalizada

    Args:
        risk_category (str): 'high', 'medium', 'low'
        features (dict): Features del estudiante

    Returns:
        str: Recomendación
    """
    if risk_category == 'high':
        recommendations = []

        if features.get('attendance_rate', 100) < 70:
            recommendations.append("Mejorar asistencia (actualmente <70%)")

        if features.get('avg_grade', 10) < 6:
            recommendations.append("Reforzar aprendizaje (promedio <6.0)")

        if features.get('engagement_score', 100) < 30:
            recommendations.append("Aumentar participación en plataforma")

        if not recommendations:
            recommendations.append("Contactar con tutor académico para evaluación personalizada")

        return " | ".join(recommendations)

    elif risk_category == 'medium':
        return "Monitorear desempeño académico regularmente | Considerar tutoría preventiva"

    else:
        return "Continuar con buen desempeño | Explorar oportunidades de liderazgo estudiantil"

def get_confidence_level(probability):
    """
    Calcula nivel de confianza de la predicción

    Args:
        probability (float): Probabilidad de deserción (0-1)

    Returns:
        str: 'high', 'medium', 'low'
    """
    # Confianza alta cuando la probabilidad está cerca de 0 o 1
    distance_from_uncertain = abs(probability - 0.5)

    if distance_from_uncertain >= 0.3:
        return 'high'
    elif distance_from_uncertain >= 0.15:
        return 'medium'
    else:
        return 'low'

# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == '__main__':
    try:
        # Leer features desde stdin (JSON)
        input_data = sys.stdin.read()

        if not input_data.strip():
            print(json.dumps({
                'error': 'No input data provided'
            }), file=sys.stderr)
            sys.exit(1)

        student_features = json.loads(input_data)

        # Hacer predicción
        prediction = predict(student_features)

        # Output como JSON a stdout
        print(json.dumps(prediction))

        sys.exit(0)

    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}'
        }), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({
            'error': f'Prediction failed: {str(e)}'
        }), file=sys.stderr)
        sys.exit(1)
