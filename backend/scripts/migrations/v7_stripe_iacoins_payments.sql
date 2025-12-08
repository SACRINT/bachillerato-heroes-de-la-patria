-- =====================================================
-- FASE 5.2: Sistema IACoins - Stripe Payments
-- Migración: 07 Diciembre 2025
-- =====================================================
-- Tabla de intentos de pago (Stripe)
CREATE TABLE IF NOT EXISTS payment_intents (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES usuarios(id),
    tenant_id INT REFERENCES tenants(id),
    stripe_session_id VARCHAR(100) UNIQUE,
    stripe_payment_intent VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    package_id VARCHAR(50) NOT NULL,
    amount_mxn DECIMAL(10, 2) NOT NULL,
    iacoins_amount INT NOT NULL,
    bonus_iacoins INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status: pending, processing, completed, failed, refunded, cancelled
    payment_method VARCHAR(50),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Paquetes de IACoins disponibles para compra
CREATE TABLE IF NOT EXISTS iacoins_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_mxn DECIMAL(10, 2) NOT NULL,
    iacoins_base INT NOT NULL,
    bonus_percentage INT DEFAULT 0,
    icon VARCHAR(10) DEFAULT '💰',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_session ON payment_intents(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created ON payment_intents(created_at);
-- =====================================================
-- DATOS INICIALES - Paquetes de IACoins
-- =====================================================
INSERT INTO iacoins_packages (
        id,
        name,
        description,
        price_mxn,
        iacoins_base,
        bonus_percentage,
        icon,
        is_featured,
        sort_order
    )
VALUES (
        'starter',
        'Starter Pack',
        'Perfecto para empezar',
        99.00,
        500,
        0,
        '⭐',
        false,
        1
    ),
    (
        'popular',
        'Popular Pack',
        'El más elegido por estudiantes',
        249.00,
        1500,
        20,
        '🔥',
        true,
        2
    ),
    (
        'pro',
        'Pro Pack',
        'Para usuarios avanzados',
        499.00,
        3500,
        40,
        '💎',
        false,
        3
    ),
    (
        'mega',
        'Mega Pack',
        'Máximo valor por tu dinero',
        999.00,
        8000,
        60,
        '🚀',
        false,
        4
    ) ON CONFLICT (id) DO
UPDATE
SET price_mxn = EXCLUDED.price_mxn,
    iacoins_base = EXCLUDED.iacoins_base,
    bonus_percentage = EXCLUDED.bonus_percentage;
-- =====================================================
-- FUNCIÓN PARA CALCULAR TOTAL DE IACOINS
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_total_iacoins(base_coins INT, bonus_pct INT) RETURNS INT AS $$ BEGIN RETURN base_coins + FLOOR(base_coins * bonus_pct / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_payment_intents_updated ON payment_intents;
CREATE TRIGGER trigger_payment_intents_updated BEFORE
UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();
-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE payment_intents IS 'Registro de intentos de pago con Stripe para compra de IACoins';
COMMENT ON TABLE iacoins_packages IS 'Paquetes disponibles para compra de IACoins';