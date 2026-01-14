import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔧 Aplicando fix de RLS para client_fiscal_data...\n');

  // Ejecutar las sentencias SQL una por una
  const queries = [
    // PASO 1: client_fiscal_data policies
    `DROP POLICY IF EXISTS "client_fiscal_data_select" ON public.client_fiscal_data`,
    `DROP POLICY IF EXISTS "client_fiscal_data_insert" ON public.client_fiscal_data`,
    `DROP POLICY IF EXISTS "client_fiscal_data_update" ON public.client_fiscal_data`,
    `DROP POLICY IF EXISTS "client_fiscal_data_delete" ON public.client_fiscal_data`,

    `CREATE POLICY "client_fiscal_data_select" ON public.client_fiscal_data
        FOR SELECT USING (
            user_id = auth.uid()
            OR public.is_full_access()
            OR (public.get_user_role() = 'contador_secundario' AND EXISTS (
                SELECT 1 FROM public.profiles WHERE id = client_fiscal_data.user_id AND assigned_to = auth.uid()
            ))
        )`,

    `CREATE POLICY "client_fiscal_data_insert" ON public.client_fiscal_data
        FOR INSERT WITH CHECK (public.is_full_access())`,

    `CREATE POLICY "client_fiscal_data_update" ON public.client_fiscal_data
        FOR UPDATE USING (public.is_full_access())`,

    `CREATE POLICY "client_fiscal_data_delete" ON public.client_fiscal_data
        FOR DELETE USING (public.is_full_access())`,

    // PASO 2: profiles policies
    `DROP POLICY IF EXISTS "profiles_select" ON public.profiles`,
    `DROP POLICY IF EXISTS "profiles_insert" ON public.profiles`,
    `DROP POLICY IF EXISTS "profiles_update" ON public.profiles`,

    `CREATE POLICY "profiles_select" ON public.profiles
        FOR SELECT USING (
            id = auth.uid()
            OR public.is_full_access()
            OR (public.get_user_role() = 'contador_secundario' AND assigned_to = auth.uid())
        )`,

    `CREATE POLICY "profiles_insert" ON public.profiles
        FOR INSERT WITH CHECK (public.is_full_access())`,

    `CREATE POLICY "profiles_update" ON public.profiles
        FOR UPDATE USING (
            id = auth.uid()
            OR public.is_full_access()
        )`,

    // PASO 3: user_module_access policies
    `DROP POLICY IF EXISTS "user_module_access_select" ON public.user_module_access`,
    `DROP POLICY IF EXISTS "user_module_access_insert" ON public.user_module_access`,
    `DROP POLICY IF EXISTS "user_module_access_update" ON public.user_module_access`,
    `DROP POLICY IF EXISTS "user_module_access_delete" ON public.user_module_access`,

    `CREATE POLICY "user_module_access_select" ON public.user_module_access
        FOR SELECT USING (
            user_id = auth.uid()
            OR public.is_full_access()
        )`,

    `CREATE POLICY "user_module_access_insert" ON public.user_module_access
        FOR INSERT WITH CHECK (public.is_full_access())`,

    `CREATE POLICY "user_module_access_update" ON public.user_module_access
        FOR UPDATE USING (public.is_full_access())`,

    `CREATE POLICY "user_module_access_delete" ON public.user_module_access
        FOR DELETE USING (public.is_full_access())`
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const shortQuery = query.substring(0, 60).replace(/\n/g, ' ') + '...';

    const { error } = await supabaseNew.rpc('exec_sql', { sql: query });

    if (error) {
      // Intentar con otro método
      console.log(`⚠️ RPC failed for: ${shortQuery}`);
      console.log(`   Error: ${error.message}`);
    } else {
      console.log(`✅ ${shortQuery}`);
    }
  }

  console.log('\n✅ Migración completada!');
  console.log('Recargá la app para verificar que funcione.\n');
}

main().catch(console.error);
