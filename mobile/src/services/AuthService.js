/**
 * 🔐 AUTH SERVICE - SEMANA 21
 * Servicio de autenticación para React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ReactNativeBiometrics from 'react-native-biometrics';
import messaging from '@react-native-firebase/messaging';

const API_BASE_URL = 'https://your-production-url.com/api'; // TODO: Cambiar a URL producción

// ===========================================================================
// AUTH TOKEN MANAGEMENT
// ===========================================================================

export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('auth_token', token);
    console.log('[AUTH] Token saved');
  } catch (error) {
    console.error('[AUTH] Error saving token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.error('[AUTH] Error getting token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    console.log('[AUTH] Token removed');
  } catch (error) {
    console.error('[AUTH] Error removing token:', error);
  }
};

// ===========================================================================
// USER DATA MANAGEMENT
// ===========================================================================

export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    console.log('[AUTH] User data saved');
  } catch (error) {
    console.error('[AUTH] Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[AUTH] Error getting user data:', error);
    return null;
  }
};

// ===========================================================================
// AUTHENTICATION
// ===========================================================================

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      const { token, usuario } = response.data;

      // Guardar token y datos de usuario
      await saveAuthToken(token);
      await saveUserData(usuario);

      // Registrar FCM token para push notifications
      await registerFCMToken(usuario.uuid);

      return { success: true, user: usuario };
    } else {
      return { success: false, error: response.data.error };
    }

  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Error de conexión'
    };
  }
};

export const logout = async () => {
  try {
    // Opcional: Llamar endpoint de logout en backend
    const token = await getAuthToken();
    if (token) {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // Limpiar datos locales
    await removeAuthToken();
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('biometric_enabled');

    console.log('[AUTH] Logout successful');
    return { success: true };

  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const checkAuthStatus = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    // Validar token con backend
    const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.valid === true;

  } catch (error) {
    console.error('[AUTH] Auth status check error:', error);
    return false;
  }
};

// ===========================================================================
// BIOMETRIC AUTHENTICATION
// ===========================================================================

export const isBiometricAvailable = async () => {
  try {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (available) {
      console.log('[AUTH] Biometric type:', biometryType);
      // biometryType: TouchID, FaceID, Biometrics (Android)
      return { available: true, type: biometryType };
    }

    return { available: false };

  } catch (error) {
    console.error('[AUTH] Biometric check error:', error);
    return { available: false };
  }
};

export const enableBiometric = async () => {
  try {
    await AsyncStorage.setItem('biometric_enabled', 'true');
    console.log('[AUTH] Biometric enabled');
    return { success: true };
  } catch (error) {
    console.error('[AUTH] Error enabling biometric:', error);
    return { success: false, error: error.message };
  }
};

export const disableBiometric = async () => {
  try {
    await AsyncStorage.removeItem('biometric_enabled');
    console.log('[AUTH] Biometric disabled');
    return { success: true };
  } catch (error) {
    console.error('[AUTH] Error disabling biometric:', error);
    return { success: false, error: error.message };
  }
};

export const isBiometricEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem('biometric_enabled');
    return enabled === 'true';
  } catch (error) {
    console.error('[AUTH] Error checking biometric status:', error);
    return false;
  }
};

export const authenticateWithBiometric = async () => {
  try {
    const rnBiometrics = new ReactNativeBiometrics();

    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: 'Autenticación requerida',
      cancelButtonText: 'Cancelar'
    });

    if (success) {
      console.log('[AUTH] Biometric authentication successful');
      return { success: true };
    } else {
      return { success: false, error: 'Autenticación cancelada' };
    }

  } catch (error) {
    console.error('[AUTH] Biometric auth error:', error);
    return { success: false, error: error.message };
  }
};

// ===========================================================================
// PUSH NOTIFICATIONS (FCM)
// ===========================================================================

export const requestUserPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[AUTH] Notification permission granted:', authStatus);
      return true;
    } else {
      console.log('[AUTH] Notification permission denied');
      return false;
    }

  } catch (error) {
    console.error('[AUTH] Permission request error:', error);
    return false;
  }
};

export const getFCMToken = async () => {
  try {
    const fcmToken = await messaging().getToken();
    console.log('[AUTH] FCM Token:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('[AUTH] FCM token error:', error);
    return null;
  }
};

export const registerFCMToken = async (userId) => {
  try {
    const fcmToken = await getFCMToken();
    if (!fcmToken) return;

    const authToken = await getAuthToken();

    // Enviar FCM token al backend
    await axios.post(
      `${API_BASE_URL}/notifications/register-device`,
      {
        userId,
        fcmToken,
        platform: Platform.OS
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('[AUTH] FCM token registered on server');

  } catch (error) {
    console.error('[AUTH] FCM registration error:', error);
  }
};

// ===========================================================================
// AXIOS INTERCEPTORS
// ===========================================================================

// Agregar token automáticamente a todas las requests
axios.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Manejar errores 401 (token expirado)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[AUTH] Token expired, logging out');
      await logout();
      // Opcional: Navegar a pantalla de login
    }
    return Promise.reject(error);
  }
);
