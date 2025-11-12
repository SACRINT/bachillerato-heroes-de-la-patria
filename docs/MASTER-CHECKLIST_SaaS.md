# 🚀 MASTER-CHECKLIST - Proyecto SaaS Educativo (BGE v3.0)

**Visión:** Transformar la plataforma BGE en un sistema SaaS multi-inquilino, configurable y gamificado, monetizado a través de un ecosistema de "IACoins".

**Estado Global:** ⏸️ PENDIENTE (En espera de la estabilización de la v2.x)

---

## 🎯 FASE 1: Centralización de la Configuración

**Objetivo:** Abstraer toda la información específica de la institución para que la plataforma pueda ser "tematizada" para cualquier escuela.

- [ ] **1.1.** Crear un único archivo de configuración maestro (ej. `config/institucion.json`).
- [ ] **1.2.** Refactorizar el frontend para leer dinámicamente el nombre de la institución, logos, colores y datos de contacto desde el archivo de configuración.
- [ ] **1.3.** Refactorizar el backend para que utilice la configuración de la institución actual en lugar de valores hardcodeados (ej. en plantillas de email).
- [ ] **1.4.** Crear un panel de administrador básico para editar este archivo de configuración a través de una interfaz.

## 🎯 FASE 2: Arquitectura Multi-Inquilino

**Objetivo:** Asegurar que los datos de cada escuela estén completamente aislados y seguros.

- [ ] **2.1.** **Decisión de Arquitectura:** Investigar y decidir entre un modelo de "Base de Datos Separada por Inquilino" o "Schema Único con `institucion_id`".
- [ ] **2.2.** **Modificar Schema de BD:** Aplicar la estrategia decidida, añadiendo la columna `institucion_id` a todas las tablas relevantes.
- [ ] **2.3.** **Refactorizar API Backend:** Modificar todas las consultas (SELECT, INSERT, UPDATE, DELETE) para que siempre filtren por la `institucion_id` del usuario autenticado.
- [ ] **2.4.** **Pruebas de Aislamiento:** Crear tests para garantizar que un usuario de la Escuela A no pueda ver, modificar o acceder a datos de la Escuela B bajo ninguna circunstancia.

## 🎯 FASE 3: Ecosistema de Gamificación y Monetización (IACoins)

**Objetivo:** Implementar el sistema de recompensas, niveles y la moneda virtual "IACoins" como núcleo del modelo de negocio.

- [ ] **3.1.** **Diseño de la Economía Virtual:**
    - [ ] Definir el valor y coste de las IACoins.
    - [ ] Diseñar la tabla de "precios" para las diferentes acciones de la IA.
    - [ ] Balancear la obtención de monedas gratis vs. la compra.
- [ ] **3.2.** **Schema de Base de Datos para Gamificación:**
    - [ ] Tabla `user_wallets` para almacenar el saldo de IACoins.
    - [ ] Tabla `iacoin_transactions` para auditar todos los gastos y ganancias.
    - [ ] Expandir la tabla `achievements` para incluir recompensas en IACoins.
- [ ] **3.3.** **Integración con Pasarela de Pagos:**
    - [ ] Investigar e integrar una pasarela de pagos (Stripe, Mercado Pago) para la compra de IACoins.
    - [ ] Crear los endpoints de API para manejar las compras y la asignación de monedas.
- [ ] **3.4.** **Refactorizar el Acceso a la IA:**
    - [ ] Modificar el backend para que, antes de ejecutar una tarea de IA, verifique el saldo de IACoins del usuario y deduzca el coste.
- [ ] **3.5.** **Creación de Retos y Logros:**
    - [ ] Diseñar e implementar el sistema de retos interactivos (juegos, cursos, etc.).
    - [ ] Crear el motor que asigna IACoins automáticamente al completar un reto.
- [ ] **3.6.** **Marketplace de Tutorías P2P (Peer-to-Peer):**
    - [ ] Diseñar un sistema donde estudiantes destacados puedan registrarse como tutores.
    - [ ] Implementar la funcionalidad para que otros estudiantes puedan buscar y "contratar" a estos tutores usando IACoins.
    - [ ] Crear el flujo donde las IACoins se transfieren del "estudiante-cliente" al "estudiante-tutor", creando una economía circular.

## 🎯 FASE 4: Panel de Super-Administrador (Tu Panel de Control)

**Objetivo:** Crear la interfaz desde donde gestionarás a todas las escuelas suscritas al servicio.

- [ ] **4.1.** Crear una nueva interfaz de "Super Admin".
- [ ] **4.2.** Desarrollar el módulo para "onboardear" una nueva institución (crear su configuración, su administrador inicial, etc.).
- [ ] **4.3.** Crear dashboards para visualizar las métricas de uso de todas las escuelas.
- [ ] **4.4.** Módulo para gestionar suscripciones y pagos.

## 🎯 FASE 5: Ecosistema de Aprendizaje Inmersivo (AR/VR)

**Objetivo:** Posicionar la plataforma como líder en innovación educativa a través de experiencias de Realidad Aumentada y Virtual.

- [ ] **5.1.** **Investigación de Tecnologías:** Evaluar frameworks como A-Frame, Three.js, y AR.js para determinar la pila tecnológica.
- [ ] **5.2.** **Diseño de Experiencias Base:**
    - [ ] **Laboratorio de Química AR:** Visualización de moléculas y reacciones en 3D.
    - [ ] **Recorrido Histórico VR:** Visitas virtuales a sitios históricos relevantes para el plan de estudios.
    - [ ] **Geometría Interactiva AR:** Manipulación de figuras geométricas en 3D en el espacio real.
- [ ] **5.3.** **Integración con la Plataforma:**
    - [ ] Conectar las experiencias AR/VR con el sistema de logros y IACoins (ej. "Gana 100 IACoins por completar el recorrido por Teotihuacán").
    - [ ] Crear una nueva sección en la plataforma para acceder al "Laboratorio AR/VR".
- [ ] **5.4.** **Pruebas de Compatibilidad:** Desarrollar un módulo que verifique la compatibilidad del dispositivo del usuario (WebXR, sensores, etc.) como se prototipó en `ar-vr-lab.html`.