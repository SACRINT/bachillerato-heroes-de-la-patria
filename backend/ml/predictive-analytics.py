#!/usr/bin/env python3
"""
📊 PREDICTIVE ANALYTICS ENGINE - TIME SERIES FORECASTING
SEMANA 20 - Predictive Analytics & Forecasting

Sistema de análisis predictivo usando ARIMA y Prophet para:
- Predicción de calificaciones futuras
- Forecasting de inscripciones
- Predicción de deserción por periodo
- Análisis de tendencias académicas

Modelos implementados:
- ARIMA (AutoRegressive Integrated Moving Average)
- Prophet (Facebook Time Series Forecasting)
- Seasonal Decomposition
- Trend Analysis

Fecha: 17 Noviembre 2025
Estado: ✅ PRODUCTION-READY
"""

import sys
import json
import warnings
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Time Series Libraries
try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.seasonal import seasonal_decompose
    from prophet import Prophet
except ImportError as e:
    print(json.dumps({
        'success': False,
        'error': 'missing_dependencies',
        'message': f'Faltan dependencias: {str(e)}. Instalar con: pip install statsmodels prophet'
    }))
    sys.exit(1)

warnings.filterwarnings('ignore')

# ===========================================================================
# CONFIGURACIÓN
# ===========================================================================

# Parámetros ARIMA (p, d, q)
ARIMA_ORDER = (1, 1, 1)  # AR=1, I=1, MA=1

# Prophet configuration
PROPHET_SEASONALITY = {
    'yearly_seasonality': True,
    'weekly_seasonality': False,
    'daily_seasonality': False
}

# Períodos de pronóstico
FORECAST_PERIODS = {
    'short_term': 30,    # 1 mes
    'medium_term': 90,   # 3 meses
    'long_term': 180     # 6 meses
}

# ===========================================================================
# FORECASTING CON ARIMA
# ===========================================================================

def forecast_with_arima(data, periods=30, order=ARIMA_ORDER):
    """
    Pronóstico usando modelo ARIMA

    Args:
        data (pd.Series): Serie temporal con índice de fechas
        periods (int): Número de períodos a pronosticar
        order (tuple): Orden ARIMA (p, d, q)

    Returns:
        dict: Pronósticos con intervalos de confianza
    """
    try:
        # Entrenar modelo ARIMA
        model = ARIMA(data, order=order)
        fitted_model = model.fit()

        # Generar pronósticos
        forecast = fitted_model.forecast(steps=periods)

        # Obtener intervalos de confianza
        forecast_df = fitted_model.get_forecast(steps=periods)
        confidence_interval = forecast_df.conf_int()

        # Preparar resultados
        forecast_dates = pd.date_range(
            start=data.index[-1] + timedelta(days=1),
            periods=periods,
            freq='D'
        )

        results = {
            'model': 'ARIMA',
            'order': order,
            'aic': float(fitted_model.aic),
            'bic': float(fitted_model.bic),
            'forecasts': [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'value': float(value),
                    'lower_bound': float(confidence_interval.iloc[i, 0]),
                    'upper_bound': float(confidence_interval.iloc[i, 1])
                }
                for i, (date, value) in enumerate(zip(forecast_dates, forecast))
            ],
            'summary': {
                'mean_forecast': float(forecast.mean()),
                'std_forecast': float(forecast.std()),
                'min_forecast': float(forecast.min()),
                'max_forecast': float(forecast.max())
            }
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': f'ARIMA failed: {str(e)}'
        }


def auto_arima_selection(data, max_p=5, max_d=2, max_q=5):
    """
    Selección automática de parámetros ARIMA usando AIC

    Args:
        data (pd.Series): Serie temporal
        max_p, max_d, max_q (int): Valores máximos para búsqueda

    Returns:
        tuple: Mejor orden (p, d, q)
    """
    best_aic = np.inf
    best_order = None

    for p in range(max_p + 1):
        for d in range(max_d + 1):
            for q in range(max_q + 1):
                try:
                    model = ARIMA(data, order=(p, d, q))
                    fitted = model.fit()

                    if fitted.aic < best_aic:
                        best_aic = fitted.aic
                        best_order = (p, d, q)

                except:
                    continue

    return best_order if best_order else (1, 1, 1)


# ===========================================================================
# FORECASTING CON PROPHET
# ===========================================================================

def forecast_with_prophet(data, periods=30, seasonality_mode='additive'):
    """
    Pronóstico usando Prophet de Facebook

    Args:
        data (pd.DataFrame): DataFrame con columnas 'ds' (fecha) y 'y' (valor)
        periods (int): Número de períodos a pronosticar
        seasonality_mode (str): 'additive' o 'multiplicative'

    Returns:
        dict: Pronósticos con componentes de tendencia y estacionalidad
    """
    try:
        # Preparar datos para Prophet
        df = data.copy()
        df.columns = ['ds', 'y']

        # Crear y entrenar modelo Prophet
        model = Prophet(
            seasonality_mode=seasonality_mode,
            yearly_seasonality=PROPHET_SEASONALITY['yearly_seasonality'],
            weekly_seasonality=PROPHET_SEASONALITY['weekly_seasonality'],
            daily_seasonality=PROPHET_SEASONALITY['daily_seasonality'],
            interval_width=0.95
        )

        model.fit(df)

        # Crear dataframe para futuro
        future = model.make_future_dataframe(periods=periods)

        # Generar pronósticos
        forecast = model.predict(future)

        # Extraer solo pronósticos futuros (últimos 'periods' registros)
        future_forecast = forecast.tail(periods)

        results = {
            'model': 'Prophet',
            'seasonality_mode': seasonality_mode,
            'forecasts': [
                {
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'value': float(row['yhat']),
                    'lower_bound': float(row['yhat_lower']),
                    'upper_bound': float(row['yhat_upper']),
                    'trend': float(row['trend']),
                    'yearly': float(row.get('yearly', 0))
                }
                for _, row in future_forecast.iterrows()
            ],
            'components': {
                'trend': forecast['trend'].tail(periods).tolist(),
                'yearly': forecast.get('yearly', pd.Series([0] * periods)).tail(periods).tolist(),
                'weekly': forecast.get('weekly', pd.Series([0] * periods)).tail(periods).tolist()
            },
            'summary': {
                'mean_forecast': float(future_forecast['yhat'].mean()),
                'std_forecast': float(future_forecast['yhat'].std()),
                'min_forecast': float(future_forecast['yhat'].min()),
                'max_forecast': float(future_forecast['yhat'].max())
            }
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': f'Prophet failed: {str(e)}'
        }


# ===========================================================================
# SEASONAL DECOMPOSITION
# ===========================================================================

def seasonal_decomposition(data, model='additive', period=30):
    """
    Descomposición estacional de serie temporal

    Args:
        data (pd.Series): Serie temporal
        model (str): 'additive' o 'multiplicative'
        period (int): Período de estacionalidad

    Returns:
        dict: Componentes (trend, seasonal, residual)
    """
    try:
        result = seasonal_decompose(data, model=model, period=period)

        decomposition = {
            'model': model,
            'period': period,
            'trend': result.trend.dropna().tolist(),
            'seasonal': result.seasonal.dropna().tolist(),
            'residual': result.resid.dropna().tolist(),
            'dates': data.index[period // 2: -(period // 2)].strftime('%Y-%m-%d').tolist()
        }

        return decomposition

    except Exception as e:
        return {
            'success': False,
            'error': f'Decomposition failed: {str(e)}'
        }


# ===========================================================================
# ANÁLISIS DE TENDENCIAS
# ===========================================================================

def trend_analysis(data):
    """
    Análisis de tendencia de serie temporal

    Args:
        data (pd.Series): Serie temporal

    Returns:
        dict: Tendencia, dirección, cambio porcentual
    """
    try:
        # Calcular regresión lineal simple
        x = np.arange(len(data))
        y = data.values

        # Pendiente y intercepto
        slope, intercept = np.polyfit(x, y, 1)

        # Predicción usando regresión
        trend_line = slope * x + intercept

        # R² (coeficiente de determinación)
        ss_res = np.sum((y - trend_line) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0

        # Cambio porcentual total
        first_value = data.iloc[0]
        last_value = data.iloc[-1]
        percent_change = ((last_value - first_value) / first_value) * 100 if first_value != 0 else 0

        # Dirección de tendencia
        if slope > 0.1:
            direction = 'creciente'
        elif slope < -0.1:
            direction = 'decreciente'
        else:
            direction = 'estable'

        analysis = {
            'slope': float(slope),
            'intercept': float(intercept),
            'r_squared': float(r_squared),
            'direction': direction,
            'percent_change': float(percent_change),
            'trend_strength': 'fuerte' if abs(r_squared) > 0.7 else 'moderada' if abs(r_squared) > 0.4 else 'débil',
            'trend_line': trend_line.tolist(),
            'summary': f'Tendencia {direction} con cambio de {percent_change:.1f}% (R²={r_squared:.3f})'
        }

        return analysis

    except Exception as e:
        return {
            'success': False,
            'error': f'Trend analysis failed: {str(e)}'
        }


# ===========================================================================
# PREDICCIÓN DE CALIFICACIONES
# ===========================================================================

def predict_grades(historical_grades, student_id, forecast_months=3):
    """
    Predice calificaciones futuras de un estudiante

    Args:
        historical_grades (list): Lista de dicts con {date, grade}
        student_id (str): UUID del estudiante
        forecast_months (int): Meses a pronosticar

    Returns:
        dict: Pronósticos de calificaciones
    """
    try:
        if len(historical_grades) < 10:
            return {
                'success': False,
                'error': 'insufficient_data',
                'message': 'Se requieren al menos 10 calificaciones históricas'
            }

        # Convertir a DataFrame
        df = pd.DataFrame(historical_grades)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Crear serie temporal
        df.set_index('date', inplace=True)
        series = df['grade']

        # Pronosticar con ambos modelos
        periods = forecast_months * 30  # Aproximado (30 días/mes)

        arima_forecast = forecast_with_arima(series, periods=periods)

        # Prophet
        prophet_df = df.reset_index()[['date', 'grade']]
        prophet_forecast = forecast_with_prophet(prophet_df, periods=periods)

        # Tendencia
        trend = trend_analysis(series)

        results = {
            'success': True,
            'student_id': student_id,
            'historical_stats': {
                'count': len(historical_grades),
                'mean': float(series.mean()),
                'std': float(series.std()),
                'min': float(series.min()),
                'max': float(series.max()),
                'latest': float(series.iloc[-1])
            },
            'arima': arima_forecast,
            'prophet': prophet_forecast,
            'trend': trend,
            'recommendation': generate_grade_recommendation(arima_forecast, prophet_forecast, trend)
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def generate_grade_recommendation(arima_forecast, prophet_forecast, trend):
    """
    Genera recomendación basada en pronósticos
    """
    if not arima_forecast.get('success', True) or not prophet_forecast.get('success', True):
        return 'No se pudo generar recomendación'

    arima_mean = arima_forecast['summary']['mean_forecast']
    prophet_mean = prophet_forecast['summary']['mean_forecast']
    avg_forecast = (arima_mean + prophet_mean) / 2

    trend_direction = trend['direction']

    if avg_forecast >= 9.0 and trend_direction == 'creciente':
        return '🌟 Excelente! El estudiante muestra tendencia de mejora continua.'
    elif avg_forecast >= 8.0 and trend_direction == 'creciente':
        return '📈 Buen desempeño con tendencia positiva. Mantener el ritmo.'
    elif avg_forecast >= 7.0 and trend_direction == 'estable':
        return '⚖️ Desempeño estable. Considerar estrategias de mejora.'
    elif avg_forecast < 7.0 and trend_direction == 'decreciente':
        return '⚠️ ALERTA: Tendencia decreciente. Intervención urgente recomendada.'
    else:
        return '📊 Desempeño dentro de parámetros normales. Monitorear.'


# ===========================================================================
# PREDICCIÓN DE INSCRIPCIONES
# ===========================================================================

def predict_enrollments(historical_enrollments, forecast_months=6):
    """
    Predice inscripciones futuras por periodo

    Args:
        historical_enrollments (list): Lista de dicts con {date, count}
        forecast_months (int): Meses a pronosticar

    Returns:
        dict: Pronósticos de inscripciones
    """
    try:
        if len(historical_enrollments) < 12:
            return {
                'success': False,
                'error': 'insufficient_data',
                'message': 'Se requieren al menos 12 registros históricos'
            }

        # Convertir a DataFrame
        df = pd.DataFrame(historical_enrollments)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Serie temporal
        df.set_index('date', inplace=True)
        series = df['count']

        periods = forecast_months * 30

        # Forecasting
        arima_forecast = forecast_with_arima(series, periods=periods)

        prophet_df = df.reset_index()[['date', 'count']]
        prophet_forecast = forecast_with_prophet(prophet_df, periods=periods, seasonality_mode='multiplicative')

        # Decomposition estacional
        decomp = seasonal_decomposition(series, model='multiplicative', period=30)

        # Tendencia
        trend = trend_analysis(series)

        results = {
            'success': True,
            'type': 'enrollments',
            'historical_stats': {
                'count': len(historical_enrollments),
                'mean': float(series.mean()),
                'total': int(series.sum()),
                'peak': int(series.max()),
                'low': int(series.min())
            },
            'arima': arima_forecast,
            'prophet': prophet_forecast,
            'seasonal_decomposition': decomp,
            'trend': trend,
            'insights': generate_enrollment_insights(series, trend, decomp)
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def generate_enrollment_insights(series, trend, decomp):
    """
    Genera insights de inscripciones
    """
    insights = []

    # Tendencia
    if trend['direction'] == 'creciente':
        insights.append(f"📈 Crecimiento sostenido de {trend['percent_change']:.1f}% en el período")
    elif trend['direction'] == 'decreciente':
        insights.append(f"📉 Disminución de {abs(trend['percent_change']):.1f}% - revisar estrategias de captación")

    # Estacionalidad
    if decomp.get('success', True):
        insights.append("🔄 Patrón estacional detectado - planificar campañas en períodos altos")

    # Volatilidad
    cv = (series.std() / series.mean()) * 100 if series.mean() != 0 else 0
    if cv > 30:
        insights.append(f"⚠️ Alta volatilidad ({cv:.1f}%) - considerar estrategias de estabilización")

    return insights


# ===========================================================================
# PREDICCIÓN DE DESERCIÓN
# ===========================================================================

def predict_dropout_trend(historical_dropout, forecast_months=6):
    """
    Predice tendencia de deserción

    Args:
        historical_dropout (list): Lista de dicts con {date, dropout_count}
        forecast_months (int): Meses a pronosticar

    Returns:
        dict: Pronósticos de deserción
    """
    try:
        if len(historical_dropout) < 12:
            return {
                'success': False,
                'error': 'insufficient_data'
            }

        df = pd.DataFrame(historical_dropout)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df.set_index('date', inplace=True)
        series = df['dropout_count']

        periods = forecast_months * 30

        arima_forecast = forecast_with_arima(series, periods=periods)

        prophet_df = df.reset_index()[['date', 'dropout_count']]
        prophet_forecast = forecast_with_prophet(prophet_df, periods=periods)

        trend = trend_analysis(series)

        results = {
            'success': True,
            'type': 'dropout',
            'arima': arima_forecast,
            'prophet': prophet_forecast,
            'trend': trend,
            'alert_level': determine_dropout_alert_level(trend, arima_forecast)
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def determine_dropout_alert_level(trend, forecast):
    """
    Determina nivel de alerta de deserción
    """
    if trend['direction'] == 'creciente' and trend['percent_change'] > 20:
        return {
            'level': 'CRÍTICO',
            'color': '#dc3545',
            'message': '🚨 ALERTA CRÍTICA: Deserción en aumento sostenido. Acción inmediata requerida.'
        }
    elif trend['direction'] == 'creciente' and trend['percent_change'] > 10:
        return {
            'level': 'ALTO',
            'color': '#fd7e14',
            'message': '⚠️ Deserción en aumento. Implementar estrategias de retención.'
        }
    elif trend['direction'] == 'estable':
        return {
            'level': 'MODERADO',
            'color': '#ffc107',
            'message': '📊 Deserción estable. Monitorear de cerca.'
        }
    else:
        return {
            'level': 'BAJO',
            'color': '#28a745',
            'message': '✅ Deserción en disminución. Mantener estrategias actuales.'
        }


# ===========================================================================
# MAIN EXECUTION
# ===========================================================================

def main():
    """
    Función principal ejecutada desde Node.js
    """
    try:
        # Leer input desde stdin
        input_data = json.loads(sys.stdin.read())

        prediction_type = input_data.get('type')
        data = input_data.get('data')
        params = input_data.get('params', {})

        # Ejecutar predicción según tipo
        if prediction_type == 'grades':
            result = predict_grades(
                data,
                params.get('student_id'),
                params.get('forecast_months', 3)
            )

        elif prediction_type == 'enrollments':
            result = predict_enrollments(
                data,
                params.get('forecast_months', 6)
            )

        elif prediction_type == 'dropout':
            result = predict_dropout_trend(
                data,
                params.get('forecast_months', 6)
            )

        elif prediction_type == 'custom_arima':
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)
            series = df[params.get('value_column', 'value')]

            result = forecast_with_arima(
                series,
                periods=params.get('periods', 30),
                order=tuple(params.get('order', [1, 1, 1]))
            )
            result['success'] = True

        elif prediction_type == 'custom_prophet':
            df = pd.DataFrame(data)
            result = forecast_with_prophet(
                df,
                periods=params.get('periods', 30),
                seasonality_mode=params.get('seasonality_mode', 'additive')
            )
            result['success'] = True

        else:
            result = {
                'success': False,
                'error': f'Unknown prediction type: {prediction_type}'
            }

        # Output JSON a stdout
        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'type': 'exception'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
