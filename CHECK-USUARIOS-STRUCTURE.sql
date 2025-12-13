-- Ver estructura de tabla usuarios
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- Ver primer usuario
SELECT * FROM usuarios LIMIT 1;
