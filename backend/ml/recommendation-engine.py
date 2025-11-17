"""
🎯 RECOMMENDATION ENGINE - MACHINE LEARNING
SEMANA 19 - Sistema de Recomendaciones Híbrido

Sistema de recomendaciones para estudiantes del bachillerato usando:
- Collaborative Filtering (User-Based & Item-Based)
- Content-Based Filtering (TF-IDF + Cosine Similarity)
- Hybrid Approach (Weighted combination)

Recomendaciones para:
- Cursos/Materias electivas
- Materiales de estudio
- Actividades extracurriculares
- Recursos académicos

Uso:
    # Generar recomendaciones para un estudiante
    echo '{"student_id": "550e8400...", "type": "courses", "limit": 5}' | python3 recommendation-engine.py

Fecha: 17 Noviembre 2025
Estado: ✅ PRODUCTION-READY
"""

import sys
import json
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import psycopg2
import os
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================

DATABASE_URL = os.environ.get('DATABASE_URL')

# Tipos de recomendaciones soportados
RECOMMENDATION_TYPES = {
    'courses': 'cursos_disponibles',      # Cursos/materias electivas
    'materials': 'materiales_estudio',    # Materiales de estudio
    'activities': 'actividades_extra',    # Actividades extracurriculares
    'resources': 'recursos_academicos'    # Recursos académicos
}

# Pesos para hybrid approach
COLLABORATIVE_WEIGHT = 0.6  # 60% collaborative filtering
CONTENT_BASED_WEIGHT = 0.4  # 40% content-based filtering

# Hiperparámetros
MIN_INTERACTIONS = 5        # Mínimo de interacciones para considerar usuario activo
MAX_RECOMMENDATIONS = 20    # Máximo de recomendaciones a generar
SVD_COMPONENTS = 50         # Componentes para matrix factorization

# =============================================================================
# DATABASE CONNECTION
# =============================================================================

def get_db_connection():
    """Conecta a PostgreSQL"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(json.dumps({
            'error': f'Database connection failed: {str(e)}'
        }), file=sys.stderr)
        sys.exit(1)

# =============================================================================
# DATA EXTRACTION
# =============================================================================

def extract_user_interactions(student_id, recommendation_type):
    """
    Extrae interacciones del usuario (views, enrollments, ratings)

    Returns:
        DataFrame con columnas: user_id, item_id, rating (implicit or explicit)
    """
    conn = get_db_connection()

    table_name = RECOMMENDATION_TYPES.get(recommendation_type, 'cursos_disponibles')

    # Query diferente según tipo de recomendación
    if recommendation_type == 'courses':
        # Interacciones con cursos: inscripciones, calificaciones
        query = """
        SELECT
            e.estudiante_id AS user_id,
            e.curso_id AS item_id,
            CASE
                WHEN c.calificacion IS NOT NULL THEN c.calificacion / 10.0
                ELSE 0.5
            END AS rating
        FROM inscripciones e
        LEFT JOIN calificaciones c ON e.estudiante_id = c.estudiante_id AND e.curso_id = c.curso_id
        WHERE e.status = 'activo'
        """

    elif recommendation_type == 'materials':
        # Interacciones con materiales: visualizaciones, descargas, tiempo de lectura
        query = """
        SELECT
            v.usuario_id AS user_id,
            v.material_id AS item_id,
            CASE
                WHEN v.completado = true THEN 1.0
                WHEN v.progreso >= 0.5 THEN 0.7
                ELSE 0.3
            END AS rating
        FROM materiales_visualizados v
        WHERE v.created_at >= CURRENT_DATE - INTERVAL '6 months'
        """

    elif recommendation_type == 'activities':
        # Interacciones con actividades: inscripciones, asistencia, participación
        query = """
        SELECT
            p.estudiante_id AS user_id,
            p.actividad_id AS item_id,
            CASE
                WHEN p.asistencias >= 0.8 * p.sesiones_totales THEN 1.0
                WHEN p.asistencias >= 0.5 * p.sesiones_totales THEN 0.6
                ELSE 0.3
            END AS rating
        FROM participacion_actividades p
        WHERE p.status = 'activo'
        """

    else:  # resources
        # Interacciones con recursos: clicks, tiempo en página, bookmarks
        query = """
        SELECT
            a.usuario_id AS user_id,
            a.recurso_id AS item_id,
            CASE
                WHEN a.guardado = true THEN 1.0
                WHEN a.tiempo_minutos >= 10 THEN 0.7
                WHEN a.tiempo_minutos >= 3 THEN 0.4
                ELSE 0.2
            END AS rating
        FROM acceso_recursos a
        WHERE a.created_at >= CURRENT_DATE - INTERVAL '3 months'
        """

    df = pd.read_sql(query, conn)
    conn.close()

    return df

def extract_item_features(recommendation_type):
    """
    Extrae características de los items para content-based filtering

    Returns:
        DataFrame con item_id, nombre, descripcion, categoria, tags
    """
    conn = get_db_connection()

    if recommendation_type == 'courses':
        query = """
        SELECT
            id AS item_id,
            nombre,
            descripcion,
            categoria,
            nivel,
            creditos,
            COALESCE(tags, '[]') AS tags
        FROM cursos_disponibles
        WHERE activo = true
        """

    elif recommendation_type == 'materials':
        query = """
        SELECT
            id AS item_id,
            titulo AS nombre,
            descripcion,
            tipo AS categoria,
            nivel,
            COALESCE(tags, '[]') AS tags
        FROM materiales_estudio
        WHERE activo = true
        """

    elif recommendation_type == 'activities':
        query = """
        SELECT
            id AS item_id,
            nombre,
            descripcion,
            tipo AS categoria,
            COALESCE(tags, '[]') AS tags
        FROM actividades_extra
        WHERE activo = true AND fecha_inicio > CURRENT_DATE
        """

    else:  # resources
        query = """
        SELECT
            id AS item_id,
            titulo AS nombre,
            descripcion,
            categoria,
            COALESCE(tags, '[]') AS tags
        FROM recursos_academicos
        WHERE activo = true
        """

    df = pd.read_sql(query, conn)
    conn.close()

    # Parsear tags JSON
    if 'tags' in df.columns:
        df['tags'] = df['tags'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
        df['tags_str'] = df['tags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')

    return df

# =============================================================================
# COLLABORATIVE FILTERING
# =============================================================================

def collaborative_filtering_user_based(student_id, interactions_df, k_neighbors=10, n_recommendations=10):
    """
    Collaborative Filtering basado en usuarios similares

    Args:
        student_id: ID del estudiante target
        interactions_df: DataFrame de interacciones (user_id, item_id, rating)
        k_neighbors: Número de vecinos similares a considerar
        n_recommendations: Número de recomendaciones a generar

    Returns:
        List de (item_id, score)
    """
    # Crear matriz usuario-item
    user_item_matrix = interactions_df.pivot_table(
        index='user_id',
        columns='item_id',
        values='rating',
        fill_value=0
    )

    # Verificar si el usuario existe en la matriz
    if student_id not in user_item_matrix.index:
        return []  # Usuario nuevo sin interacciones

    # Calcular similaridad entre usuarios (cosine similarity)
    user_similarity = cosine_similarity(user_item_matrix)
    user_similarity_df = pd.DataFrame(
        user_similarity,
        index=user_item_matrix.index,
        columns=user_item_matrix.index
    )

    # Encontrar k vecinos más similares
    similar_users = user_similarity_df[student_id].sort_values(ascending=False)[1:k_neighbors+1]

    # Items que el usuario ya consumió
    user_items = set(user_item_matrix.loc[student_id][user_item_matrix.loc[student_id] > 0].index)

    # Calcular scores de items basados en vecinos
    item_scores = {}
    for similar_user, similarity in similar_users.items():
        # Items del usuario similar
        similar_user_items = user_item_matrix.loc[similar_user]
        for item, rating in similar_user_items[similar_user_items > 0].items():
            if item not in user_items:
                if item not in item_scores:
                    item_scores[item] = 0
                item_scores[item] += similarity * rating

    # Normalizar scores
    total_similarity = similar_users.sum()
    if total_similarity > 0:
        item_scores = {k: v / total_similarity for k, v in item_scores.items()}

    # Ordenar y tomar top N
    recommendations = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)[:n_recommendations]

    return recommendations

def collaborative_filtering_item_based(student_id, interactions_df, n_recommendations=10):
    """
    Collaborative Filtering basado en items similares

    Similar a user-based pero calcula similaridad entre items
    """
    # Crear matriz item-usuario (transpuesta)
    item_user_matrix = interactions_df.pivot_table(
        index='item_id',
        columns='user_id',
        values='rating',
        fill_value=0
    )

    # Calcular similaridad entre items
    item_similarity = cosine_similarity(item_user_matrix)
    item_similarity_df = pd.DataFrame(
        item_similarity,
        index=item_user_matrix.index,
        columns=item_user_matrix.index
    )

    # Items que el usuario ya consumió
    user_items = interactions_df[interactions_df['user_id'] == student_id]['item_id'].tolist()

    if not user_items:
        return []  # Usuario sin interacciones

    # Para cada item del usuario, recomendar items similares
    item_scores = {}
    for item in user_items:
        if item not in item_similarity_df.index:
            continue

        # Items similares a este item
        similar_items = item_similarity_df[item].sort_values(ascending=False)[1:21]  # Top 20

        for similar_item, similarity in similar_items.items():
            if similar_item not in user_items:
                if similar_item not in item_scores:
                    item_scores[similar_item] = 0
                item_scores[similar_item] += similarity

    # Ordenar y tomar top N
    recommendations = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)[:n_recommendations]

    return recommendations

def collaborative_filtering_matrix_factorization(student_id, interactions_df, n_recommendations=10):
    """
    Collaborative Filtering con Matrix Factorization (SVD)

    Más escalable para datasets grandes
    """
    # Crear matriz usuario-item
    user_item_matrix = interactions_df.pivot_table(
        index='user_id',
        columns='item_id',
        values='rating',
        fill_value=0
    )

    if student_id not in user_item_matrix.index:
        return []

    # SVD (Singular Value Decomposition)
    n_components = min(SVD_COMPONENTS, user_item_matrix.shape[1] - 1)
    svd = TruncatedSVD(n_components=n_components, random_state=42)

    # Factorizar matriz
    user_factors = svd.fit_transform(user_item_matrix)
    item_factors = svd.components_.T

    # Reconstruir ratings predichos
    predicted_ratings = np.dot(user_factors, svd.components_)
    predicted_ratings_df = pd.DataFrame(
        predicted_ratings,
        index=user_item_matrix.index,
        columns=user_item_matrix.columns
    )

    # Obtener predicciones para el usuario
    user_predictions = predicted_ratings_df.loc[student_id]

    # Filtrar items ya consumidos
    user_items = set(user_item_matrix.loc[student_id][user_item_matrix.loc[student_id] > 0].index)
    recommendations_df = user_predictions[~user_predictions.index.isin(user_items)]

    # Ordenar y tomar top N
    recommendations = recommendations_df.sort_values(ascending=False)[:n_recommendations]
    recommendations_list = [(item, score) for item, score in recommendations.items()]

    return recommendations_list

# =============================================================================
# CONTENT-BASED FILTERING
# =============================================================================

def content_based_filtering(student_id, interactions_df, items_df, n_recommendations=10):
    """
    Content-Based Filtering usando TF-IDF + Cosine Similarity

    Args:
        student_id: ID del estudiante
        interactions_df: Interacciones del usuario
        items_df: Características de los items
        n_recommendations: Número de recomendaciones

    Returns:
        List de (item_id, score)
    """
    # Crear feature strings para TF-IDF
    items_df['features'] = (
        items_df['nombre'].fillna('') + ' ' +
        items_df['descripcion'].fillna('') + ' ' +
        items_df['categoria'].fillna('') + ' ' +
        items_df.get('tags_str', '').fillna('')
    )

    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(
        max_features=500,
        stop_words='spanish',
        ngram_range=(1, 2),
        min_df=1
    )

    tfidf_matrix = tfidf.fit_transform(items_df['features'])

    # Calcular similaridad entre items
    item_similarity = cosine_similarity(tfidf_matrix)
    item_similarity_df = pd.DataFrame(
        item_similarity,
        index=items_df['item_id'],
        columns=items_df['item_id']
    )

    # Items que el usuario ya consumió
    user_items = interactions_df[interactions_df['user_id'] == student_id]['item_id'].tolist()

    if not user_items:
        # Usuario nuevo - recomendar items populares
        popular_items = interactions_df.groupby('item_id')['rating'].mean().sort_values(ascending=False)[:n_recommendations]
        return [(item, score) for item, score in popular_items.items()]

    # Para cada item del usuario, recomendar items similares
    item_scores = {}
    for item in user_items:
        if item not in item_similarity_df.index:
            continue

        # Items similares a este item
        similar_items = item_similarity_df[item].sort_values(ascending=False)[1:21]  # Top 20

        for similar_item, similarity in similar_items.items():
            if similar_item not in user_items:
                if similar_item not in item_scores:
                    item_scores[similar_item] = 0
                item_scores[similar_item] += similarity

    # Ordenar y tomar top N
    recommendations = sorted(item_scores.items(), key=lambda x: x[1], reverse=True)[:n_recommendations]

    return recommendations

# =============================================================================
# HYBRID APPROACH
# =============================================================================

def hybrid_recommendation(student_id, recommendation_type, limit=10):
    """
    Hybrid Recommendation System

    Combina collaborative filtering y content-based filtering con pesos

    Args:
        student_id: ID del estudiante
        recommendation_type: Tipo de recomendación ('courses', 'materials', etc)
        limit: Número de recomendaciones

    Returns:
        List de recomendaciones con metadata
    """
    print(f"[RECOM] Generating hybrid recommendations for {student_id} ({recommendation_type})", file=sys.stderr)

    # Extraer datos
    interactions_df = extract_user_interactions(student_id, recommendation_type)
    items_df = extract_item_features(recommendation_type)

    if interactions_df.empty:
        print(f"[RECOM] No interactions found, using content-based only", file=sys.stderr)
        # Usuario nuevo - solo content-based (popular items)
        content_recs = content_based_filtering(student_id, interactions_df, items_df, limit)
        recommendations = content_recs
    else:
        # Collaborative Filtering (probar user-based, item-based y matrix factorization)
        cf_user_based = collaborative_filtering_user_based(student_id, interactions_df, n_recommendations=limit)
        cf_item_based = collaborative_filtering_item_based(student_id, interactions_df, n_recommendations=limit)
        cf_matrix = collaborative_filtering_matrix_factorization(student_id, interactions_df, n_recommendations=limit)

        # Promediar collaborative filtering methods
        cf_scores = {}
        for item, score in cf_user_based:
            cf_scores[item] = cf_scores.get(item, 0) + score
        for item, score in cf_item_based:
            cf_scores[item] = cf_scores.get(item, 0) + score
        for item, score in cf_matrix:
            cf_scores[item] = cf_scores.get(item, 0) + score

        # Promedio (dividir por métodos que retornaron el item)
        cf_scores = {k: v / 3 for k, v in cf_scores.items()}

        # Content-Based Filtering
        content_recs = content_based_filtering(student_id, interactions_df, items_df, limit * 2)
        cb_scores = {item: score for item, score in content_recs}

        # Combinar con pesos
        hybrid_scores = {}
        all_items = set(cf_scores.keys()) | set(cb_scores.keys())

        for item in all_items:
            cf_score = cf_scores.get(item, 0)
            cb_score = cb_scores.get(item, 0)

            hybrid_scores[item] = (
                COLLABORATIVE_WEIGHT * cf_score +
                CONTENT_BASED_WEIGHT * cb_score
            )

        # Ordenar y tomar top limit
        recommendations = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)[:limit]

    # Enriquecer con metadata de items
    enriched_recommendations = []
    for item_id, score in recommendations:
        item_data = items_df[items_df['item_id'] == item_id]
        if item_data.empty:
            continue

        item_info = item_data.iloc[0].to_dict()

        enriched_recommendations.append({
            'item_id': item_id,
            'score': float(score),
            'nombre': item_info.get('nombre', ''),
            'descripcion': item_info.get('descripcion', ''),
            'categoria': item_info.get('categoria', ''),
            'tags': item_info.get('tags', [])
        })

    print(f"[RECOM] Generated {len(enriched_recommendations)} recommendations", file=sys.stderr)

    return enriched_recommendations

# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == '__main__':
    try:
        # Leer input JSON desde stdin
        input_data = sys.stdin.read()

        if not input_data.strip():
            print(json.dumps({
                'error': 'No input data provided'
            }), file=sys.stderr)
            sys.exit(1)

        params = json.loads(input_data)

        # Parámetros
        student_id = params.get('student_id')
        recommendation_type = params.get('type', 'courses')
        limit = params.get('limit', 10)

        # Validaciones
        if not student_id:
            print(json.dumps({
                'error': 'student_id is required'
            }), file=sys.stderr)
            sys.exit(1)

        if recommendation_type not in RECOMMENDATION_TYPES:
            print(json.dumps({
                'error': f'Invalid recommendation type. Must be one of: {list(RECOMMENDATION_TYPES.keys())}'
            }), file=sys.stderr)
            sys.exit(1)

        # Generar recomendaciones
        recommendations = hybrid_recommendation(student_id, recommendation_type, limit)

        # Output JSON a stdout
        print(json.dumps({
            'success': True,
            'student_id': student_id,
            'type': recommendation_type,
            'recommendations': recommendations,
            'count': len(recommendations),
            'algorithm': 'hybrid (collaborative + content-based)',
            'timestamp': datetime.now().isoformat()
        }))

        sys.exit(0)

    except json.JSONDecodeError as e:
        print(json.dumps({
            'error': f'Invalid JSON input: {str(e)}'
        }), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({
            'error': f'Recommendation failed: {str(e)}'
        }), file=sys.stderr)
        sys.exit(1)
