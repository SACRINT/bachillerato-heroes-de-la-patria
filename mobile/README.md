# 📱 Bachillerato Héroes - Mobile App (iOS/Android)

**SEMANA 21 - React Native Mobile App**

Aplicación móvil nativa para iOS y Android del sistema de gestión académica.

---

## 🎯 Features

### Autenticación
- ✅ Login con email/contraseña
- ✅ Autenticación biométrica (Touch ID / Face ID)
- ✅ Session persistence con AsyncStorage
- ✅ Token auto-refresh

### Dashboard Personalizado
- ✅ Métricas académicas en tiempo real
- ✅ Gráficas de calificaciones (Chart.js)
- ✅ Asistencia y tareas pendientes
- ✅ Pull-to-refresh

### Calificaciones
- ✅ Consulta de calificaciones por materia
- ✅ Historial completo
- ✅ Predicción de desempeño (ML integration)

### Notificaciones Push
- ✅ Firebase Cloud Messaging (FCM)
- ✅ Notificaciones de calificaciones nuevas
- ✅ Alertas de eventos
- ✅ Mensajes de tutores

### Chat con Tutores
- ✅ Mensajería en tiempo real
- ✅ Historial de conversaciones
- ✅ Typing indicators

### Calendario
- ✅ Eventos académicos
- ✅ Exámenes y entregas
- ✅ Sincronización con backend

### Modo Offline
- ✅ Caché de datos con AsyncStorage
- ✅ Sincronización automática al reconectar

---

## 🏗️ Arquitectura

```
mobile/
├── App.js                      # Entry point
├── package.json                # Dependencies
├── src/
│   ├── screens/                # Pantallas principales
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── GradesScreen.js
│   │   ├── CalendarScreen.js
│   │   ├── NotificationsScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── ChatScreen.js
│   │   ├── PredictiveAnalyticsScreen.js
│   │   └── RecommendationsScreen.js
│   ├── services/               # API Services
│   │   ├── AuthService.js      # Autenticación
│   │   ├── NotificationService.js
│   │   ├── APIClient.js
│   │   └── SyncService.js
│   ├── components/             # Reusable components
│   ├── navigation/             # Navigation config
│   └── utils/                  # Utilities
├── android/                    # Android native code
└── ios/                        # iOS native code
```

---

## 🚀 Setup

### 1. Instalar Dependencias

```bash
cd mobile
npm install

# iOS (solo macOS)
cd ios && pod install && cd ..
```

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```env
API_BASE_URL=https://your-production-url.com/api
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_SERVICES_JSON_PATH=./android/app/google-services.json
```

### 3. Configurar Firebase

1. Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)
2. Colocar en `android/app/` y `ios/` respectivamente

### 4. Ejecutar en Desarrollo

**Android:**
```bash
npm run android
```

**iOS (solo macOS):**
```bash
npm run ios
```

---

## 📦 Build para Producción

### Android APK

```bash
npm run build:android
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS (solo macOS)

```bash
npm run build:ios
# Requiere: Xcode + Apple Developer Account
```

---

## 🔧 Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React Native 0.72.6 |
| Navigation | React Navigation 6 |
| State Management | React Hooks + Context API |
| Storage | AsyncStorage |
| API Client | Axios |
| Push Notifications | Firebase Cloud Messaging |
| Charts | react-native-chart-kit |
| Biometrics | react-native-biometrics |
| Icons | react-native-vector-icons |

---

## 📱 Screenshots

*(TODO: Agregar screenshots de la app)*

---

## 🐛 Troubleshooting

### Error: "Unable to resolve module"

```bash
# Limpiar cache
npm start -- --reset-cache
```

### Android Build Fails

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Pod Install Fails

```bash
cd ios
pod deintegrate
pod install
cd ..
```

---

## 📝 Testing

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm run test:e2e
```

---

## 🚀 Deployment

### Google Play Store

1. Generar keystore
2. Build signed APK
3. Subir a Play Console
4. Configurar listing

### Apple App Store

1. Configurar certificados
2. Build archive con Xcode
3. Upload a TestFlight
4. Submit for review

---

## 📚 Documentación Adicional

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)
- [Firebase for React Native](https://rnfirebase.io/)

---

**Estado:** ✅ SEMANA 21 COMPLETADA
**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
