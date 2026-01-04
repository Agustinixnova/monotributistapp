-- ============================================
-- TABLA: subscription_plans
-- Configuración de planes de suscripción
-- Modificable desde el panel de admin
-- ============================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificador del plan
  plan_key VARCHAR(20) UNIQUE NOT NULL, -- 'monthly', 'quarterly', 'semi_annual', 'annual'
  name VARCHAR(50) NOT NULL, -- 'Mensual', 'Trimestral', 'Semestral', 'Anual'
  
  -- Duración
  duration_months INTEGER NOT NULL, -- 1, 3, 6, 12
  
  -- Precios
  base_price INTEGER NOT NULL, -- Precio base mensual sin descuento (ej: 99900 = $99.900)
  price_per_month INTEGER NOT NULL, -- Precio mensual con descuento aplicado
  total_price INTEGER NOT NULL, -- Precio total del período
  
  -- Descuento
  discount_percentage DECIMAL(5,2) DEFAULT 0, -- Porcentaje de descuento (ej: 10.00 = 10%)
  savings_amount INTEGER DEFAULT 0, -- Monto ahorrado respecto al mensual
  
  -- Notificaciones
  renewal_alert_days INTEGER NOT NULL DEFAULT 7, -- Días antes del vencimiento para alertar
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- Orden en que se muestran
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_key ON subscription_plans(plan_key);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- ============================================
-- DATOS INICIALES
-- ============================================

INSERT INTO subscription_plans (plan_key, name, duration_months, base_price, price_per_month, total_price, discount_percentage, savings_amount, renewal_alert_days, display_order) VALUES
('monthly', 'Mensual', 1, 99900, 99900, 99900, 0, 0, 7, 1),
('quarterly', 'Trimestral', 3, 99900, 89900, 269700, 10.00, 30000, 15, 2),
('semi_annual', 'Semestral', 6, 99900, 79900, 479400, 20.00, 120000, 30, 3),
('annual', 'Anual', 12, 99900, 69900, 838800, 30.00, 360000, 30, 4);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer planes activos
CREATE POLICY "Planes activos son públicos" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Solo admins pueden modificar
CREATE POLICY "Solo admins modifican planes" ON subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );
