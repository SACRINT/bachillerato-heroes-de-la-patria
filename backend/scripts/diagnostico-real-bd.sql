-- DIAGNÓSTICO REAL DE LA BD - Ver exactamente qué hay
SELECT 
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE estado='pendiente') as estado_pendiente,
    COUNT(*) FILTER (WHERE estado='aprobada') as estado_aprobada,
    COUNT(*) FILTER (WHERE estado='rechazada') as estado_rechazada
FROM pendientes_aprobacion;

-- Ver todos los registros por estado
SELECT estado, COUNT(*) as cantidad
FROM pendientes_aprobacion
GROUP BY estado;

-- Ver primeros 15 registros para entender qué hay
SELECT 
    id,
    tipo_solicitud,
    email_usuario,
    estado,
    email_confirmado,
    fecha_solicitud
FROM pendientes_aprobacion
ORDER BY fecha_solicitud DESC
LIMIT 15;
