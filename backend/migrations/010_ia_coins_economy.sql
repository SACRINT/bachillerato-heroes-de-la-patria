-- Migration: Sistema IA Coins Completo
-- Semana 36-40: Tienda, Premios, Subastas, VIP, Economía
-- 1. Tienda de Items (Avatares, Accesorios, etc.)
CREATE TABLE IF NOT EXISTS ia_coins_store (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    -- avatar, accesorio, tema, efecto, boost
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_coins INTEGER NOT NULL,
    rareza VARCHAR(50) DEFAULT 'comun',
    -- comun, raro, epico, legendario
    imagen_url TEXT,
    stock_limitado BOOLEAN DEFAULT false,
    stock_disponible INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_store_tipo ON ia_coins_store(tipo);
CREATE INDEX IF NOT EXISTS idx_store_rareza ON ia_coins_store(rareza);
CREATE INDEX IF NOT EXISTS idx_store_activo ON ia_coins_store(activo);
-- Insertar items de ejemplo
INSERT INTO ia_coins_store (
        tipo,
        nombre,
        descripcion,
        precio_coins,
        rareza,
        stock_limitado
    )
VALUES (
        'avatar',
        'Avatar Científico',
        'Avatar con bata de laboratorio',
        100,
        'comun',
        false
    ),
    (
        'avatar',
        'Avatar Astronauta',
        'Avatar con traje espacial',
        250,
        'raro',
        false
    ),
    (
        'avatar',
        'Avatar Superhéroe',
        'Avatar con capa y máscara',
        500,
        'epico',
        false
    ),
    (
        'avatar',
        'Avatar Legendario Dorado',
        'Avatar de edición limitada',
        2000,
        'legendario',
        true
    ),
    (
        'accesorio',
        'Gafas de Sol',
        'Gafas oscuras cool',
        50,
        'comun',
        false
    ),
    (
        'accesorio',
        'Corona Real',
        'Corona dorada',
        300,
        'epico',
        false
    ),
    (
        'tema',
        'Tema Oscuro Premium',
        'Tema dark mode mejorado',
        150,
        'raro',
        false
    ),
    (
        'efecto',
        'Aura Brillante',
        'Efecto de partículas brillantes',
        200,
        'raro',
        false
    ),
    (
        'boost',
        'Multiplicador 2x por 7 días',
        'Dobla tus coins por una semana',
        400,
        'epico',
        false
    ) ON CONFLICT DO NOTHING;
-- 2. Inventario de Usuarios
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES ia_coins_store(id),
    equipado BOOLEAN DEFAULT false,
    fecha_adquisicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipado ON user_inventory(equipado)
WHERE equipado = true;
-- 3. Premios Reales
CREATE TABLE IF NOT EXISTS premios_reales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    costo_coins INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    tipo VARCHAR(50) NOT NULL,
    -- fisico, digital, experiencia
    imagen_url TEXT,
    instrucciones_canje TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_premios_activo ON premios_reales(activo);
-- Insertar premios de ejemplo
INSERT INTO premios_reales (
        nombre,
        descripcion,
        costo_coins,
        stock,
        tipo,
        instrucciones_canje
    )
VALUES (
        'USB 32GB',
        'Memoria USB marca Kingston',
        1500,
        10,
        'fisico',
        'Recoger en dirección escolar'
    ),
    (
        'Audífonos Bluetooth',
        'Audífonos inalámbricos',
        3000,
        5,
        'fisico',
        'Recoger en dirección'
    ),
    (
        'Cupón Netflix 3 meses',
        'Suscripción  Netflix por 3 meses',
        2500,
        20,
        'digital',
        'Código enviado por email'
    ),
    (
        'Libro Digital',
        'eBook a elección del catálogo',
        800,
        100,
        'digital',
        'Link de descarga por email'
    ),
    (
        'Día libre de clases',
        'Un día sin asistir (justificado)',
        5000,
        3,
        'experiencia',
        'Coordinación con dirección'
    ),
    (
        'Almuerzo con el director',
        'Comida con el director',
        10000,
        1,
        'experiencia',
        'Se agenda fecha'
    ) ON CONFLICT DO NOTHING;
-- 4. Canjes de Premios
CREATE TABLE IF NOT EXISTS canjes_premios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    premio_id INTEGER NOT NULL REFERENCES premios_reales(id),
    coins_gastados INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, procesando, entregado, cancelado
    notas TEXT,
    fecha_canje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_canjes_user ON canjes_premios(user_id);
CREATE INDEX IF NOT EXISTS idx_canjes_status ON canjes_premios(status);
-- 5. Subastas
CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    item_nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    precio_inicial INTEGER NOT NULL,
    precio_actual INTEGER NOT NULL,
    incremento_minimo INTEGER DEFAULT 10,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    ganador_id INTEGER REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'activa',
    -- activa, finalizada, cancelada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_fecha_fin ON auctions(fecha_fin);
-- 6. Pujas de Subastas
CREATE TABLE IF NOT EXISTS auction_bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES usuarios(id),
    amount INTEGER NOT NULL,
    fecha_puja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_user ON auction_bids(user_id);
-- 7. Suscripciones VIP
CREATE TABLE IF NOT EXISTS vip_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    plan_tipo VARCHAR(50) NOT NULL,
    -- mensual, trimestral, anual
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    metodo_pago VARCHAR(50),
    -- coins, mxn
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vip_user ON vip_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_activo ON vip_subscriptions(activo)
WHERE activo = true;
-- 8. Triggers
DROP TRIGGER IF EXISTS update_vip_updated_at ON vip_subscriptions;
CREATE TRIGGER update_vip_updated_at BEFORE
UPDATE ON vip_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 9. Vistas útiles
CREATE OR REPLACE VIEW vista_tienda_popular AS
SELECT s.id,
    s.nombre,
    s.tipo,
    s.precio_coins,
    s.rareza,
    COUNT(ui.id) as total_vendidos
FROM ia_coins_store s
    LEFT JOIN user_inventory ui ON s.id = ui.item_id
WHERE s.activo = true
GROUP BY s.id,
    s.nombre,
    s.tipo,
    s.precio_coins,
    s.rareza
ORDER BY total_vendidos DESC;
CREATE OR REPLACE VIEW vista_usuarios_vip AS
SELECT u.id,
    u.nombre,
    u.email,
    v.plan_tipo,
    v.fecha_fin,
    CASE
        WHEN v.fecha_fin > CURRENT_TIMESTAMP THEN true
        ELSE false
    END as vip_activo
FROM usuarios u
    JOIN vip_subscriptions v ON u.id = v.user_id
WHERE v.activo = true;
CREATE OR REPLACE VIEW vista_economia_dashboard AS
SELECT (
        SELECT SUM(ia_coins)
        FROM usuarios
    ) as coins_circulacion,
    (
        SELECT COUNT(*)
        FROM ia_coins_transactions
        WHERE tipo = 'compra'
    ) as total_compras,
    (
        SELECT COUNT(*)
        FROM ia_coins_transactions
        WHERE tipo = 'gasto'
    ) as total_gastos,
    (
        SELECT COUNT(*)
        FROM user_inventory
    ) as items_vendidos,
    (
        SELECT COUNT(*)
        FROM canjes_premios
        WHERE status = 'entregado'
    ) as premios_entregados,
    (
        SELECT COUNT(*)
        FROM vip_subscriptions
        WHERE activo = true
            AND fecha_fin > CURRENT_TIMESTAMP
    ) as usuarios_vip;
-- 10. Función para actualizar subastas expiradas
CREATE OR REPLACE FUNCTION finalizar_subastas_expiradas() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
UPDATE auctions
SET status = 'finalizada'
WHERE status = 'activa'
    AND fecha_fin < CURRENT_TIMESTAMP
RETURNING id INTO count;
RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;
-- 11. Función para desactivar VIP expirados
CREATE OR REPLACE FUNCTION desactivar_vip_expirados() RETURNS INTEGER AS $$
DECLARE count INTEGER;
BEGIN
UPDATE vip_subscriptions
SET activo = false
WHERE activo = true
    AND fecha_fin < CURRENT_TIMESTAMP
RETURNING id INTO count;
RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;
-- 12. Comentarios
COMMENT ON TABLE ia_coins_store IS 'Catálogo de items virtuales para comprar con IA Coins';
COMMENT ON TABLE user_inventory IS 'Inventario de items de cada usuario';
COMMENT ON TABLE premios_reales IS 'Premios físicos/digitales canjeables con coins';
COMMENT ON TABLE canjes_premios IS 'Registro de canjes de premios reales';
COMMENT ON TABLE auctions IS 'Subastas de items exclusivos';
COMMENT ON TABLE auction_bids IS 'Pujas realizadas en subastas';
COMMENT ON TABLE vip_subscriptions IS 'Suscripciones VIP de usuarios';
COMMENT ON COLUMN ia_coins_store.rareza IS 'Rareza: comun, raro, epico, legendario';
COMMENT ON COLUMN premios_reales.tipo IS 'Tipo: fisico, digital, experiencia';
COMMENT ON COLUMN vip_subscriptions.plan_tipo IS 'Plan: mensual, trimestral, anual';
-- Fin de migración