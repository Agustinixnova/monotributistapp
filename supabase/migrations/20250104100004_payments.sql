-- ============================================
-- TABLA: payments
-- Historial de pagos de suscripciones
-- ============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Monto
  amount INTEGER NOT NULL, -- En centavos/pesos sin decimales
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Estado
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Estados: 'pending', 'approved', 'rejected', 'refunded', 'cancelled'
  
  -- MercadoPago
  mp_payment_id VARCHAR(100),
  mp_preference_id VARCHAR(100),
  mp_status VARCHAR(50),
  mp_status_detail VARCHAR(100),
  mp_payment_method VARCHAR(50),
  mp_payment_type VARCHAR(50),
  
  -- Fechas
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_mp_payment_id ON payments(mp_payment_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ============================================
-- TABLA: invoices
-- Facturas emitidas a los clientes
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  payment_id UUID REFERENCES payments(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Número de factura
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Datos de facturación
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'ARS',
  
  -- Concepto
  description TEXT,
  period_start DATE,
  period_end DATE,
  
  -- Archivo
  file_url TEXT, -- URL del PDF de la factura
  file_name VARCHAR(255),
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  -- Estados: 'pending', 'sent', 'viewed', 'paid'
  
  -- Fechas
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- ============================================
-- FUNCIÓN: generate_invoice_number
-- Genera número de factura automático
-- Formato: INV-YYYYMM-XXXX
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_year_month VARCHAR(6);
  v_sequence INTEGER;
  v_invoice_number VARCHAR(50);
BEGIN
  v_year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Obtener siguiente número de secuencia del mes
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-' || v_year_month || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || v_year_month || '-%';
  
  v_invoice_number := 'INV-' || v_year_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: create_invoice_for_payment
-- Crea factura automáticamente al confirmar pago
-- ============================================

CREATE OR REPLACE FUNCTION create_invoice_for_payment(
  p_payment_id UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_payment RECORD;
  v_subscription RECORD;
  v_invoice_id UUID;
  v_invoice_number VARCHAR(50);
  v_description TEXT;
BEGIN
  -- Obtener pago
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Pago no encontrado: %', p_payment_id;
  END IF;
  
  -- Obtener suscripción
  SELECT * INTO v_subscription FROM subscriptions WHERE id = v_payment.subscription_id;
  
  -- Generar número de factura
  v_invoice_number := generate_invoice_number();
  
  -- Descripción por defecto
  v_description := COALESCE(
    p_description,
    'Suscripción ' || v_subscription.plan_name || ' - MonoApp'
  );
  
  -- Crear factura
  INSERT INTO invoices (
    subscription_id,
    payment_id,
    user_id,
    invoice_number,
    amount,
    description,
    period_start,
    period_end,
    status,
    issued_at
  ) VALUES (
    v_payment.subscription_id,
    v_payment.id,
    v_payment.user_id,
    v_invoice_number,
    v_payment.amount,
    v_description,
    v_subscription.starts_at::DATE,
    v_subscription.ends_at::DATE,
    'pending',
    NOW()
  ) RETURNING id INTO v_invoice_id;
  
  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Payments: usuarios ven sus pagos
CREATE POLICY "Usuarios ven sus pagos" ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Payments: admins ven todos
CREATE POLICY "Admins ven todos los pagos" ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- Invoices: usuarios ven sus facturas
CREATE POLICY "Usuarios ven sus facturas" ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Invoices: admins manejan todas
CREATE POLICY "Admins manejan todas las facturas" ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON profiles.role_id = roles.id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );
