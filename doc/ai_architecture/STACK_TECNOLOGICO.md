# Stack Tecnológico de IA (Selección Semana 1)

Dada la infraestructura actual (Vercel Node.js) y los objetivos del proyecto, se selecciona la siguiente arquitectura tecnológica:

## 1. Modelos de Lenguaje (LLMs)

* **Proveedor Principal:** **OpenAI API** (GPT-4o mini y GPT-3.5 Turbo).
  * *Razón:* Mejor relación costo/calidad/latencia para español y tareas educativas.
  * *Implementación:* Vía SDK oficial de Node.js.
* **Alternativa (Fallback):** Anthropic Claude 3 Haiku (vía API).

## 2. Base de Datos Vectorial (Memoria a Largo Plazo)

* **Tecnología:** **Pinecone** (Serverless).
  * *Razón:* Capa gratuita generosa, latencia baja, integración nativa con Vercel y LangChain. No requiere mantenimiento de servidor.
* **Uso:** Almacenamiento de embeddings de reglamentos, libros de texto y FAQs para RAG.

## 3. Orquestación y Framework

* **Framework:** **LangChain.js**.
  * *Razón:* Estándar de la industria, facilita la integración de RAG, memoria y switch de modelos.
* **Validación de Datos:** **Zod** (para Structured Output).

## 4. Pipeline de Datos (ETL)

* **Ingesta:** Scripts Node.js ejecutados como Cron Jobs (Vercel Cron).
* **Embeddings:** `text-embedding-3-small` (OpenAI). Eficiente y barato.
* **Document Parsing:** `pdf-parse` (ligero) para leer documentos PDF institucionales.

## 5. Frontend & UI

* **Chat Widget:** Componente personalizado en JS Vanilla/HTML (ya existente en `chatbot.js`, se actualizará para soportar streaming).
* **Dashboards:** Chart.js (ya en uso) conectado a endpoints de analítica.

## 6. Entorno de Desarrollo (Sandbox)

* **Prototipado Rápido:** Jupyter Lab (local) o Google Colab para los Data Scientists (validación de datos).
* **Pruebas de Integración:** Vercel Preview Environments.
