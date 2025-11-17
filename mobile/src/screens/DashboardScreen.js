/**
 * 📊 DASHBOARD SCREEN - SEMANA 21
 * Pantalla principal del estudiante con métricas y accesos rápidos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import { getUserData } from '../services/AuthService';

const API_BASE_URL = 'https://your-production-url.com/api';

export default function DashboardScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    promedio: 0,
    asistencia: 0,
    tareas_pendientes: 0,
    proximos_eventos: 0
  });
  const [gradesHistory, setGradesHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await getUserData();
      setUserData(user);

      // Cargar estadísticas del estudiante
      const response = await axios.get(`${API_BASE_URL}/students/${user.uuid}/dashboard`);

      if (response.data.success) {
        setStats(response.data.stats);
        setGradesHistory(response.data.grades_history || []);
      }

    } catch (error) {
      console.error('[DASHBOARD] Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Preparar datos para gráfica
  const chartData = {
    labels: gradesHistory.slice(0, 6).map(g => g.materia.substring(0, 3)),
    datasets: [{
      data: gradesHistory.slice(0, 6).map(g => g.calificacion),
      color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {userData?.nombre}! 👋</Text>
        <Text style={styles.subtitle}>Aquí está tu resumen académico</Text>
      </View>

      {/* Métricas Principales */}
      <View style={styles.metricsRow}>
        <MetricCard
          icon="chart-line"
          label="Promedio"
          value={stats.promedio.toFixed(1)}
          color="#0066cc"
        />
        <MetricCard
          icon="check-circle"
          label="Asistencia"
          value={`${stats.asistencia}%`}
          color="#28a745"
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          icon="clipboard-list"
          label="Tareas Pendientes"
          value={stats.tareas_pendientes}
          color="#ffc107"
        />
        <MetricCard
          icon="calendar-month"
          label="Próximos Eventos"
          value={stats.proximos_eventos}
          color="#9b59b6"
        />
      </View>

      {/* Gráfica de Calificaciones */}
      {gradesHistory.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Últimas Calificaciones</Text>
          <LineChart
            data={chartData}
            width={350}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Accesos Rápidos */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Calificaciones')}
        >
          <Icon name="clipboard-text" size={24} color="#0066cc" />
          <Text style={styles.actionText}>Ver Calificaciones</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PredictiveAnalytics')}
        >
          <Icon name="chart-timeline-variant" size={24} color="#9b59b6" />
          <Text style={styles.actionText}>Predicción de Desempeño</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Recommendations')}
        >
          <Icon name="star-circle" size={24} color="#e74c3c" />
          <Text style={styles.actionText}>Cursos Recomendados</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <Icon name="chat" size={24} color="#28a745" />
          <Text style={styles.actionText}>Chat con Tutor</Text>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Componente MetricCard
function MetricCard({ icon, label, value, color }) {
  return (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  quickActions: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});
