-- Script para analizar las tablas y actualizar las estadísticas del optimizador de PostgreSQL
-- Esto debe ejecutarse después de agregar una cantidad significativa de datos o de crear/modificar índices.

ANALYZE estudiantes;
ANALYZE calificaciones;

SELECT 'Análisis de tablas estudiantes y calificaciones completado.';
