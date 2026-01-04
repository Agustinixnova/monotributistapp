-- ============================================
-- TABLA: subscriptions
-- Historial de suscripciones de cada usuario
-- Cada renovación es un registro nuevo
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Detalles del plan al momento de la compra (snapshot)
  plan_key VARCHAR(20) NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  duration_months INTEGER NOT NULL,
  price_per_month INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  
  -- Estado de la suscripción
  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment',
  -- Estados posibles:
  -- 'pending_payment' = Esperando primer pago
  -- 'active' = Suscripción activa y vigente
  -- 'grace_period' = Venció pero está en período de gracia (3 días)
  -- 'expired' = Expirada, sin acceso
  -- 'cancelled' = Cancelada por el usuario o admin
  
  -- Fechas de vigencia
  starts_at TIMESTAMP WITH TIME ZONE, -- Cuándo empieza (después del pago)
  ends_at TIMESTAMP WITH TIME ZONE, -- Cuándo termina
  grace_period_ends_at TIMESTAMP WITH TIME ZONE, -- Fin del período de gracia (ends_at + 3 días)
  
  -- Renovación
  is_renewal BOOLEAN DEFAULT false, -- Si es renovación de una suscripción anterior
  previous_subscription_id UUID REFERENCES subscriptions(id), -- Suscripción anterior (si es renovación)
  renewed_from_date TIMESTAMP WITH TIME ZONE, -- Desde qué fecha se calculó (para renovaciones anticipadas)
  
  -- MercadoPago
  mp_payment_id VARCHAR(100),
  mp_preference_id VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_ends_at ON subscriptions(ends_at);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================
-- VISTA: current_user_subscription
-- Devuelve la suscripción activa actual del usuario
-- ============================================

CREATE OR REPLACE VIEW current_user_subscription AS
SELECT 
  s.*,
  sp.renewal_alert_days,
  -- Días restantes hasta vencimiento
  GREATEST(0, EXTRACT(DAY FROM (s.ends_at - NOW()))) AS days_remaining,
  -- Si está en período de alerta de renovación
  CASE 
    WHEN s.ends_at IS NOT NULL 
    AND NOW() >= (s.ends_at - (sp.renewal_alert_days || ' days')::INTERVAL)
    AND NOW() < s.ends_at
    THEN true
    ELSE false
  END AS should_show_renewal_alert,
  -- Si está en período de gracia
  CASE 
    WHEN s.status = 'grace_period' 
    OR (s.ends_at < NOW() AND s.grace_period_ends_at > NOW())
    THEN true
    ELSE false
  END AS is_in_grace_period,
  -- Días restantes de gracia
  CASE 
    WHEN s.grace_period_ends_at > NOW()
    THEN GREATEST(0, EXTRACT(DAY FROM (s.grace_period_ends_at - NOW())))
    ELSE 0
  END AS grace_days_remaining
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status IN ('active', 'grace_period')
ORDER BY s.ends_at DESC;

-- ============================================
-- FUNCIÓN: get_user_subscription_status
-- Retorna el estado completo de suscripción de un usuario
-- ============================================

CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  status VARCHAR(20),
  plan_key VARCHAR(20),
  plan_name VARCHAR(50),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER,
  should_show_renewal_alert BOOLEAN,
  is_in_grace_period BOOLEAN,
  grace_days_remaining INTEGER,
  has_active_subscription BOOLEAN,
  can_access_app BOOLEAN
) AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Buscar suscripción activa o en gracia
  SELECT 
    s.id,
    s.status,
    s.plan_key,
    s.plan_name,
    s.starts_at,
    s.ends_at,
    s.grace_period_ends_at,
    sp.renewal_alert_days
  INTO v_subscription
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = p_user_id
  AND s.status IN ('active', 'grace_period')
  ORDER BY s.ends_at DESC
  LIMIT 1;
  
  IF v_subscription.id IS NULL THEN
    -- No tiene suscripción activa
    RETURN QUERY SELECT 
      NULL::UUID,
      'none'::VARCHAR(20),
      NULL::VARCHAR(20),
      NULL::VARCHAR(50),
      NULL::TIMESTAMP WITH TIME ZONE,
      NULL::TIMESTAMP WITH TIME ZONE,
      0::INTEGER,
      false::BOOLEAN,
      false::BOOLEAN,
      0::INTEGER,
      false::BOOLEAN,
      false::BOOLEAN;
  ELSE
    -- Calcular valores
    RETURN QUERY SELECT
      v_subscription.id,
      v_subscription.status,
      v_subscription.plan_key,
      v_subscription.plan_name,
      v_subscription.starts_at,
      v_subscription.ends_at,
      GREATEST(0, EXTRACT(DAY FROM (v_subscription.ends_at - NOW())))::INTEGER,
      (NOW() >= (v_subscription.ends_at - (v_subscription.renewal_alert_days || ' days')::INTERVAL) 
       AND NOW() < v_subscription.ends_at)::BOOLEAN,
      (v_subscription.status = 'grace_period' 
       OR (v_subscription.ends_at < NOW() AND v_subscription.grace_period_ends_at > NOW()))::BOOLEAN,
      GREATEST(0, EXTRACT(DAY FROM (v_subscription.grace_period_ends_at - NOW())))::INTEGER,
      true::BOOLEAN,
      (v_subscription.ends_at > NOW() OR v_subscription.grace_period_ends_at > NOW())::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: create_subscription
-- Crea una nueva suscripción para un usuario
-- ============================================

CREATE OR REPLACE FUNCTION create_subscription(
  p_user_id UUID,
  p_plan_key VARCHAR(20),
  p_mp_preference_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_plan RECORD;
  v_current_sub RECORD;
  v_subscription_id UUID;
  v_starts_at TIMESTAMP WITH TIME ZONE;
  v_ends_at TIMESTAMP WITH TIME ZONE;
  v_is_renewal BOOLEAN := false;
  v_previous_sub_id UUID := NULL;
  v_renewed_from_date TIMESTAMP WITH TIME ZONE := NULL;
BEGIN
  -- Obtener el plan
  SELECT * INTO v_plan 
  FROM subscription_plans 
  WHERE plan_key = p_plan_key AND is_active = true;
  
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan no encontrado o inactivo: %', p_plan_key;
  END IF;
  
  -- Ver si tiene suscripción activa (para renovación)
  SELECT id, ends_at INTO v_current_sub
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'grace_period')
  ORDER BY ends_at DESC
  LIMIT 1;
  
  IF v_current_sub.id IS NOT NULL THEN
    -- Es una renovación, empieza desde el vencimiento actual
    v_is_renewal := true;
    v_previous_sub_id := v_current_sub.id;
    v_renewed_from_date := v_current_sub.ends_at;
    v_starts_at := v_current_sub.ends_at;
  ELSE
    -- Primera suscripción, empieza desde ahora (se actualiza al pagar)
    v_starts_at := NULL; -- Se setea cuando paga
  END IF;
  
  -- Insertar suscripción en estado pending_payment
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    plan_key,
    plan_name,
    duration_months,
    price_per_month,
    total_amount,
    status,
    starts_at,
    is_renewal,
    previous_subscription_id,
    renewed_from_date,
    mp_preference_id
  ) VALUES (
    p_user_id,
    v_plan.id,
    v_plan.plan_key,
    v_plan.name,
    v_plan.duration_months,
    v_plan.price_per_month,
    v_plan.total_price,
    'pending_payment',
    v_starts_at,
    v_is_renewal,
    v_previous_sub_id,
    v_renewed_from_date,
    p_mp_preference_id
  ) RETURNING id INTO v_subscription_id;
  
  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: confirm_subscription_payment
-- Confirma el pago y activa la suscripción
-- ============================================

CREATE OR REPLACE FUNCTION confirm_subscription_payment(
  p_subscription_id UUID,
  p_mp_payment_id VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_starts_at TIMESTAMP WITH TIME ZONE;
  v_ends_at TIMESTAMP WITH TIME ZONE;
  v_grace_period_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obtener la suscripción
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  IF v_subscription.id IS NULL THEN
    RAISE EXCEPTION 'Suscripción no encontrada: %', p_subscription_id;
  END IF;
  
  -- Determinar fecha de inicio
  IF v_subscription.is_renewal AND v_subscription.renewed_from_date IS NOT NULL THEN
    -- Renovación: empieza desde la fecha de vencimiento anterior
    v_starts_at := v_subscription.renewed_from_date;
  ELSE
    -- Primera suscripción: empieza desde ahora
    v_starts_at := NOW();
  END IF;
  
  -- Calcular fecha de fin
  v_ends_at := v_starts_at + (v_subscription.duration_months || ' months')::INTERVAL;
  
  -- Período de gracia: 3 días después del vencimiento
  v_grace_period_ends_at := v_ends_at + INTERVAL '3 days';
  
  -- Actualizar suscripción
  UPDATE subscriptions
  SET 
    status = 'active',
    starts_at = v_starts_at,
    ends_at = v_ends_at,
    grace_period_ends_at = v_grace_period_ends_at,
    mp_payment_id = p_mp_payment_id,
    paid_at = NOW()
  WHERE id = p_subscription_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias suscripciones
CREATE POLICY "Usuarios ven sus suscripciones" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden crear sus propias suscripciones
CREATE POLICY "Usuarios crean sus suscripciones" ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el sistema puede actualizar (vía functions)
CREATE POLICY "Solo sistema actualiza suscripciones" ON subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- Admins pueden ver todas
CREATE POLICY "Admins ven todas las suscripciones" ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );
