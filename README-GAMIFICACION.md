# 🎮 Sistema de Gamificación IACoins

Sistema completo de gamificación educativa con monedas virtuales (IACoins), retos académicos y tienda virtual.

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar migración de base de datos
node backend/scripts/run-gamification-migration.js

# Iniciar servidor
npm run dev
```

### 2. Testing

```bash
# Ejecutar suite de tests automatizados
node backend/scripts/test-gamification-endpoints.js

# Con autenticación (opcional)
export TEST_AUTH_TOKEN="tu_token"
node backend/scripts/test-gamification-endpoints.js
```

### 3. Acceder al Sistema

- **Dashboard:** http://localhost:3000/gamification-center.html
- **Tienda:** http://localhost:3000/iacoins-store.html
- **Retos:** http://localhost:3000/challenges.html

## 📊 Componentes

### Frontend (3 páginas)
- `gamification-center.html` - Dashboard principal
- `iacoins-store.html` - Tienda virtual
- `challenges.html` - Sistema de retos

### Backend (14 endpoints)
- **Wallet:** 5 endpoints (saldo, historial, ganar, gastar, comprar)
- **Challenges:** 4 endpoints (listar, detalles, completar, crear)
- **Store:** 5 endpoints (items, detalles, comprar, inventario, crear)

### Base de Datos (6 tablas)
- `wallet` - Saldos de usuarios
- `wallet_history` - Historial de transacciones
- `challenges` - Catálogo de retos
- `user_challenges` - Progreso de usuarios
- `store_items` - Catálogo de tienda
- `user_items` - Inventario de usuarios

## 🔑 Variables de Entorno

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=tu_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
TEST_AUTH_TOKEN=tu_token_de_prueba
```

## 📖 Documentación Completa

Para documentación detallada, consultar:
- **SISTEMA-GAMIFICACION-IACOINS-COMPLETO.md** - Documentación exhaustiva (1,170+ líneas)
- **API-ENDPOINTS-GAMIFICACION.md** - Referencia de API
- **GUIA-RAPIDA-GAMIFICACION.md** - Guía de desarrollo

## ✅ Checklist de Validación

- [ ] Base de datos PostgreSQL en funcionamiento
- [ ] Variables de entorno configuradas (.env)
- [ ] Migración SQL ejecutada exitosamente
- [ ] Servidor backend iniciado sin errores
- [ ] Tests automatizados ejecutados (14/14 tests)
- [ ] Frontend accesible en navegador
- [ ] Login funcional
- [ ] Endpoints API respondiendo correctamente

## 🛠️ Desarrollo

### Estructura de Archivos

```
backend/
├── routes/
│   ├── wallet.js (412 líneas)
│   ├── challenges.js (337 líneas)
│   └── store.js (276 líneas)
├── migrations/
│   └── create-gamification-tables.sql (250 líneas)
└── scripts/
    ├── run-gamification-migration.js (180 líneas)
    └── test-gamification-endpoints.js (380 líneas)

public/
├── gamification-center.html (785 líneas)
├── iacoins-store.html (957 líneas)
└── challenges.html (855 líneas)
```

### Tecnologías

- **Frontend:** HTML5, JavaScript ES6+, Bootstrap 5.3.2
- **Backend:** Node.js, Express.js
- **Base de Datos:** PostgreSQL (Neon)
- **Autenticación:** JWT (JSON Web Tokens)
- **Seguridad:** CSP (Content Security Policy)

## 📞 Soporte

Para problemas o preguntas:
1. Revisar sección "Troubleshooting" en documentación completa
2. Ejecutar tests automatizados para diagnosticar
3. Verificar logs del backend: `tail -f logs/backend.log`

## 🎯 Próximos Pasos

Después de instalar:
1. Ejecutar migración SQL
2. Verificar tablas creadas en PostgreSQL
3. Ejecutar suite de tests
4. Probar flujos en navegador
5. Configurar pasarela de pagos (para compra de IACoins)

---

**Versión:** 1.0.0
**Estado:** ✅ 100% Funcional
**Última actualización:** 15 Noviembre 2025
