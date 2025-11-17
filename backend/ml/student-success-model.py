"""
🤖 STUDENT SUCCESS PREDICTION MODEL
SEMANA 17 - Machine Learning & AI

Predice el riesgo de deserción estudiantil usando ML.

Objetivo: >85% accuracy
Features: Asistencia, calificaciones, engagement, demográficos
Algoritmo: Random Forest Classifier
Output: Probabilidad de deserción (0-1)

Fecha: 17 Noviembre 2025
Estado: ✅ PRODUCTION-READY
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import json
import os
import psycopg2
from dotenv import load_dotenv
import tensorflowjs as tfjs
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': os.getenv('DB_PORT', 5432)
}

MODEL_DIR = './backend/ml/models'
TFJS_MODEL_DIR = './public/models/student-success'
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(TFJS_MODEL_DIR, exist_ok=True)

# =============================================================================
# DATA EXTRACTION
# =============================================================================

def extract_student_data():
    """
    Extrae datos de estudiantes desde PostgreSQL

    Returns:
        pandas.DataFrame: Datos de entrenamiento
    """
    print("[ML] Connecting to database...")

    conn = psycopg2.connect(**DB_CONFIG)

    query = """
    WITH student_stats AS (
        SELECT
            u.uuid AS student_id,
            u.created_at AS enrollment_date,
            u.status,

            -- ASISTENCIA (Feature 1)
            COUNT(DISTINCT a.id) AS total_attendance_records,
            SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS days_present,
            ROUND(
                SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END)::NUMERIC /
                NULLIF(COUNT(DISTINCT a.id), 0) * 100,
                2
            ) AS attendance_rate,

            -- CALIFICACIONES (Feature 2)
            AVG(c.calificacion) AS avg_grade,
            MIN(c.calificacion) AS min_grade,
            MAX(c.calificacion) AS max_grade,
            STDDEV(c.calificacion) AS grade_stddev,

            -- ENGAGEMENT (Feature 3)
            COUNT(DISTINCT al.id) AS login_count,
            COUNT(DISTINCT te.id) AS assignments_submitted,

            -- DEMOGRÁFICOS (Feature 4)
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.date_of_birth)) AS age,
            u.gender,

            -- TARGET VARIABLE (deserción)
            CASE
                WHEN u.status IN ('inactivo', 'baja', 'suspendido') THEN 1
                ELSE 0
            END AS dropout

        FROM usuarios u
        LEFT JOIN asistencia a ON u.uuid = a.estudiante_id
        LEFT JOIN calificaciones c ON u.uuid = c.estudiante_id
        LEFT JOIN audit_logs al ON u.uuid = al.user_id AND al.action = 'LOGIN'
        LEFT JOIN tareas_estudiantes te ON u.uuid = te.estudiante_id

        WHERE u.role = 'estudiante'

        GROUP BY u.uuid, u.created_at, u.status, u.date_of_birth, u.gender
    )

    SELECT * FROM student_stats
    WHERE total_attendance_records > 0  -- Solo estudiantes con datos
    """

    print("[ML] Executing query...")
    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"[ML] Extracted {len(df)} student records")

    return df

# =============================================================================
# FEATURE ENGINEERING
# =============================================================================

def engineer_features(df):
    """
    Crea features adicionales derivadas

    Args:
        df (pandas.DataFrame): Datos crudos

    Returns:
        pandas.DataFrame: Datos con features ingeniería
    """
    print("[ML] Engineering features...")

    # Feature 1: Engagement score (combinación de logins + assignments)
    df['engagement_score'] = (
        (df['login_count'] / df['login_count'].max()) * 0.5 +
        (df['assignments_submitted'] / df['assignments_submitted'].max()) * 0.5
    ) * 100

    # Feature 2: Grade trend (si las calificaciones están mejorando/empeorando)
    # Usamos stddev como proxy: alta variabilidad = inconsistencia
    df['grade_consistency'] = 100 - (df['grade_stddev'].fillna(0) / 10 * 100)
    df['grade_consistency'] = df['grade_consistency'].clip(0, 100)

    # Feature 3: Risk score preliminar (combinación de múltiples factores)
    df['preliminary_risk'] = (
        (100 - df['attendance_rate']) * 0.3 +
        (100 - (df['avg_grade'] / 10 * 100)) * 0.4 +
        (100 - df['engagement_score']) * 0.3
    )

    # Feature 4: Edad en grupos (teenager, young adult, adult)
    df['age_group'] = pd.cut(
        df['age'],
        bins=[0, 18, 22, 100],
        labels=['teenager', 'young_adult', 'adult']
    )

    # Feature 5: Género (one-hot encoding)
    df['gender_male'] = (df['gender'] == 'M').astype(int)
    df['gender_female'] = (df['gender'] == 'F').astype(int)

    # Fill NaN values
    df.fillna({
        'avg_grade': df['avg_grade'].mean(),
        'min_grade': df['min_grade'].mean(),
        'max_grade': df['max_grade'].mean(),
        'grade_stddev': 0,
        'login_count': 0,
        'assignments_submitted': 0,
        'age': df['age'].median(),
        'engagement_score': 0,
        'grade_consistency': 50,
        'preliminary_risk': 50
    }, inplace=True)

    print("[ML] Feature engineering complete")

    return df

# =============================================================================
# MODEL TRAINING
# =============================================================================

def train_model(df):
    """
    Entrena Random Forest Classifier

    Args:
        df (pandas.DataFrame): Datos con features

    Returns:
        tuple: (model, scaler, metrics, feature_importance)
    """
    print("[ML] Training Random Forest model...")

    # Seleccionar features
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

    X = df[feature_columns]
    y = df['dropout']

    # Train-test split (80-20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Normalización
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        class_weight='balanced',  # Maneja clases desbalanceadas
        n_jobs=-1
    )

    model.fit(X_train_scaled, y_train)

    # Predicciones
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

    # Métricas
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1_score': f1_score(y_test, y_pred),
        'roc_auc': roc_auc_score(y_test, y_pred_proba),
        'train_size': len(X_train),
        'test_size': len(X_test),
        'dropout_rate': (y == 1).sum() / len(y)
    }

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("[ML] Model training complete")
    print(f"[ML] Accuracy: {metrics['accuracy']:.4f}")
    print(f"[ML] Precision: {metrics['precision']:.4f}")
    print(f"[ML] Recall: {metrics['recall']:.4f}")
    print(f"[ML] F1 Score: {metrics['f1_score']:.4f}")
    print(f"[ML] ROC AUC: {metrics['roc_auc']:.4f}")

    print("\n[ML] Top 5 Most Important Features:")
    print(feature_importance.head())

    return model, scaler, metrics, feature_importance, feature_columns

# =============================================================================
# MODEL EXPORT
# =============================================================================

def save_model(model, scaler, metrics, feature_importance, feature_columns):
    """
    Guarda modelo scikit-learn y metadata

    Args:
        model: Modelo entrenado
        scaler: StandardScaler
        metrics: Métricas de evaluación
        feature_importance: DataFrame con importancias
        feature_columns: Lista de features
    """
    print("[ML] Saving model...")

    # Guardar modelo scikit-learn
    model_path = os.path.join(MODEL_DIR, 'student_success_model.pkl')
    joblib.dump(model, model_path)
    print(f"[ML] Model saved: {model_path}")

    # Guardar scaler
    scaler_path = os.path.join(MODEL_DIR, 'student_success_scaler.pkl')
    joblib.dump(scaler, scaler_path)
    print(f"[ML] Scaler saved: {scaler_path}")

    # Guardar metadata
    metadata = {
        'model_type': 'RandomForestClassifier',
        'version': '1.0.0',
        'trained_at': datetime.now().isoformat(),
        'features': feature_columns,
        'metrics': {k: float(v) for k, v in metrics.items()},
        'feature_importance': feature_importance.to_dict('records'),
        'thresholds': {
            'high_risk': 0.7,
            'medium_risk': 0.4,
            'low_risk': 0.0
        }
    }

    metadata_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"[ML] Metadata saved: {metadata_path}")

def convert_to_tfjs(model, scaler, feature_columns):
    """
    Convierte modelo scikit-learn a TensorFlow.js

    NOTA: TensorFlow.js no soporta Random Forest directamente.
    Alternativa: Entrenar Neural Network equivalente o usar backend API.

    Por ahora, exportamos los pesos del Random Forest para uso en backend.
    """
    print("[ML] Converting to TensorFlow.js...")

    # Para Random Forest, exportamos los parámetros para predicción en backend
    # El frontend llamará a API /api/ml/predict en lugar de ejecutar modelo localmente

    # Guardamos feature names y scaler params para frontend
    tfjs_metadata = {
        'model_type': 'RandomForestClassifier',
        'backend_endpoint': '/api/ml/predict',
        'features': feature_columns,
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        'usage': 'Call backend API with student features for prediction'
    }

    tfjs_metadata_path = os.path.join(TFJS_MODEL_DIR, 'model.json')
    with open(tfjs_metadata_path, 'w') as f:
        json.dump(tfjs_metadata, f, indent=2)

    print(f"[ML] TensorFlow.js metadata saved: {tfjs_metadata_path}")
    print("[ML] Note: Frontend will use backend API for predictions")

# =============================================================================
# PREDICTION API
# =============================================================================

def predict_dropout_risk(student_features):
    """
    Predice riesgo de deserción para un estudiante

    Args:
        student_features (dict): Features del estudiante

    Returns:
        dict: Predicción con probabilidad y categoría de riesgo
    """
    # Cargar modelo y scaler
    model_path = os.path.join(MODEL_DIR, 'student_success_model.pkl')
    scaler_path = os.path.join(MODEL_DIR, 'student_success_scaler.pkl')

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # Preparar features
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

    features_array = np.array([[student_features.get(f, 0) for f in feature_columns]])
    features_scaled = scaler.transform(features_array)

    # Predicción
    dropout_probability = model.predict_proba(features_scaled)[0][1]

    # Categoría de riesgo
    if dropout_probability >= 0.7:
        risk_category = 'high'
        risk_label = 'Alto Riesgo'
    elif dropout_probability >= 0.4:
        risk_category = 'medium'
        risk_label = 'Riesgo Medio'
    else:
        risk_category = 'low'
        risk_label = 'Bajo Riesgo'

    return {
        'dropout_probability': float(dropout_probability),
        'success_probability': float(1 - dropout_probability),
        'risk_category': risk_category,
        'risk_label': risk_label,
        'recommendation': get_recommendation(risk_category, student_features)
    }

def get_recommendation(risk_category, student_features):
    """
    Genera recomendación personalizada basada en riesgo

    Args:
        risk_category (str): 'high', 'medium', 'low'
        student_features (dict): Features del estudiante

    Returns:
        str: Recomendación en español
    """
    if risk_category == 'high':
        recommendations = []

        if student_features.get('attendance_rate', 100) < 70:
            recommendations.append("Mejorar asistencia (actualmente <70%)")

        if student_features.get('avg_grade', 10) < 6:
            recommendations.append("Reforzar aprendizaje (promedio <6.0)")

        if student_features.get('engagement_score', 100) < 30:
            recommendations.append("Aumentar participación en plataforma")

        if not recommendations:
            recommendations.append("Contactar con tutor académico para evaluación personalizada")

        return " | ".join(recommendations)

    elif risk_category == 'medium':
        return "Monitorear desempeño académico regularmente | Considerar tutoría preventiva"

    else:
        return "Continuar con buen desempeño | Explorar oportunidades de liderazgo estudiantil"

# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("🤖 STUDENT SUCCESS PREDICTION MODEL - TRAINING")
    print("=" * 80)

    # Paso 1: Extraer datos
    df = extract_student_data()

    # Paso 2: Feature engineering
    df = engineer_features(df)

    # Paso 3: Entrenar modelo
    model, scaler, metrics, feature_importance, feature_columns = train_model(df)

    # Paso 4: Guardar modelo
    save_model(model, scaler, metrics, feature_importance, feature_columns)

    # Paso 5: Convertir a TensorFlow.js
    convert_to_tfjs(model, scaler, feature_columns)

    print("\n" + "=" * 80)
    print("✅ MODEL TRAINING COMPLETE")
    print("=" * 80)
    print(f"Accuracy: {metrics['accuracy']:.2%} (Target: >85%)")
    print(f"Model saved: {MODEL_DIR}")
    print(f"TensorFlow.js metadata: {TFJS_MODEL_DIR}")
    print("=" * 80)

    # Ejemplo de predicción
    print("\n[ML] Testing prediction with sample data...")
    sample_student = {
        'attendance_rate': 75.0,
        'avg_grade': 7.5,
        'min_grade': 6.0,
        'max_grade': 9.0,
        'grade_stddev': 1.2,
        'login_count': 50,
        'assignments_submitted': 30,
        'age': 17,
        'engagement_score': 60.0,
        'grade_consistency': 70.0,
        'preliminary_risk': 40.0,
        'gender_male': 1,
        'gender_female': 0
    }

    prediction = predict_dropout_risk(sample_student)
    print(f"\nSample Prediction:")
    print(f"  Dropout Risk: {prediction['dropout_probability']:.2%}")
    print(f"  Success Probability: {prediction['success_probability']:.2%}")
    print(f"  Risk Category: {prediction['risk_label']}")
    print(f"  Recommendation: {prediction['recommendation']}")
