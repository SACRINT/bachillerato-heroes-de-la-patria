# 🏫 AÑO 4 - FASE 3: VIRTUAL CAMPUS (Semanas 21-30)

## Plan de Trabajo Año 4 - Héroes del Metaverso

---

## SEMANA 21: CAMPUS ARCHITECTURE

**Objetivo:** Diseñar el plano maestro del campus virtual.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Definir layout del Campus (Mapa 2D) | Design | CRÍTICA | ✅ |
| 2 | Crear modelos "Whitebox" de edificios principales | 3D | CRÍTICA | ✅ |
| 3 | Implementar sistema de zonas de carga (Sectorización) | 3D | ALTA | ✅ |
| 4 | Diseñar Plaza Central (Spawn Point) | 3D | ALTA | ✅ |
| 5 | Crear caminos y senderos con navegación (NavMesh preliminar) | 3D | MEDIA | ✅ |
| 6 | Definir paleta de texturas y materiales "Institucional" | Art | MEDIA | ✅ |
| 7 | Implementar límites geográficos naturales (Montañas/Agua) | 3D | BAJA | ✅ |
| 8 | Configurar puntos de interés (POIs) para teletransporte | Logic | MEDIA | ✅ |
| 9 | Crear props urbanos (Bancos, Farolas, Papeleras) | 3D | BAJA | ✅ |
| 10 | Implementar sistema de señalética 3D (Carteles) | 3D | MEDIA | ✅ |
| 11 | Optimizar polígonos de estructuras grandes | 3D | ALTA | ✅ |
| 12 | Revisar escala y proporciones con respecto al avatar | UX | CRÍTICA | ✅ |
| 13 | Crear bocetos conceptuales de interiores | Art | BAJA | ✅ |
| 14 | Aprobar diseño arquitectónico final | Mgmt | ALTA | ✅ |

---

## SEMANA 22: HALL OF KNOWLEDGE (BIBLIOTECA)

**Objetivo:** Construir el edificio central de conocimiento.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Modelar exterior de la Biblioteca (Alta calidad) | 3D | ALTA | ✅ |
| 2 | Diseñar interior: Lobby y estanterías | 3D | ALTA | ✅ |
| 3 | Implementar sistema de "Libros Interactivos" | Logic | CRÍTICA | ✅ |
| 4 | Conectar libros 3D con PDFs/Recursos del backend existente | Backend | CRÍTICA | ✅ |
| 5 | Crear zona de lectura silenciosa (Audio zone) | Audio | MEDIA | ✅ |
| 6 | Implementar iluminación interior bakeada | 3D | MEDIA | ✅ |
| 7 | Crear NPCs bibliotecarios (IA básica) | Logic | BAJA | ✅ |
| 8 | Implementar búsqueda de libros mediante UI 3D | UI | ALTA | ✅ |
| 9 | Configurar colisiones complejas de estanterías | Physics | MEDIA | ✅ |
| 10 | Crear animación de apertura de libro | Anim | BAJA | ✅ |
| 11 | Implementar mesas de estudio colaborativo | Logic | MEDIA | ✅ |
| 12 | Optimizar texturas de libros (Atlas único) | 3D | ALTA | ✅ |
| 13 | Añadir detalles ambientales (Polvo, rayos de luz) | FX | BAJA | ✅ |
| 14 | Testear navegación interior con múltiples usuarios | Testing | ALTA | ✅ |

---

## SEMANA 23: MULTIPLAYER SYNC ADVANCED

**Objetivo:** Sincronización de estado perfecta.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Migrar a arquitectura autoritativa (Server-side validation básica) | Backend | CRÍTICA | ✅ |
| 2 | Implementar Snapshot Interpolation para movimiento | Network | CRÍTICA | ✅ |
| 3 | Sincronizar rotación de cabeza/mirada (LookAt) | 3D | MEDIA | ✅ |
| 4 | Crear sistema de gestos sincronizados (Saludar, Bailar) | Anim | ALTA | ✅ |
| 5 | Implementar "Chat Bubbles" visibles para todos | UI | ALTA | ✅ |
| 6 | Optimizar frecuencia de actualización según distancia | Network | ALTA | ✅ |
| 7 | Sincronizar equipamiento del avatar (Visualizar NFTs de otros) | Blockchain | CRÍTICA | ✅ |
| 8 | Implementar lógica de grupos (Party system) | Logic | MEDIA | ✅ |
| 9 | Crear indicador de "Escribiendo..." 3D | UI | BAJA | ✅ |
| 10 | Manejar casos de latencia alta (Lag compensation) | Network | ALTA | ✅ |
| 11 | Implementar sistema de bloqueo/muteo de usuarios | Trust | CRÍTICA | ✅ |
| 12 | Sincronizar eventos de entorno (Día/Noche igual para todos) | Network | MEDIA | ✅ |
| 13 | Test de escalabilidad (50 usuarios en una sala) | Testing | CRÍTICA | ✅ |
| 14 | Monitorización de ancho de banda del servidor | DevOps | MEDIA | ✅ |

---

## SEMANA 24: SPATIAL AUDIO SYSTEM

**Objetivo:** Comunicación por voz inmersiva.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Integrar WebRTC / Agora / Twilio Voice SDK | Audio | CRÍTICA | ✅ |
| 2 | Configurar audio posicional 3D (Panning + Attenuation) | 3D | CRÍTICA | ✅ |
| 3 | Implementar "Voice Zones" (Global, Local, Privado) | Logic | ALTA | ✅ |
| 4 | Crear UI de controles de micrófono (Mute, Vol) | UI | ALTA | ✅ |
| 5 | Implementar visualizador de voz (Ondas sobre avatar) | UI | MEDIA | ✅ |
| 6 | Configurar permisos de navegador para micrófono | Frontend | CRÍTICA | ✅ |
| 7 | Implementar reducción de ruido y eco | Audio | ALTA | ✅ |
| 8 | Crear efectos de reverb según entorno (Cueva vs Aire libre) | Audio | BAJA | ✅ |
| 9 | Implementar sistema de "Megáfono" para profesores | Logic | MEDIA | ✅ |
| 10 | Gestionar reconexión automática de voz | Network | ALTA | ✅ |
| 11 | Añadir sonidos de pasos (Footsteps) sincronizados | Audio | BAJA | ✅ |
| 12 | Implementar radio/música ambiental en zonas sociales | Audio | MEDIA | ✅ |
| 13 | Testear audio espacial con auriculares | Testing | ALTA | ✅ |
| 14 | Documentar normas de etiqueta de voz | Docs | BAJA | ✅ |

---

## SEMANA 25: CLASSROOM INSTANCES

**Objetivo:** Espacios de clase privados y focalizados.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Diseñar modelo de "Aula Estándar" | 3D | ALTA | ✅ |
| 2 | Implementar sistema de Instancias Privadas al cruzar puerta | Backend | CRÍTICA | ✅ |
| 3 | Crear lógica de "Asientos Asignados" | Logic | MEDIA | ✅ |
| 4 | Implementar "Teacher Podium" con controles especiales | Logic | ALTA | ✅ |
| 5 | Crear proyector de diapositivas sincronizado | Logic | CRÍTICA | ✅ |
| 6 | Implementar "Levantar la mano" (Animación + Notificación) | Logic | ALTA | ✅ |
| 7 | Configurar zona de silencio automático (excepto profesor) | Logic | MEDIA | ✅ |
| 8 | Crear puerta de salida al Campus principal | 3D | MEDIA | ✅ |
| 9 | Implementar personalización de aula (Decoración por materia) | 3D | BAJA | ✅ |
| 10 | Sincronizar estado de la "Clase" (En sesión / Receso) | Backend | ALTA | ✅ |
| 11 | Implementar lista de asistencia automática al entrar | Backend | ALTA | ✅ |
| 12 | Crear assets específicos (Microscopios, Mapas) | 3D | BAJA | ✅ |
| 13 | Optimizar carga de instancias dinámica | Frontend | ALTA | ✅ |
| 14 | Testear clase completa con 30 alumnos | Testing | CRÍTICA | ✅ |

---

## SEMANA 26: INTERACTIVE WHITEBOARDS

**Objetivo:** Pizarras funcionales en 3D.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Integrar librería de dibujo 2D en textura Canvas | Frontend | CRÍTICA | ✅ |
| 2 | Mapear textura Canvas a objeto 3D Pizarra | 3D | CRÍTICA | ✅ |
| 3 | Sincronizar trazos de dibujo en tiempo real | Network | CRÍTICA | ✅ |
| 4 | Implementar herramientas (Lápiz, Borrador, Color) | UI | ALTA | ✅ |
| 5 | Crear puntero láser para señalar | Logic | MEDIA | ✅ |
| 6 | Permitir guardar contenido de pizarra como imagen | Feature | MEDIA | ✅ |
| 7 | Implementar permisos de dibujo (Solo Profe / Todos) | Security | ALTA | ✅ |
| 8 | Optimizar transmisión de datos de dibujo (Puntos vs Imagen) | Network | ALTA | ✅ |
| 9 | Crear interfaz flotante de herramientas de pizarra | UI | MEDIA | ✅ |
| 10 | Implementar pizarra infinita (Scroll/Zoom) | Feature | BAJA | ✅ |
| 11 | Soportar pegado de imágenes en la pizarra | Feature | MEDIA | ✅ |
| 12 | Crear animación de avatar "Escribiendo en pizarra" | Anim | BAJA | ✅ |
| 13 | Limpiar pizarra con animación de borrado | FX | BAJA | ✅ |
| 14 | Escribir tests de latencia de dibujo | Testing | ALTA | ✅ |

---

## SEMANA 27: NPC & AI TUTORS (BASIC)

**Objetivo:** Poblar el mundo con agentes útiles.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Implementar sistema de NPCs genérico | Logic | CRÍTICA | ✅ |
| 2 | Integrar API de IA (OpenAI/Anthropic) en backend | AIPart | CRÍTICA | ✅ |
| 3 | Crear NPC "Guía del Campus" (Responde preguntas simples) | AI | ALTA | ✅ |
| 4 | Implementar navegación de NPCs (Patrulla/Walk) | AI | MEDIA | ✅ |
| 5 | Crear interfaz de diálogo conversacional | UI | ALTA | ✅ |
| 6 | Implementar "Atención visual" (NPC mira al jugador) | 3D | BAJA | ✅ |
| 7 | Configurar prompt engineering para personalidades | AI | MEDIA | ✅ |
| 8 | Implementar caché de respuestas para ahorro de tokens | Backend | ALTA | ✅ |
| 9 | Crear NPCs decorativos (Estudiantes de fondo) | Logic | BAJA | ✅ |
| 10 | Sincronizar posición de NPCs entre clientes | Network | MEDIA | ✅ |
| 11 | Implementar detección de spam/abuso en chat con IA | Security | ALTA | ✅ |
| 12 | Crear misiones simples dadas por NPCs ("Busca el libro X") | Gamification| MEDIA | ✅ |
| 13 | Optimizar costo de API calls | Finance | ALTA | ✅ |
| 14 | Testear consistencia de las respuestas de IA | QA | MEDIA | ✅ |

---

## SEMANA 28: GAMING AREA (RECESS)

**Objetivo:** Espacio de ocio y socialización.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Diseñar zona de "Patio de Recreo" | 3D | ALTA | ✅ |
| 2 | Implementar física de balón (Fútbol/Basket simple) | Physics | MEDIA | ✅ |
| 3 | Crear minijuego "Parkour" (Plataformas) | Game | MEDIA | ✅ |
| 4 | Implementar sistema de puntuación local instanciada | Logic | MEDIA | ✅ |
| 5 | Crear "Zona Chill" con música lo-fi | Audio | BAJA | ✅ |
| 6 | Implementar juego de Ajedrez 3D interactivo | Game | ALTA | ✅ |
| 7 | Crear Leaderboard holográfico en el patio | UI | MEDIA | ✅ |
| 8 | Sincronizar estado de juegos físicos | Network | CRÍTICA | ✅ |
| 9 | Implementar recompensas por ganar minijuegos (XP) | Gamification| ALTA | ✅ |
| 10 | Crear zona de "Exposición de Arte" (Student Gallery) | Feature | MEDIA | ✅ |
| 11 | Añadir máquinas expendedoras interactivas (Consumibles) | Logic | BAJA | ✅ |
| 12 | Implementar sistema de espectadores | Logic | BAJA | ✅ |
| 13 | Optimizar físicas de colisión de juegos | Physics | ALTA | ✅ |
| 14 | Testear diversión y jugabilidad | QA | ALTA | ✅ |

---

## SEMANA 29: OPTIMIZATION ROUND 2 (GRAPHICS)

**Objetivo:** Pulido visual y rendimiento.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Implementar Occlusion Culling avanzado | 3D | CRÍTICA | ✅ |
| 2 | Optimizar Draw Calls (Merge Geometries) | 3D | ALTA | ✅ |
| 3 | Configurar compresión de texturas GPU (KTX2) pipeline final | DevOps | ALTA | ✅ |
| 4 | Implementar Dynamic Resolution Scaling | Frontend | MEDIA | ✅ |
| 5 | Optimizar shaders de agua y vegetación | 3D | MEDIA | ✅ |
| 6 | Refinar sistema de LODs para todos los objetos | 3D | ALTA | ✅ |
| 7 | Implementar Shadows Baking automáticos (Lightmaps) | 3D | ALTA | ✅ |
| 8 | Reducir uso de memoria RAM/VRAM | Profiling | CRÍTICA | ✅ |
| 9 | Diagnosticar y arreglar Memory Leaks | Bugfix | CRÍTICA | ✅ |
| 10 | Mejorar Antialiasing (SMAA/FXAA) | 3D | BAJA | ✅ |
| 11 | Implementar opciones gráficas granulares en UI | UI | MEDIA | ✅ |
| 12 | Testear rendimiento en iPad/Tablets | Testing | ALTA | ✅ |
| 13 | Optimizar carga de assets de audio | Audio | BAJA | ✅ |
| 14 | Comparativa de FPS Antes/Después | Docs | BAJA | ✅ |

---

## SEMANA 30: OPEN CAMPUS BETA

**Objetivo:** Abrir las puertas del mundo virtual.

| # | Tarea | Tipo | Prioridad | Estado |
|---|-------|------|-----------|--------|
| 1 | Desplegar versión "Open Campus" a producción | DevOps | CRÍTICA | ✅ |
| 2 | Organizar evento de inauguración virtual | Event | ALTA | ✅ |
| 3 | Implementar sistema de Analytics de movimiento (Heatmaps) | Analytics | MEDIA | ✅ |
| 4 | Configurar servidores escalables (Auto-scaling groups) | Infra | CRÍTICA | ✅ |
| 5 | Crear video tour promocional del Campus | Marketing | BAJA | ✅ |
| 6 | Monitorizar estabilidad de WebSocket masivo | Ops | CRÍTICA | ✅ |
| 7 | Recopilar feedback de navegación y UX 3D | Research | ALTA | ✅ |
| 8 | Implementar encuesta in-game sobre experiencia | UI | MEDIA | ✅ |
| 9 | Corregir bugs de colisión reportados | Bugfix | ALTA | ✅ |
| 10 | Ajustar volumen de audio espacial según feedback | Audio | MEDIA | ✅ |
| 11 | Verificar integración con Blockchain (Wallet Login en 3D) | Web3 | CRÍTICA | ✅ |
| 12 | Planificar expansión de mapa (Nuevos edificios) | Design | BAJA | ✅ |
| 13 | Celebrar con fuegos artificiales virtuales | FX | BAJA | ✅ |
| 14 | Documentar lecciones aprendidas de la Beta | Docs | MEDIA | ✅ |

---

## 🎉 FASE 3 COMPLETADA - 140/140 TAREAS (100%)

**Fecha de Finalización:** 16 de Enero de 2026

**Próximo archivo:** `PLAN_AÑO4_FASE4_SEM31-40.md` (DeFi Economy)
