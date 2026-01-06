import axios from 'axios';
import { Platform } from 'react-native';

// URL base dependiendo del entorno
// Android Emulator usa 10.0.2.2 para acceder a localhost de la máquina host
// iOS Simulator usa localhost
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api',
    ios: 'http://localhost:3000/api',
    default: 'http://192.168.1.100:3000/api', // IP local para dispositivos físicos
});

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para debugging y tokens
api.interceptors.request.use(
    (config) => {
        // En un futuro aquí inyectaremos el token JWT
        // const token = await AsyncStorage.getItem('userToken');
        // if (token) config.headers.Authorization = `Bearer ${token}`;

        if (__DEV__) {
            console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        if (__DEV__) {
            console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        }
        return response;
    },
    (error) => {
        if (__DEV__) {
            console.error(`[API Error] ${error.message}`, error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default api;
