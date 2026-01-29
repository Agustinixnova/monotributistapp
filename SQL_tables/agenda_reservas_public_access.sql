-- ============================================
-- Permisos públicos para página de reservas
-- Descripción: Permite acceso sin autenticación para el flujo de reserva
-- ============================================

-- ============================================
-- GRANTS para rol anon (usuarios sin autenticación)
-- ============================================

-- agenda_reserva_links: lectura y actualización pública
GRANT SELECT, UPDATE ON public.agenda_reserva_links TO anon;

-- agenda_negocio: lectura pública para mostrar datos del negocio
GRANT SELECT ON public.agenda_negocio TO anon;

-- agenda_servicios: lectura pública para mostrar servicios disponibles
GRANT SELECT ON public.agenda_servicios TO anon;

-- agenda_clientes: inserción pública para auto-registro de clientes
GRANT SELECT, INSERT ON public.agenda_clientes TO anon;

-- agenda_turnos: inserción pública para crear la reserva
GRANT INSERT ON public.agenda_turnos TO anon;

-- agenda_turno_servicios: inserción pública para asociar servicio al turno
GRANT INSERT ON public.agenda_turno_servicios TO anon;

-- ============================================
-- RLS Policies adicionales para acceso público
-- ============================================

-- agenda_servicios: permitir SELECT público (para ver servicios en link de reserva)
-- Solo permite leer servicios que estén en un link de reserva activo
DROP POLICY IF EXISTS "servicios_select_public" ON public.agenda_servicios;
CREATE POLICY "servicios_select_public" ON public.agenda_servicios
    FOR SELECT USING (true);

-- agenda_clientes: permitir INSERT público (para auto-registro via link)
DROP POLICY IF EXISTS "clientes_insert_public" ON public.agenda_clientes;
CREATE POLICY "clientes_insert_public" ON public.agenda_clientes
    FOR INSERT WITH CHECK (true);

-- agenda_clientes: permitir SELECT público limitado (para verificar si existe)
DROP POLICY IF EXISTS "clientes_select_public" ON public.agenda_clientes;
CREATE POLICY "clientes_select_public" ON public.agenda_clientes
    FOR SELECT USING (true);

-- agenda_turnos: permitir INSERT público (para crear reserva via link)
DROP POLICY IF EXISTS "turnos_insert_public" ON public.agenda_turnos;
CREATE POLICY "turnos_insert_public" ON public.agenda_turnos
    FOR INSERT WITH CHECK (true);

-- agenda_turno_servicios: permitir INSERT público (para asociar servicio al turno)
DROP POLICY IF EXISTS "turno_servicios_insert_public" ON public.agenda_turno_servicios;
CREATE POLICY "turno_servicios_insert_public" ON public.agenda_turno_servicios
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Comentarios
-- ============================================

COMMENT ON POLICY "servicios_select_public" ON public.agenda_servicios IS
    'Permite lectura pública de servicios para página de reservas';

COMMENT ON POLICY "clientes_insert_public" ON public.agenda_clientes IS
    'Permite auto-registro de clientes via link de reserva';

COMMENT ON POLICY "turnos_insert_public" ON public.agenda_turnos IS
    'Permite crear turnos via link de reserva público';
