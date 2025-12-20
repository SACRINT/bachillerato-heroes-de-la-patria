# Infraestructura Base y Nube (Fase 1)

**Objetivo:** Establecer una base sólida, segura y escalable para los servicios de IA, respetando las limitaciones actuales (Vercel).

## 1. Diagrama de Despliegue Híbrido

La arquitectura será "Vercel-Centric" pero apoyada por servicios especializados externos para lo que Serverless no puede hacer bien (Persistencia vectorial, almacenamiento de logs masivos).

* **Frontend & API Gateway:** Vercel (Next.js / Node.js Express).
* **Base de Datos Relacional:** Neon (PostgreSQL Serverless).
* **Base de Datos Vectorial:** Pinecone (Serverless) - *Región: us-east-1 (Baja latencia con Vercel).*
* **Almacenamiento de Archivos (Logs/Backups):** AWS S3 (Bucket Privado).
* **LLM Provider:** OpenAI API.

## 2. Configuración de Entornos

Para garantizar estabilidad, se establecen 3 entornos aislados:

| Entorno | Rama Git | Base de Datos | Pinecone Namespace | API Keys | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Development** | `feature/*` | `postgres_dev` | `ns-dev` | `sk-dev-...` | Pruebas unitarias, desarrollo local de devs. |
| **Staging** | `develop` | `postgres_staging` | `ns-staging` | `sk-stg-...` | QA, pruebas de integración, UAT con usuarios beta. |
| **Production** | `main` | `postgres_prod` | `ns-prod` | `sk-prod-...` | Entorno real. Solo Lecture/Write autorizada. |

## 3. Configuración de Red (Networking)

### Vercel Security

* **DDoS Protection:** Activado por defecto en Vercel.
* **Firewall:** Configurar para bloquear IPs de países no hispanohablantes (si el ataque viene de fuera) o Tor Exit Nodes (opcional).

### Conexión a Base de Datos

* **SSL/TLS:** Obligatorio. `sslmode=require` en el string de conexión de PostgreSQL.
* **Connection Pooling:** Usar `pg-bouncer` o el pooler nativo de Neon para evitar saturar conexiones con las lambdas.

## 4. Recursos Computacionales Estimados (Semana 4)

| Recurso | Nivel / Tier | Costo Estimado (Mensual) |
| :--- | :--- | :--- |
| **Vercel** | Pro | $20 USD/user |
| **OpenAI** | Pay-as-you-go | ~$50 USD (Variable según uso) |
| **Pinecone** | Starter (Free) -> Standard | $0 - $70 USD |
| **AWS S3** | Standard | < $5 USD (Logs) |
| **Total** | | **~$145 USD / mes** |
