# 📚 Documentación de Flujo de Trabajo MLOps

## Semana 11 - Tarea 8: Documentar flujo de trabajo de MLOps

**Fecha:** Diciembre 2025  
**Versión:** 1.0.0  
**Autor:** AI Architect Agent

---

## 1. Introducción

Este documento describe el flujo de trabajo de MLOps (Machine Learning Operations) implementado para el proyecto BGE Héroes de la Patria. El objetivo es establecer prácticas estandarizadas para el desarrollo, despliegue y monitoreo de modelos de IA.

---

## 2. Arquitectura MLOps

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA MLOPS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Desarrollo  │ -> │  Staging    │ -> │ Producción  │          │
│  │ (Local)     │    │ (Test)      │    │ (Vercel)    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                  │                  │                  │
│         v                  v                  v                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │            TRACKING DE EXPERIMENTOS              │            │
│  │  (Métricas, Parámetros, Artefactos)             │            │
│  └─────────────────────────────────────────────────┘            │
│                           │                                      │
│         ┌─────────────────┴─────────────────┐                   │
│         v                                   v                    │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │ Detección   │                     │ Alertas y   │            │
│  │ de Drift    │                     │ Notific.    │            │
│  └─────────────┘                     └─────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes del Sistema

### 3.1 Tracking de Experimentos

El sistema registra todos los experimentos de ML con:

- **ID único** del experimento
- **Parámetros** utilizados
- **Métricas** resultantes
- **Artefactos** generados
- **Estado** (running, completed, failed)

**Endpoint:** `POST /api/ai/mlops/experiments`

### 3.2 Detección de Drift

Monitorea cambios en el comportamiento del modelo:

- Tiempo de respuesta
- Tasa de error
- Uso de tokens

**Umbral de alerta:** 30% de desviación del baseline

**Endpoint:** `POST /api/ai/mlops/drift/detect`

### 3.3 Versionado Semántico

Formato: `vMAJOR.MINOR.PATCH`

- **MAJOR:** Cambios incompatibles
- **MINOR:** Nueva funcionalidad (backward compatible)
- **PATCH:** Correcciones de bugs

**Endpoint:** `GET /api/ai/mlops/version`

---

## 4. Flujos de Trabajo

### 4.1 Ciclo de Desarrollo de Prompts

```
1. Crear branch de feature
2. Modificar prompt
3. Ejecutar tests de NLP
4. Registrar cambio de versión
5. Deploy a staging
6. Validar métricas
7. Merge a main
8. Deploy a producción
```

### 4.2 Proceso de Re-indexado

**Frecuencia:** Semanal (Domingos 3 AM)

```
1. Suspender queries de escritura
2. Exportar documentos actualizados
3. Generar nuevos embeddings
4. Actualizar base vectorial
5. Validar integridad
6. Reanudar servicio
```

### 4.3 Respuesta a Drift

```
1. Alerta detectada
2. Analizar causa raíz
3. Si es crítico: rollback automático
4. Si es warning: notificar equipo
5. Documentar incidente
6. Ajustar baseline si es necesario
```

---

## 5. Programación de Tareas

| Tarea | Cron | Descripción |
|-------|------|-------------|
| Re-indexado | `0 3 * * 0` | Domingos 3 AM |
| Backup | `0 2 * * *` | Diario 2 AM |
| Drift Check | `0 */6 * * *` | Cada 6 horas |
| NLP Tests | `0 0 * * 1` | Lunes medianoche |

---

## 6. Endpoints de API

### 6.1 Experimentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai/mlops/experiments` | Crear experimento |
| GET | `/api/ai/mlops/experiments` | Listar experimentos |
| PATCH | `/api/ai/mlops/experiments/:id` | Actualizar |

### 6.2 Drift y Baseline

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai/mlops/drift/detect` | Detectar drift |
| POST | `/api/ai/mlops/baseline/:model` | Actualizar baseline |

### 6.3 Operaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai/mlops/reindex` | Trigger re-indexado |
| POST | `/api/ai/mlops/backup/vector-db` | Backup manual |
| GET | `/api/ai/mlops/tests/nlp` | Ejecutar tests |

### 6.4 Auditoría

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ai/mlops/audit/full` | Auditoría completa |
| GET | `/api/ai/mlops/audit/credentials` | Verificar credenciales |
| GET | `/api/ai/mlops/alerts` | Ver alertas activas |

---

## 7. Métricas Monitoreadas

### 7.1 Métricas de Rendimiento

- **Latencia promedio:** < 1000ms (alerta > 5000ms)
- **Tasa de error:** < 2% (alerta > 10%)
- **Throughput:** requests/segundo
- **Tokens por request:** promedio y max

### 7.2 Métricas de Calidad

- **Precisión de intención:** % aciertos
- **Satisfacción de usuario:** thumbs up/down
- **Tasa de escalamiento:** % consultas a humano

---

## 8. Procedimientos de Emergencia

### 8.1 Rollback de Modelo

```bash
# 1. Identificar versión estable
GET /api/ai/mlops/version

# 2. Revertir a versión anterior
# (Manual: editar prompts y redesplegar)

# 3. Verificar recuperación
GET /api/ai/mlops/health
```

### 8.2 Falla de Base Vectorial

```bash
# 1. Verificar estado
GET /api/ai/mlops/health

# 2. Restaurar desde backup
# (Manual: usar último backup)

# 3. Re-indexar si es necesario
POST /api/ai/mlops/reindex
```

---

## 9. Buenas Prácticas

1. **Versionado:** Siempre versionar cambios en prompts
2. **Testing:** Ejecutar tests antes de cada deploy
3. **Monitoreo:** Revisar métricas post-deploy
4. **Documentación:** Registrar experimentos significativos
5. **Backups:** Verificar backups semanalmente
6. **Alertas:** No ignorar alertas de drift
7. **Credenciales:** Rotar cada 90 días

---

## 10. Contactos y Escalamiento

| Nivel | Tiempo | Acción |
|-------|--------|--------|
| L1 | 0-15 min | Dashboard automático |
| L2 | 15-60 min | Notificación a equipo técnico |
| L3 | > 60 min | Escalamiento a arquitecto IA |

---

**Documento creado como parte de la Semana 11: MLOps Básico y Automatización**
