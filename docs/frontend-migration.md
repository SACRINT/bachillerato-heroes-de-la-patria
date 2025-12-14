
# Frontend Migration to TypeScript

**Last Updated:** December 14, 2025

## Overview

This document tracks the migration of legacy JavaScript files (`public/js/*.js`) to a modern TypeScript architecture (`src/**/*.ts`).

## Status

- **App Core**: `HeroesPatriaApp` (migrated from `script.js`)
- **Tenant Config**: `TenantUpdater` (migrated from `tenant-auto-updater.js` / `main.js`)
- **Legacy Support**: `LegacyLoader`, `polyfills.ts`, `legacy-overrides.css`

## Migrated Files

| Legacy File | New Location | Status | Notes |
|---|---|---|---|
| `public/js/script.js` | `src/core/heroes-app.ts` | ✅ Migrated | Moved to `_legacy/script.js` |
| `public/js/main.js` | `src/core/tenant-updater.ts`, `src/core/legacy-loader.ts` | ✅ Migrated | Moved to `_legacy/main.js` |

## Updated Pages

The following pages now use the new `dist/assets/main.js` bundle instead of legacy scripts:

1. `index.html`
2. `admin-dashboard.html`
3. `estudiantes.html`
4. `docentes.html`
5. `padres.html`
6. `citas.html`
7. `calificaciones.html`
8. `calendario.html`
9. `bolsa-trabajo.html`
10. `oferta-educativa.html`
11. `conocenos.html`

## Build System

- **Bundler**: Vite + TypeScript
- **Output**: `public/dist/assets/main.js` & `main.css`
- **Command**: `npm run build:frontend`

## Next Steps

1. Monitor for any regressions in production.
2. Continue migrating other specific feature scripts (e.g., `chatbot.js`, `appointments.js`) to TypeScript modules.
3. Remove legacy files from `_legacy` once stability is confirmed.
