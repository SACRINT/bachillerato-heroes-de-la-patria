# Contexto de la Tarea Actual

## Objetivo Principal

Completar el Sistema de Credenciales de Padres y resolver errores 500 restantes en el Dashboard.

## Estado Actual

- **Limpieza Arquitectónica:** Completada (Fases 1 y 2). Se eliminaron archivos legacy y duplicados.
- **Portal de Padres:** Frontend integrado con API real (`parent-portal.js`).
- **Dashboard Admin:** Consolidado en `admin-dashboard.js`.

## Próximos Pasos (Prioridad 1)

1. **Backend Credenciales:** Implementar el endpoint `POST /api/parents/credentials/generate` (controlador y rutas).
    - Verificar si existe la tabla `padres_credenciales` o similar.
    - Implementar lógica de generación de password temporal.
2. **Frontend Credenciales:** Verificar `admin-parent-credentials.js` y conectarlo al nuevo endpoint.
3. **Debug 500 Errors:** Investigar logs para `/api/avisos/stats` y subscriber growth chart.

## Notas Técnicas

- El proyecto usa arquitectura modular en frontend (`js/modules/`).
- `APIClient` en `js/api-client.js` es la fuente de verdad para peticiones.
- Autenticación manejada por token en `localStorage` (`heroes_auth_token` o `bge_auth_token`).
