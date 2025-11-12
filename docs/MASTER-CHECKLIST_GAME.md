# 🎮 MASTER-CHECKLIST - Ecosistema de Gamificación (IACoins)

**Visión:** Crear un sistema de "Aprender para Ganar" (Learn-to-Earn) donde los usuarios son recompensados con una moneda virtual (IACoins) por su compromiso y logros educativos, la cual pueden usar para acceder a funcionalidades avanzadas de IA.

**Estado Global:** ⏸️ PENDIENTE (En espera de la estabilización de la v2.x y la arquitectura SaaS v3.0)

---

## 🎯 FASE 1: Diseño de la Economía y Arquitectura del Juego

**Objetivo:** Definir las reglas, el valor y la estructura técnica del ecosistema de IACoins.

- [ ] **1.1.** **Investigación de Mercado:** Analizar modelos de negocio de juegos (ej. Aeria Games) y plataformas educativas (ej. Duolingo) para definir la estrategia de monetización y engagement.
- [ ] **1.2.** **Diseño de la Economía Virtual:**
    - [ ] Definir el valor de 1 IAcoin (ej. en USD o por tarea de IA).
    - [ ] Crear la tabla de "precios" para las acciones de la IA (ej. generar un examen = 50 IACoins).
    - [ ] Diseñar la tabla de recompensas (ej. terminar un curso = 200 IACoins).
- [ ] **1.3.** **Diseño del Schema de Base de Datos:**
    - [ ] Crear tablas: `user_wallets`, `iacoin_transactions`, `challenges`, `challenge_completions`, `store_items`.
- [ ] **1.4.** **Diseño de Arquitectura Técnica:** Definir cómo se conectará el motor de juego con el resto de la plataforma.

## 🎯 FASE 2: Implementación del Núcleo del Sistema

**Objetivo:** Construir la infraestructura básica para que las IACoins existan y funcionen.

- [ ] **2.1.** **Implementar Schema en BD:** Ejecutar el script SQL para crear las nuevas tablas.
- [ ] **2.2.** **Desarrollar la API de la Billetera (Wallet):**
    - [ ] Endpoints para consultar saldo (`GET /api/wallet`).
    - [ ] Endpoints para ver historial de transacciones (`GET /api/wallet/history`).
- [ ] **2.3.** **Integrar Pasarela de Pagos:**
    - [ ] Implementar la compra de IACoins con Stripe o Mercado Pago.
    - [ ] Crear webhooks para confirmar transacciones y acreditar monedas.
- [ ] **2.4.** **Modificar el Acceso a la IA:**
    - [ ] Implementar el middleware que verifica el saldo y deduce las IACoins antes de ejecutar una tarea de IA.

## 🎯 FASE 3: Desarrollo del Motor de Retos y Recompensas

**Objetivo:** Crear las mecánicas para que los usuarios puedan ganar IACoins de forma gratuita.

- [ ] **3.1.** **Crear el Motor de Retos:**
    - [ ] API para definir y gestionar retos (diarios, semanales, de único cumplimiento).
    - [ ] Sistema que detecte automáticamente el cumplimiento de un reto (ej. `user.completed_course`).
- [ ] **3.2.** **Implementar la Asignación de Recompensas:**
    - [ ] Servicio que acredite las IACoins y XP (Puntos de Experiencia) a la billetera del usuario al cumplir un reto.
- [ ] **3.3.** **Diseñar e Implementar Juegos Educativos:**
    - [ ] **Juego 1 (Ej. "Duelo de Sabiduría"):** Un juego de trivia multijugador en tiempo real.
    - [ ] **Juego 2 (Ej. "Constructor de Conceptos"):** Un juego de arrastrar y soltar para armar mapas conceptuales.
- [ ] **3.4.** **Crear Interfaz de Retos:** Desarrollar la sección en el frontend donde los usuarios puedan ver los retos disponibles y su progreso.

## 🎯 FASE 4: Lanzamiento y Balanceo

**Objetivo:** Lanzar el sistema a los usuarios y ajustar la economía del juego.

- [ ] **4.1.** **Lanzamiento Beta:** Liberar el sistema para un grupo de usuarios de prueba.
- [ ] **4.2.** **Monitoreo y Analítica:** Analizar qué retos son más populares, cuántas monedas se ganan vs. se gastan/compran.
- [ ] **4.3.** **Balanceo de la Economía:** Ajustar los precios y recompensas para asegurar que el sistema sea justo, motivador y rentable.
