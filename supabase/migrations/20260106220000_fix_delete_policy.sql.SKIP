-- Arreglar política de DELETE para cargas
-- Permitir eliminar a todos los roles administrativos

DROP POLICY IF EXISTS "cargas_delete_admin" ON public.client_facturacion_cargas;

CREATE POLICY "cargas_delete_admin" ON public.client_facturacion_cargas
    FOR DELETE USING (
        public.get_user_role() IN ('admin', 'contadora_principal', 'desarrollo', 'comunicadora', 'contador_secundario')
    );

-- También permitir al cliente eliminar sus propias cargas si el mes no está cerrado
CREATE POLICY "cargas_delete_cliente" ON public.client_facturacion_cargas
    FOR DELETE USING (
        public.get_user_role() IN ('monotributista', 'responsable_inscripto')
        AND client_id IN (
            SELECT id FROM public.client_fiscal_data
            WHERE user_id = auth.uid() AND gestion_facturacion = 'autonomo'
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.client_facturacion_mensual_resumen r
            WHERE r.client_id = client_facturacion_cargas.client_id
              AND r.anio = client_facturacion_cargas.anio
              AND r.mes = client_facturacion_cargas.mes
              AND r.estado = 'cerrado'
        )
    );
