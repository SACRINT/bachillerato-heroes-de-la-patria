# 🔍 ADVANCED SEARCH - SEMANA 6

**Fecha:** 17 Noviembre 2025
**Versión:** v1.0.0
**Estado:** ✅ COMPLETADO

---

## RESUMEN EJECUTIVO

Sistema de búsqueda avanzada implementado con PostgreSQL Full-Text Search (sin necesidad de Elasticsearch). Ofrece búsquedas rápidas (<200ms), filtros complejos, y analytics completo.

### Características Implementadas

✅ **Full-Text Search con PostgreSQL:**
- ts_vector/ts_query para búsqueda eficiente
- Ranking por relevancia (ts_rank)
- Support para español

✅ **Filtros Avanzados:**
- AND/OR operators
- Date ranges (from/to)
- Custom filters por tabla
- Paginación (limit/offset)

✅ **Search Analytics:**
- Tracking automático de búsquedas
- Top search terms
- Performance metrics
- Admin-only endpoints

✅ **Autocomplete/Suggestions:**
- Prefix search optimizado
- Multi-table suggestions
- Debounce-friendly

✅ **Multi-Table Search:**
- estudiantes, docentes (usuarios table)
- noticias, eventos, avisos, comunicados
- egresados

---

## API ENDPOINTS

### 1. GET /api/search/advanced

Búsqueda avanzada con filtros.

**Query Params:**
- `q` (required): Término de búsqueda
- `tables` (optional): Tablas separadas por coma (ej: "estudiantes,noticias")
- `operator` (optional): 'AND' o 'OR' (default: 'AND')
- `dateFrom` (optional): Fecha desde (ISO 8601)
- `dateTo` (optional): Fecha hasta (ISO 8601)
- `limit` (optional): Límite de resultados (default: 20)
- `offset` (optional): Offset para paginación (default: 0)
- `filters` (optional): JSON string con filtros adicionales

**Ejemplo:**
```
GET /api/search/advanced?q=matemáticas&tables=estudiantes,noticias&operator=OR&limit=10
```

**Response:**
```json
{
  "success": true,
  "query": "matemáticas",
  "results": {
    "estudiantes": [...],
    "noticias": [...]
  },
  "total": 15,
  "took": 45
}
```

### 2. GET /api/search/suggestions

Autocomplete/sugerencias.

**Query Params:**
- `q` (required): Texto parcial
- `tables` (optional): Tablas a buscar
- `limit` (optional): Máximo de sugerencias (default: 10)

**Ejemplo:**
```
GET /api/search/suggestions?q=mat&limit=5
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    { "suggestion": "Matemáticas Avanzadas", "type": "noticia" },
    { "suggestion": "Matías González", "type": "estudiante" }
  ]
}
```

### 3. GET /api/search/analytics/top-terms (Admin only)

Obtener términos más buscados.

**Auth:** JWT required (admin role)

**Query Params:**
- `limit` (optional): Número de términos (default: 10)
- `dateFrom` (optional): Fecha desde
- `dateTo` (optional): Fecha hasta

**Response:**
```json
{
  "success": true,
  "topTerms": [
    {
      "query": "calificaciones",
      "searchCount": 150,
      "avgResults": "12.5",
      "avgTimeMs": "35.20",
      "lastSearched": "2025-11-17T10:30:00Z"
    }
  ]
}
```

### 4. GET /api/search/analytics/summary (Admin only)

Resumen de analytics.

**Auth:** JWT required (admin role)

**Response:**
```json
{
  "success": true,
  "totalSearches": 1250,
  "uniqueQueries": 350,
  "avgResultsPerSearch": "8.5",
  "avgSearchTimeMs": "45.30",
  "maxSearchTimeMs": "180.00",
  "minSearchTimeMs": "12.00"
}
```

---

## CONFIGURACIÓN

### Migración SQL

Ejecutar en Neon Console:
```sql
-- backend/scripts/create-search-analytics-table.sql
CREATE TABLE search_analytics (...);
```

### Tablas Searchables

Configuradas en `backend/services/search-service.js`:
- estudiantes, docentes (tabla usuarios)
- noticias, eventos, avisos, comunicados
- egresados

---

## PERFORMANCE

### Benchmarks Estimados

| Operación | Tiempo Esperado |
|-----------|-----------------|
| Simple search | < 50ms |
| Advanced search (1 tabla) | < 100ms |
| Advanced search (todas) | < 200ms |
| Suggestions | < 30ms |

### Optimizaciones Implementadas

✅ Queries paralelas con Promise.all()
✅ PostgreSQL Full-Text Search (ts_vector)
✅ Índices en columnas searchables
✅ Limit/offset para paginación
✅ Ranking por relevancia

---

## PRÓXIMOS PASOS

**SEMANA 7:**
- Analytics dashboard visualizando top terms
- Gráficas de búsquedas por día/hora
- Export de analytics a Excel

**Futuro:**
- Frontend component (advanced-search.js)
- Elasticsearch migration (si >100k registros)
- Voice search
- Image search (OCR)

---

**FIN DE SEMANA 6**
