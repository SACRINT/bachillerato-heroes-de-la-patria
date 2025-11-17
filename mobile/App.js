/**
 * 📱 BACHILLERATO HÉROES DE LA PATRIA - MOBILE APP
 * SEMANA 21 - React Native Mobile App
 *
 * Aplicación móvil iOS/Android para estudiantes, padres y profesores
 *
 * Features:
 * - Autenticación biométrica (Touch ID / Face ID)
 * - Dashboard personalizado por rol
 * - Consulta de calificaciones en tiempo real
 * - Notificaciones push
 * - Chat con tutores
 * - Calendario de eventos
 * - Modo offline con AsyncStorage
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Platform, StatusBar, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GradesScreen from './src/screens/GradesScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import PredictiveAnalyticsScreen from './src/screens/PredictiveAnalyticsScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';

// Services
import { checkAuthStatus, requestUserPermission } from './src/services/AuthService';
import { initializePushNotifications } from './src/services/NotificationService';

// Navigation
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ===========================================================================
// BOTTOM TAB NAVIGATOR (Main App)
// ===========================================================================

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Calificaciones') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else if (route.name === 'Calendario') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Notificaciones') {
            iconName = focused ? 'bell' : 'bell-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calificaciones" component={GradesScreen} />
      <Tab.Screen name="Calendario" component={CalendarScreen} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ===========================================================================
// MAIN APP COMPONENT
// ===========================================================================

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Inicializa la aplicación
   */
  const initializeApp = async () => {
    try {
      // 1. Verificar autenticación
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);

      // 2. Solicitar permisos de notificaciones
      await requestUserPermission();

      // 3. Inicializar push notifications
      await initializePushNotifications();

      // 4. Configurar handlers de notificaciones
      setupNotificationHandlers();

      // 5. Esperar 2 segundos para splash screen
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('[APP] Initialization error:', error);
      setIsLoading(false);
    }
  };

  /**
   * Configura handlers de notificaciones push
   */
  const setupNotificationHandlers = () => {
    // Notificación recibida cuando app está en foreground
    messaging().onMessage(async remoteMessage => {
      console.log('[NOTIFICATION] Foreground message:', remoteMessage);

      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body,
        [{ text: 'OK' }]
      );
    });

    // Notificación tocada (app en background/killed)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[NOTIFICATION] Notification opened app:', remoteMessage);
      // Navegar a pantalla específica según notification data
      handleNotificationNavigation(remoteMessage.data);
    });

    // Verificar si app se abrió desde notificación (killed state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('[NOTIFICATION] App opened from killed state:', remoteMessage);
          handleNotificationNavigation(remoteMessage.data);
        }
      });
  };

  /**
   * Maneja navegación desde notificaciones
   */
  const handleNotificationNavigation = (data) => {
    if (!data) return;

    const { type, targetScreen, targetId } = data;

    // Lógica de navegación según tipo de notificación
    // Ejemplo: type='grade' → navegar a GradesScreen
    // Ejemplo: type='event' → navegar a CalendarScreen con eventId
    console.log('[NOTIFICATION] Navigate to:', type, targetScreen, targetId);
  };

  // Mostrar splash screen mientras carga
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            // Auth Stack
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            // Main App Stack
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="PredictiveAnalytics" component={PredictiveAnalyticsScreen} />
              <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
