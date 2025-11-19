# QUICK START - ARQUITECTO IA BGE

**Tiempo de lectura:** 5 minutos
**Tiempo de setup:** 10 minutos

---

## 1. DOCUMENTOS A LEER (En Orden)

| # | Documento | Ubicación | Propósito |
|---|-----------|-----------|-----------|
| 1 | ARQUITECTO_PLAN_24_SEMANAS_AUTONOMO.md | `docs/` | Plan maestro completo |
| 2 | MASTER-CHECKLIST-BGE-2025.md | Raíz | Estado actual y tareas |
| 3 | PLAN_TRABAJO_ARQUITECTO_SEMANAS_13-24.md | Raíz | Detalle semanas 13-24 |
| 4 | historia_del_proyecto.md | `docs/` | Contexto histórico |

---

## 2. SETUP INICIAL (10 minutos)

### Paso 1: Clonar Repositorio
```bash
git clone https://github.com/SACRINT/bachillerato-heroes-de-la-patria.git
cd bachillerato-heroes-de-la-patria
```

### Paso 2: Crear Rama de Desarrollo
```bash
git checkout -b feature/24-week-autonomous-development
```

### Paso 3: Instalar Dependencias
```bash
npm install
```

### Paso 4: Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con credenciales de Neon DB
```

### Paso 5: Verificar Backend
```bash
node backend/server.js
# Debe mostrar: "Servidor corriendo en puerto 3000"
```

### Paso 6: Verificar Tests
```bash
npm test
# Debe pasar tests existentes
```

---

## 3. WORKFLOW DE GITHUB

### Commits Diarios
```bash
git add .
git commit -m "feat(scope): description"
git push -u origin feature/24-week-autonomous-development
```

### Pull Requests (Fin de Fase)
Crear PR al final de cada fase (semanas 4, 8, 12, 16, 20, 24):

```bash
# En GitHub o con gh CLI
gh pr create --title "FASE X: Descripción" --body "## Resumen\n- Item 1\n- Item 2"
```

### Formato de PR
```markdown
## Resumen
[Descripción de la fase completada]

## Cambios Principales
- [ ] Feature 1
- [ ] Feature 2

## Tests
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Coverage > 50%

## Documentación
- [ ] CHANGELOG actualizado
- [ ] Docs actualizados
```

---

## 4. ESTRUCTURA DEL PROYECTO

```
bachillerato-heroes-de-la-patria/
├── api/                    # Vercel serverless functions
├── backend/
│   ├── config/             # Configuraciones
│   ├── data/               # DAL (database-access.js)
│   ├── middleware/         # Express middlewares
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   ├── seeds/              # SQL seeds
│   ├── services/           # Business logic (crear)
│   └── tests/              # Jest tests (crear)
├── docs/                   # Documentación
├── public/
│   ├── css/                # Estilos
│   ├── js/                 # Frontend scripts
│   └── *.html              # Páginas
└── no_usados/              # Código archivado
```

---

## 5. COMANDOS ÚTILES

```bash
# Backend
node backend/server.js              # Iniciar servidor
npm test                            # Ejecutar tests
npm run test:coverage               # Tests con coverage

# Git
git status                          # Ver cambios
git diff                            # Ver diferencias
git log --oneline -10               # Últimos commits

# Base de datos
node backend/scripts/run-migrations.js  # Ejecutar migraciones

# Verificación
node -c backend/routes/admin.js     # Verificar sintaxis JS
```

---

## 6. CONVENCIONES

### Commits
```
feat(scope): Nueva funcionalidad
fix(scope): Corrección de bug
refactor(scope): Refactorización
test(scope): Tests
docs(scope): Documentación
perf(scope): Performance
security(scope): Seguridad
```

### Archivos
- **Services:** `backend/services/{entity}-service.js`
- **Tests:** `backend/tests/unit/{entity}.test.js`
- **Migrations:** `backend/migrations/{number}-{description}.sql`

### Código
- Español para comentarios
- camelCase para variables/funciones
- PascalCase para clases
- SCREAMING_SNAKE para constantes

---

## 7. PRIMERA TAREA

### SEMANA 1, TAREA 1.1: Índices de Rendimiento

```bash
# 1. Crear archivo de migración
touch backend/migrations/003-performance-indexes.sql

# 2. Escribir índices SQL
# (Ver ARQUITECTO_PLAN_24_SEMANAS_AUTONOMO.md)

# 3. Ejecutar en Neon Console
# Copiar SQL y ejecutar

# 4. Verificar mejora
# Usar EXPLAIN ANALYZE en queries

# 5. Commit
git add .
git commit -m "perf(db): Add performance indexes to PostgreSQL"
git push -u origin feature/24-week-autonomous-development
```

---

## 8. CONTACTO Y RECURSOS

### Recursos del Proyecto
- **Repositorio:** github.com/SACRINT/bachillerato-heroes-de-la-patria
- **Base de Datos:** Neon PostgreSQL
- **Hosting:** Vercel

### Documentación Clave
- CLAUDE.md - Instrucciones para Claude
- CHANGELOG.md - Historial de cambios
- MASTER-CHECKLIST-BGE-2025.md - Estado actual

---

## 9. CHECKLIST PRE-INICIO

- [ ] Repositorio clonado
- [ ] Rama creada
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Backend iniciando correctamente
- [ ] Documentos maestros leídos
- [ ] Primera tarea identificada

---

**Estado:** LISTO PARA COMENZAR

**Próxima acción:** Ejecutar SEMANA 1, TAREA 1.1

---

**Generado por:** Claude Code
**Fecha:** 19 Noviembre 2025
