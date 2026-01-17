# 🌐 AÑO 4 - FASE 1: METAVERSE CORE (Semanas 1-10)

## Plan de Trabajo Año 4 - Héroes del Metaverso

---

## SEMANA 1: 3D ENGINE FOUNDATION

**Objetivo:** Configurar el motor de renderizado y la escena base.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Configurar proyecto React Three Fiber (R3F) | Frontend | CRÍTICA | ✅ |
| 2 | Implementar Canvas y Loop de renderizado básico | Frontend | CRÍTICA | ✅ |
| 3 | Configurar sistema de cámaras (PerspectiveCamera) | 3D | CRÍTICA | ✅ |
| 4 | Implementar controles de órbita (OrbitControls) para debug | 3D | ALTA | ✅ |
| 5 | Configurar iluminación base (Ambient + Directional) | 3D | ALTA | ✅ |
| 6 | Crear componente `SceneManager` para gestión de estados | Frontend | CRÍTICA | ✅ |
| 7 | Implementar loader de texturas básico | 3D | MEDIA | ✅ |
| 8 | Configurar sombras básicas (ShadowMap) | 3D | MEDIA | ✅ |
| 9 | Crear primitiva "Suelo" con grid helper | 3D | BAJA | ✅ |
| 10 | Implementar sistema de resize de ventana responsivo | Frontend | ALTA | ✅ |
| 11 | Integrar Leva o Dat.GUI para debug en tiempo real | Tooling | MEDIA | ✅ |
| 12 | Configurar Stats.js para monitoreo de FPS | Tooling | ALTA | ✅ |
| 13 | Crear estructura de carpetas `public/3d/assets` | Infra | MEDIA | ✅ |
| 14 | Commit inicial de "Metaverse Engine" | Git | BAJA | ✅ |

---

## SEMANA 2: ASSET PIPELINE & OPTIMIZATION

**Objetivo:** Flujo de trabajo para importar modelos 3D eficientemente.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Configurar GLTFLoader con Draco Compression | 3D | CRÍTICA | ✅ |
| 2 | Implementar sistema de Preloading de assets críticos | Frontend | ALTA | ✅ |
| 3 | Crear script para optimizar modelos (glTF-Transform) | DevOps | MEDIA | ✅ |
| 4 | Implementar `useGLTF` hook para carga declarativa | Frontend | ALTA | ✅ |
| 5 | Configurar Texture Compression (KTX2/Basis) | 3D | ALTA | ✅ |
| 6 | Crear pantalla de carga 3D (3D Loader Screen) | Frontend | MEDIA | ✅ |
| 7 | Implementar gestión de errores en carga de modelos | Frontend | MEDIA | ✅ |
| 8 | Cargar primer modelo de prueba "Hero Statue" | 3D | MEDIA | ✅ |
| 9 | Implementar InstancedMesh para objetos repetitivos | 3D | ALTA | ✅ |
| 10 | Configurar sistema de niveles de detalle (LOD) básico | 3D | BAJA | ✅ |
| 11 | Crear banco de materiales compartidos | 3D | MEDIA | ✅ |
| 12 | Implementar Dispose pattern para liberar memoria | 3D | CRÍTICA | ✅ |
| 13 | Documentar guía de exportación desde Blender | Docs | BAJA | ✅ |
| 14 | Test de rendimiento con 100 objetos instanciados | Testing | MEDIA | ✅ |

---

## SEMANA 3: ENVIRONMENT & ATMOSPHERE

**Objetivo:** Crear un entorno visualmente agradable ("El Campus Virtual").

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Implementar Skybox dinámico (Día/Noche) | 3D | ALTA | ✅ |
| 2 | Crear terreno base con Heightfields simples | 3D | CRÍTICA | ✅ |
| 3 | Implementar niebla (Fog/FogExp2) para profundidad | 3D | MEDIA | ✅ |
| 4 | Añadir vegetación básica (árboles low-poly) | 3D | MEDIA | ✅ |
| 5 | Configurar Post-Processing (Bloom effect) | 3D | ALTA | ✅ |
| 6 | Implementar colisiones con el suelo (Raycasting simple) | 3D | CRÍTICA | ✅ |
| 7 | Crear edificio "Recepción" (modelo placeholder) | 3D | ALTA | ✅ |
| 8 | Implementar sistema de luces bakeadas (Lightmaps fake) | 3D | MEDIA | ✅ |
| 9 | Añadir sistema de partículas (polvo/hojas) | 3D | BAJA | ✅ |
| 10 | Configurar reflejos básicos (EnvironmentMap) | 3D | MEDIA | ✅ |
| 11 | Crear bordes del mundo (muros invisibles) | 3D | MEDIA | ✅ |
| 12 | Implementar audio ambiental 3D | Audio | BAJA | ✅ |
| 13 | Optimizar renderizado de terreno (Chunking) | 3D | BAJA | ✅ |
| 14 | Revisión de estética "Low Poly Stylish" | Design | MEDIA | ✅ |

---

## SEMANA 4: AVATAR SYSTEM CORE

**Objetivo:** Permitir al usuario tener una representación digital.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Investigar integración ReadyPlayerMe (RPM) | Research | CRÍTICA | ✅ |
| 2 | Implementar carga de avatar desde URL .glb | 3D | CRÍTICA | ✅ |
| 3 | Configurar retargeting de animaciones Mixamo | 3D | ALTA | ✅ |
| 4 | Implementar máquina de estados de animación (Idle, Walk, Run) | Frontend | CRÍTICA | ✅ |
| 5 | Crear componente `AvatarController` | Frontend | CRÍTICA | ✅ |
| 6 | Implementar selector de avatares predefinidos | UI | MEDIA | ✅ |
| 7 | Sincronizar velocidad de movimiento con animación | 3D | ALTA | ✅ |
| 8 | Implementar parpadeo de ojos (MorphTargets) | 3D | BAJA | ✅ |
| 9 | Crear sombra dinámica bajo el avatar | 3D | MEDIA | ✅ |
| 10 | Implementar rotación suave del personaje | 3D | MEDIA | ✅ |
| 11 | Cachear modelo de avatar localmente | Frontend | MEDIA | ✅ |
| 12 | Optimizar texturas del avatar (Atlas) | 3D | BAJA | ✅ |
| 13 | Escribir tests para carga de avatares | Testing | BAJA | ✅ |
| 14 | Crear editor de avatar minimalista (color ropa) | UI | BAJA | ✅ |

---

## SEMANA 5: PLAYER MOVEMENT & PHYSICS

**Objetivo:** Movimiento fluido y colisiones realistas.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Integrar motor de físicas (Cannon.js o Rapier) | Physics | CRÍTICA | ✅ |
| 2 | Crear cápsula de colisión para el jugador | Physics | CRÍTICA | ✅ |
| 3 | Implementar movimiento WASD + Flechas | Frontend | CRÍTICA | ✅ |
| 4 | Implementar salto con gravedad realista | Physics | ALTA | ✅ |
| 5 | Configurar cámara en tercera persona (seguimiento suave) | 3D | ALTA | ✅ |
| 6 | Implementar detección de colisión con edificios | Physics | CRÍTICA | ✅ |
| 7 | Crear sistema de "Step Offset" (subir escalones) | Physics | MEDIA | ✅ |
| 8 | Implementar correr (Sprint) con Shift | Frontend | MEDIA | ✅ |
| 9 | Ajustar fricción y restitución de materiales | Physics | BAJA | ✅ |
| 10 | Implementar modo primera persona (switch de cámara) | 3D | MEDIA | ✅ |
| 11 | Crear debug drawer para ver colliders | Tooling | MEDIA | ✅ |
| 12 | Optimizar tick rate de físicas | Physics | ALTA | ✅ |
| 13 | Resolver bugs de "tunneling" (atravesar paredes) | Bugfix | ALTA | ✅ |
| 14 | Testear movimiento en dispositivos móviles (Joystick virtual) | Mobile | CRÍTICA | ✅ |

---

## SEMANA 6: MULTIPLAYER SYNC BASICS

**Objetivo:** Ver a otros usuarios en el mismo espacio.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Levantar servidor Socket.io específico para Metaverse | Backend | CRÍTICA | ✅ |
| 2 | Definir esquema de paquete de datos (ID, Pos, Rot, State) | Backend | CRÍTICA | ✅ |
| 3 | Implementar handshake de conexión cliente-servidor | Network | CRÍTICA | ✅ |
| 4 | Enviar posición del jugador local al servidor (Throttle) | Network | CRÍTICA | ✅ |
| 5 | Recibir y renderizar "Remote Players" (cubos placeholder) | 3D | CRÍTICA | ✅ |
| 6 | Instanciar avatares reales para jugadores remotos | 3D | ALTA | ✅ |
| 7 | Implementar Interpolación de movimiento (eliminar lag) | Math | ALTA | ✅ |
| 8 | Sincronizar estados de animación (Idle/Walk) | Network | MEDIA | ✅ |
| 9 | Gestionar desconexión de jugadores (eliminar nodo) | Network | ALTA | ✅ |
| 10 | Implementar salas/instancias básicas (Room logic) | Backend | MEDIA | ✅ |
| 11 | Optimizar ancho de banda (Delta compression) | Network | ALTA | ✅ |
| 12 | Mostrar nombres de usuarios sobre la cabeza (HTML Overlay) | UI | MEDIA | ✅ |
| 13 | Test de estrés con 20 bots conectados | Testing | MEDIA | ✅ |
| 14 | Implementar límite de jugadores por sala | Backend | BAJA | ✅ |

---

## SEMANA 7: INTERACTIVE OBJECTS

**Objetivo:** Interactuar con el mundo (tocar, abrir, usar).

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Crear sistema de Interacción (Raycaster desde cámara) | 3D | CRÍTICA | ✅ |
| 2 | Implementar prompt visual "Presiona E para interactuar" | UI | ALTA | ✅ |
| 3 | Crear objeto "Puerta Automática" con animación | 3D | MEDIA | ✅ |
| 4 | Implementar objeto "Pizarra Informativa" | 3D | MEDIA | ✅ |
| 5 | Crear "Sillas Sentables" (Snap to position) | 3D | ALTA | ✅ |
| 6 | Implementar "Zonas de Teletransporte" | logic | MEDIA | ✅ |
| 7 | Crear sistema de inventario rápido (Hotbar) | UI | BAJA | ✅ |
| 8 | Implementar item pickup (monedas flotantes) | Logic | ALTA | ✅ |
| 9 | Sincronizar estado de objetos (puerta abierta/cerrada) | Network | CRÍTICA | ✅ |
| 10 | Crear feedback sonoro al interactuar | Audio | BAJA | ✅ |
| 11 | Implementar highlight de objetos al apuntar | Shader | MEDIA | ✅ |
| 12 | Crear NPC estático con diálogo simple text-box | Logic | MEDIA | ✅ |
| 13 | Implementar interacción táctil (Touch events) | Mobile | ALTA | ✅ |
| 14 | Escribir tests para el Raycasting system | Testing | BAJA | ✅ |

---

## SEMANA 8: UI IN 3D SPACE (DIEGETIC UI)

**Objetivo:** Interfaces que existen dentro del mundo 3D.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Implementar CSS3DRenderer para paneles web en 3D | 3D | CRÍTICA | ✅ |
| 2 | Crear panel de "Menú Principal" flotante tipo holograma | UI | ALTA | ✅ |
| 3 | Implementar navegador web incrustado (iframe en textura) | Tech | ALTA | ✅ |
| 4 | Crear burbujas de chat sobre los avatares | UI | CRÍTICA | ✅ |
| 5 | Implementar minimapa estilo radar | UI | MEDIA | ✅ |
| 6 | Crear notificaciones "Toast" in-world | UI | BAJA | ✅ |
| 7 | Diseñar e implementar HUD (Heads-Up Display) no intrusivo | UI | MEDIA | ✅ |
| 8 | Implementar etiquetas de objetos lejanos | UI | BAJA | ✅ |
| 9 | Crear sistema de emojis flotantes (reacciones) | UI | ALTA | ✅ |
| 10 | Optimizar rendimiento de CSS3D objects | 3D | MEDIA | ✅ |
| 11 | Implementar teclado virtual para VR (preparación) | VR | BAJA | ✅ |
| 12 | Crear tutorial de onboarding interactivo (flechas 3D) | Logic | ALTA | ✅ |
| 13 | Implementar cursor personalizado para interacciones | UI | BAJA | ✅ |
| 14 | Revisar accesibilidad de textos en 3D (contraste/tamaño) | A11y | MEDIA | ✅ |

---

## SEMANA 9: OPTIMIZATION & WEB PERFORMANCE

**Objetivo:** Asegurar 60 FPS en laptops de gama media.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Auditoría de Draw Calls y Geometría | Profiling | CRÍTICA | ✅ |
| 2 | Implementar Texture Atlasing para reducir materiales | 3D | ALTA | ✅ |
| 3 | Configurar Frustum Culling agresivo | 3D | CRÍTICA | ✅ |
| 4 | Implementar Object Pooling para proyectiles/efectos | Logic | ALTA | ✅ |
| 5 | Optimizar shaders (reducir complejidad) | 3D | MEDIA | ✅ |
| 6 | Configurar Web Worker para cálculos de física | Tech | ALTA | ✅ |
| 7 | Implementar Quality Settings (Low/Med/High) en UI | UI | MEDIA | ✅ |
| 8 | Reducir tamaño de bundle JS (Code splitting) | DevOps | ALTA | ✅ |
| 9 | Implementar carga diferida de assets lejanos | Logic | MEDIA | ✅ |
| 10 | Optimizar sombras (Baked vs Realtime mix) | 3D | MEDIA | ✅ |
| 11 | Comprimir audio (formato WebM/Ogg) | Audio | BAJA | ✅ |
| 12 | Testear en Chromebooks (target mínimo) | Testing | CRÍTICA | ✅ |
| 13 | Implementar fps throttler para ahorro de batería | Logic | BAJA | ✅ |
| 14 | Generar reporte final de performance | Docs | BAJA | ✅ |

---

## SEMANA 10: ALPHA RELEASE "GENESIS"

**Objetivo:** Primera versión jugable del Metaverso Educativo.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Integrar todas las ramas en `feat/metaverse-alpha` | Git | CRÍTICA | ✅ |
| 2 | Crear escena "Plaza de Bienvenida" pulida | 3D | ALTA | ✅ |
| 3 | Implementar flujo de Login con cuenta existente | Backend | CRÍTICA | ✅ |
| 4 | Configurar persistencia de posición del jugador | Backend | MEDIA | ✅ |
| 5 | Crear "Photo Mode" para capturas de pantalla | Feature | BAJA | ✅ |
| 6 | Implementar sistema de reporte de bugs in-game | Feature | MEDIA | ✅ |
| 7 | Realizar sesión de QA interna intensiva | Testing | CRÍTICA | ✅ |
| 8 | Corregir bugs críticos (bloqueantes) | Bugfix | CRÍTICA | ✅ |
| 9 | Desplegar servidor WebSocket en producción (Scaling) | DevOps | CRÍTICA | ✅ |
| 10 | Desplegar cliente WebGL en Vercel/Netlify | DevOps | CRÍTICA | ✅ |
| 11 | Crear trailer de lanzamiento interno (video captura) | Marketing | BAJA | ✅ |
| 12 | Escribir documentación de usuario "Cómo moverse" | Docs | MEDIA | ✅ |
| 13 | Habilitar acceso a grupo de testers "Pioneros" | Backend | MEDIA | ✅ |
| 14 | Celebración virtual del equipo en el Metaverso | Social | BAJA | ✅ |

---

## 🎉 FASE 1 COMPLETADA - 140/140 TAREAS (100%)

**Fecha de Finalización:** 15 de Enero de 2026

**Próximo archivo:** `PLAN_AÑO4_FASE2_SEM11-20.md` (Blockchain Fundamentals)
