-- ============================================
-- TABLA: app_settings
-- Configuración general de la aplicación
-- Incluye configuración de MercadoPago
-- ============================================

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false, -- Si es true, no se muestra en logs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- ============================================
-- DATOS INICIALES - MercadoPago
-- ============================================

INSERT INTO app_settings (key, value, description, is_sensitive) VALUES
(
  'mercadopago',
  '{
    "enabled": false,
    "sandbox_mode": true,
    "public_key": "",
    "access_token": "",
    "webhook_secret": "",
    "success_url": "/subscription/success",
    "failure_url": "/subscription/failure",
    "pending_url": "/subscription/pending"
  }'::JSONB,
  'Configuración de MercadoPago para pagos',
  true
),
(
  'subscription_settings',
  '{
    "grace_period_days": 3,
    "allow_plan_change": true,
    "auto_create_invoice": true,
    "send_renewal_emails": true,
    "send_expiration_emails": true
  }'::JSONB,
  'Configuración general de suscripciones',
  false
);

-- ============================================
-- FUNCIÓN: get_setting
-- Obtiene una configuración por key
-- ============================================

CREATE OR REPLACE FUNCTION get_setting(p_key VARCHAR(100))
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value
  FROM app_settings
  WHERE key = p_key;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: update_setting
-- Actualiza una configuración
-- ============================================

CREATE OR REPLACE FUNCTION update_setting(p_key VARCHAR(100), p_value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE app_settings
  SET value = p_value
  WHERE key = p_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y modificar configuraciones
CREATE POLICY "Solo admins acceden a settings" ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- Función pública para obtener settings no sensibles (para el frontend)
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(key, value)
    FROM app_settings
    WHERE is_sensitive = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
