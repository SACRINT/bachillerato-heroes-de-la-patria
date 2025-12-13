# Configuración de IACoins - Instrucciones

## Descripción
Este documento explica cómo crear las tablas y datos iniciales para el sistema de gamificación IACoins.

## Tablas a Crear
1. **iacoins_balances** - Saldo de IACoins por usuario
2. **iacoins_transactions** - Historial de transacciones
3. **iacoins_challenges** - Retos disponibles
4. **iacoins_user_challenges** - Progreso del usuario en retos
5. **iacoins_achievements** - Logros disponibles
6. **iacoins_user_achievements** - Logros desbloqueados del usuario
7. **iacoins_leaderboard** - Tabla de posiciones
8. **iacoins_ai_generations** - Generaciones IA pagadas con IACoins

## Pasos de Configuración

### 1. Crear las Tablas
Ejecuta el siguiente comando en Neon Console:

```bash
# Opción 1: Desde psql
psql postgresql://user:password@host/dbname -f create-iacoins-tables.sql

# Opción 2: Copiar y pegar en Neon Console
# Abre: https://console.neon.tech
# Selecciona tu proyecto y base de datos
# Copia el contenido de create-iacoins-tables.sql
# Pega en el editor de SQL
# Haz clic en "Execute"
```

### 2. Insertar Datos de Ejemplo
Ejecuta el siguiente comando:

```bash
# Opción 1: Desde psql
psql postgresql://user:password@host/dbname -f seed-iacoins-demo-data.sql

# Opción 2: Copiar y pegar en Neon Console
# Copia el contenido de seed-iacoins-demo-data.sql
# Pega en el editor de SQL
# Haz clic en "Execute"
```

### 3. Verificar que las Tablas Existen
```sql
-- En Neon Console, ejecuta:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'iacoins_%'
ORDER BY table_name;
```

Deberías ver 8 tablas:
- iacoins_achievements
- iacoins_ai_generations
- iacoins_balances
- iacoins_challenges
- iacoins_leaderboard
- iacoins_transactions
- iacoins_user_achievements
- iacoins_user_challenges

### 4. Verificar Datos de Ejemplo
```sql
-- Ver balance del usuario de prueba:
SELECT * FROM iacoins_balances LIMIT 1;

-- Ver retos disponibles:
SELECT * FROM iacoins_challenges;

-- Ver transacciones:
SELECT * FROM iacoins_transactions;

-- Ver logros:
SELECT * FROM iacoins_achievements;
```

## Notas Importantes

1. **UUIDs de Usuarios**: Los scripts de seed usan el primer usuario de la tabla `usuarios`. Si necesitas usar un usuario específico, modifica los scripts.

2. **Restricciones de Clave Foránea**: Las tablas iacoins hacen referencia a `usuarios(uuid)`. Asegúrate de que la tabla `usuarios` exista.

3. **Índices**: Los scripts crean índices automáticamente para optimizar queries.

4. **Datos Demo**: Los datos de ejemplo se insertan con `ON CONFLICT DO NOTHING`, así que ejecutar el script múltiples veces es seguro.

## Endpoints Disponibles Después de Configurar

Una vez que las tablas estén creadas, los siguientes endpoints estarán disponibles:

```
GET    /api/iacoins/balance           - Obtener balance del usuario
GET    /api/iacoins/transactions      - Historial de transacciones
GET    /api/iacoins/challenges        - Lista de retos disponibles
POST   /api/iacoins/challenges/:id/complete - Completar un reto
GET    /api/iacoins/achievements      - Logros del usuario
GET    /api/iacoins/leaderboard       - Tabla de posiciones
POST   /api/iacoins/earn              - Ganar IACoins por reto
POST   /api/iacoins/spend             - Gastar IACoins en IA
```

## Troubleshooting

### Error: "relation iacoins_balances does not exist"
- Solución: Ejecuta primero `create-iacoins-tables.sql`

### Error: "foreign key constraint"
- Solución: Asegúrate de que la tabla `usuarios` existe y tiene registros

### Error: "syntax error"
- Solución: Revisa que hayas copiado el SQL completo sin caracteres especiales

