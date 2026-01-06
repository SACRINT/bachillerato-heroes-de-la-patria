# 📱 BGE Héroes Mobile App

Este directorio contiene el código fuente para la aplicación móvil nativa (Android/iOS) de la plataforma BGE Héroes de la Patria.

## 🏗 Arquitectura

El proyecto sigue una estructura estándar de React Native optimizada para escalabilidad:

```
mobile/
├── src/
│   ├── components/  # Componentes UI reutilizables (Botones, Cards, Inputs)
│   ├── screens/     # Pantallas de la aplicación (Login, Home, Perfil)
│   ├── navigation/  # Configuración de React Navigation
│   ├── services/    # Clientes API y lógica de negocio
│   ├── utils/       # Helpers y constantes
│   └── assets/      # Imágenes y fuentes
├── README.md        # Esta documentación
└── package.json     # Dependencias (a generar al inicializar)
```

## 🚀 Inicialización del Proyecto

Dado que este entorno es un repositorio existente, sigue estos pasos para inicializar el proyecto React Native:

1. **Prerrequisitos:**
   - Node.js >= 18
   - JDK 11 o superior
   - Android Studio (para Android) o Xcode (para iOS)

2. **Inicializar React Native (si aún no existe):**

   ```bash
   npx react-native init BGEMobile --directory .
   ```

   *Nota: Esto sobrescribirá archivos en la raíz de `mobile/`, asegúrate de respaldar si ya hay trabajo.*

3. **Instalar Dependencias Clave:**

   ```bash
   npm install @react-navigation/native @react-navigation/native-stack
   npm install react-native-screens react-native-safe-area-context
   npm install axios react-native-biometrics
   ```

4. **Ejecutar la App:**

   ```bash
   npx react-native run-android
   # o
   npx react-native run-ios
   ```

## 🔐 Autenticación Biométrica

La app está diseñada para integrarse con el backend mediante `mobile-auth.service.js`.

- Endpoint de Registro: `POST /api/mobile/auth/device-register`
- Endpoint de Login: `POST /api/mobile/auth/biometric-login`

Utiliza la librería `react-native-biometrics` para generar pares de claves RSA y firmar el payload de login.

## 📡 API Client

Configura tu cliente Axios en `src/services/api.js` apuntando a tu servidor local o de producción:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // 10.0.2.2 para emulador Android
  timeout: 10000,
});

export default api;
```
