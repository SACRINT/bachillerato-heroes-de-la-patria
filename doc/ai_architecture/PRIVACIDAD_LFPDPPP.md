# Privacidad y Cumplimiento Normativo (LFPDPPP)

**Contexto Legal:** México (Ley Federal de Protección de Datos Personales en Posesión de los Particulares).

## Principios Rectores para la IA

El "Proyecto Héroes" cumplirá rigurosamente con los 8 principios de la LFPDPPP: Licitud, Consentimiento, Información, Calidad, Finalidad, Lealtad, Proporcionalidad y Responsabilidad.

## Medidas Específicas para Módulos de IA

### 1. Principio de Información (Aviso de Privacidad)

* **Acción:** Actualizar el Aviso de Privacidad actual para **mencionar explícitamente el uso de Inteligencia Artificial**.
* **Texto Sugerido:** "Sus datos podrán ser procesados por sistemas automatizados de inteligencia artificial con la finalidad exclusiva de mejorar su experiencia educativa, brindar tutoría personalizada y detectar riesgos de deserción. En ningún caso estos datos serán vendidos a terceros ni usados para entrenamiento de modelos públicos sin su consentimiento explícito."

### 2. Principio de Proporcionalidad (Minimización de Datos)

* **Regla:** La IA solo tendrá acceso a los datos estrictamente necesarios.
* **Implementación:**
  * El Chatbot Administrativo NO necesita acceso a calificaciones.
  * El Tutor IA NO necesita acceso a datos socioeconómicos.
  * Se usarán **pseudónimos** (ID de usuario interno) en lugar de nombres reales al comunicarse con APIs externas (OpenAI).

### 3. Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)

* Los estudiantes/padres tienen derecho a **oponerse** a ser perfilados por la IA.
* Se implementará un "Opt-out" en la configuración de usuario: `[ ] Permitir análisis de IA para recomendaciones`.

### 4. Seguridad de la Información

* **Encriptación:** Todos los datos en tránsito (hacia OpenAI/Pinecone) viajan cifrados (TLS 1.2+).
* **Retención:** Los logs de conversaciones con el chatbot se anonimizarán automáticamente después de 30 días.

### 5. Ética y No Discriminación

* Se prohibe el uso de IA para tomar decisiones automáticas con impacto negativo significativo (ej. expulsión automática) sin revisión humana. La IA es una herramienta de **apoyo**, no un juez.

## Checklist de Cumplimiento (Semana 1)

- [ ] Redactar anexo de IA para el Aviso de Privacidad.
* [ ] Definir mapa de flujo de datos sensibles.
* [ ] Configurar acuerdos de confidencialidad (DPA) con proveedores (si aplica versiones Enterprise).
