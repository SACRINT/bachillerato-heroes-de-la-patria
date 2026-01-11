---
description: AI Orchestrator Implementation & Vertical Scaling
---

# 🚀 AI Orchestrator & Vertical Scaling Protocol

This workflow documents the consolidation of AI services into a single Orchestrator to reduce memory footprint and improve maintainability (Vertical Scaling).

## 1. Architecture Overview

**Before:**

- 15+ individual AI routes loaded in `server.js` (e.g. `ai-analytics`, `ai-tutor-alpha`, `mlops`).
- Memory usage bloat due to separate service instances.
- "Spaghetti" logic scattered across route files.

**After:**

- **Single Entry Point:** `/api/ai/v1/process` (via `ai-gateway.js`).
- **Orchestrator:** `AIService.js` dispatches requests to specialized services.
- **Service Layer:** Logic moved from routes to proper services (e.g. `PredictiveAnalyticsService.js`).
- **Reduced Footprint:** Expired/Duplicate routes commented out in `server.js`.

## 2. API Usage

### Endpoint

`POST /api/ai/v1/process`

### Headers

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

### Payloads

**1. Academic Risk Prediction:**

```json
{
  "intent": "ANALYTICS_PREDICT",
  "payload": {
    "type": "risk",
    "studentId": "123", // Optional if self-query
    "threshold": 7.0
  }
}
```

**2. Tutor Chat:**

```json
{
  "intent": "TUTOR_CHAT",
  "payload": {
    "message": "Explain quantum physics",
    "sessionId": 101,
    "subject": "Physics"
  }
}
```

**3. Anomalies Detection:**

```json
{
  "intent": "ANALYTICS_PREDICT",
  "payload": {
    "type": "anomalies",
    "category": "attendance" // or "grades", "all"
  }
}
```

## 3. Verification Steps

1. **Check Server Startup:**
   - Run `npm run dev` (or check logs).
   - Verify that the "Trampa de la IA" list of 15+ routes is NOT loading.
   - Verify `[SERVER] 🚀 Servidor backend iniciado` appears without memory warnings.

2. **Test AI Gateway:**
   - Send a POST request to `/api/ai/v1/process` with a valid intent.
   - Expect a 200 OK with `success: true` and the data from the underlying service.

## 4. Rollback Plan

If functionality is missing (e.g. Frontend explicitly calls `/api/ai/analytics`):

1. Open `backend/server.js`.
2. Uncomment the specific route required (e.g. `app.use('/api/ai/analytics', aiAnalyticsRoutes)`).
3. Ideally, update the Frontend to use the Gateway instead.
