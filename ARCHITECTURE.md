# Arquitectura BGE Héroes de la Patria

## Visión General

El sistema BGE Héroes de la Patria es una plataforma educativa integral construida sobre una arquitectura monolítica modular, diseñada para ser escalable y mantenible. Utiliza Node.js en el backend y una arquitectura orientada a servicios.

## Stack Tecnológico

* **Backend:** Node.js + Express
* **Base de Datos:** PostgreSQL (anteriormente MySQL migrado)
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla + Web Components ligeros)
* **Infraestructura:** Vercel (Serverless Functions) + Neon/Vercel Postgres

## Patrones de Diseño

### 1. Service Layer Pattern

La lógica de negocio reside exclusivamente en los servicios (`backend/services/*.js`). Los controladores (rutas) son delgados y solo manejan HTTP.

### 2. Data Access Object (DAO) Pattern

El acceso a datos está abstraído en DAOs (`backend/data/*.dao.js`). Ningún servicio ejecuta SQL directamente.

* **Beneficio:** Permite cambiar la estrategia de persistencia y facilita el testing (mocking de DAOs).

## Estructura de Directorios Clave

```
/backend
  /data         # DAOs (Acceso a datos)
  /services     # Lógica de negocio
  /routes       # Definición de API endpoints
  /config       # Configuración (DB, Auth)
  /utils        # Utilidades transversales (Logger, PDF, Email)
/public         # Frontend estático
  /js           # Lógica de cliente
  /css          # Estilos
```

## Flujo de Datos

1. **Request:** Cliente envía HTTP Request.
2. **Route:** `express.Router` recibe la petición.
3. **Controller (Inline):** Valida input básico.
4. **Service:** Ejecuta lógica de negocio (validaciones complejas, orquestación).
5. **DAO:** Ejecuta query SQL parametrizada.
6. **Database:** PostgreSQL retorna filas.
7. **Response:** JSON response al cliente.

## Seguridad

* **Autenticación:** JWT (JSON Web Tokens).
* **Protección:** Helmet, CORS, Rate Limiting, OWASP best practices.
* **Logs:** GDPR-compliant (sin datos sensibles en logs de producción).

## Roadmap de Evolución

* **Fase 1 (Actual):** Refactorización a Servicios+DAOs completada.
* **Fase 2:** Sistema de Calificaciones y Padres.
* **Fase 3:** Modernización Frontend (CSP, Multi-tenancy).
* **Fase 4:** Migración a TypeScript (Backend).
