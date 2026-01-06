-- Tabla para dispositivos móviles y llaves biométricas
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    -- UUID único del dispositivo o generated ID
    device_name VARCHAR(255),
    public_key TEXT NOT NULL,
    -- Public Key para verificar firmas biométricas
    os_type VARCHAR(50),
    -- 'ios', 'android'
    push_token VARCHAR(255),
    -- Token para notificaciones push (FCM/APNs)
    last_login TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);
CREATE INDEX idx_devices_user ON user_devices(user_id);
CREATE INDEX idx_devices_uid ON user_devices(device_id);