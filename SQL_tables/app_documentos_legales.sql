-- =============================================
-- TABLA: app_documentos_legales
-- Almacena documentos legales (términos, privacidad, etc.)
-- =============================================

CREATE TABLE IF NOT EXISTS public.app_documentos_legales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL UNIQUE, -- 'terminos' | 'privacidad'
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índice por tipo
CREATE INDEX IF NOT EXISTS idx_documentos_legales_tipo ON public.app_documentos_legales(tipo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_documentos_legales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_documentos_legales_updated_at ON public.app_documentos_legales;
CREATE TRIGGER trigger_documentos_legales_updated_at
    BEFORE UPDATE ON public.app_documentos_legales
    FOR EACH ROW
    EXECUTE FUNCTION update_documentos_legales_updated_at();

-- RLS
ALTER TABLE public.app_documentos_legales ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Todos pueden leer (público)
CREATE POLICY "documentos_legales_select_public" ON public.app_documentos_legales
    FOR SELECT
    USING (true);

-- Política UPDATE/INSERT: Solo usuarios con rol 'desarrollo' o 'dev'
-- El rol se obtiene de profiles->roles (no de auth.users.raw_user_meta_data)
CREATE POLICY "documentos_legales_modify_desarrollo" ON public.app_documentos_legales
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('desarrollo', 'dev')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('desarrollo', 'dev')
        )
    );

-- Insertar documentos iniciales (placeholder)
INSERT INTO public.app_documentos_legales (tipo, titulo, contenido, version)
VALUES
    ('terminos', 'Términos y Condiciones', '# Términos y Condiciones

Bienvenido a Mimonotributo. Estos términos y condiciones describen las reglas y regulaciones para el uso de nuestra aplicación.

## 1. Aceptación de los Términos

Al acceder y usar esta aplicación, aceptas estar sujeto a estos términos y condiciones.

## 2. Uso del Servicio

Mimonotributo proporciona herramientas de gestión para monotributistas y comercios. El uso del servicio está sujeto a las siguientes condiciones:

- Debes proporcionar información precisa y actualizada
- Eres responsable de mantener la confidencialidad de tu cuenta
- No debes usar el servicio para actividades ilegales

## 3. Modificaciones

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación.

## 4. Contacto

Para consultas sobre estos términos, contactanos a través de la aplicación.

---
Última actualización: Enero 2026', '1.0'),
    ('privacidad', 'Política de Privacidad', '# Política de Privacidad

En Mimonotributo, nos comprometemos a proteger tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información.

## 1. Información que Recopilamos

- **Datos de registro**: nombre, email, teléfono
- **Datos de uso**: información sobre cómo usas la aplicación
- **Datos financieros**: información de tu caja diaria y transacciones (solo almacenada, nunca compartida)

## 2. Uso de la Información

Usamos tu información para:
- Proporcionar y mejorar nuestros servicios
- Enviarte notificaciones importantes
- Responder a tus consultas

## 3. Protección de Datos

Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra acceso no autorizado.

## 4. Tus Derechos

Tienes derecho a:
- Acceder a tus datos personales
- Solicitar la corrección de datos incorrectos
- Solicitar la eliminación de tus datos

## 5. Contacto

Para consultas sobre privacidad, contactanos a través de la aplicación.

---
Última actualización: Enero 2026', '1.0')
ON CONFLICT (tipo) DO NOTHING;

-- Grants
GRANT SELECT ON public.app_documentos_legales TO anon;
GRANT SELECT ON public.app_documentos_legales TO authenticated;
GRANT ALL ON public.app_documentos_legales TO service_role;
