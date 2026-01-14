import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando RLS policies de facturación...\n');

  // Query para ver las políticas RLS
  const { data: policies, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename IN ('client_facturacion_cargas', 'client_facturacion_mensual_resumen')
      ORDER BY tablename, policyname;
    `
  });

  if (error) {
    console.log('Error (intentando método alternativo):', error.message);

    // Método alternativo: consultar pg_catalog
    const query = `
      SELECT
        pol.polname as policyname,
        tab.relname as tablename,
        CASE pol.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as cmd,
        pg_get_expr(pol.polqual, pol.polrelid) as qual
      FROM pg_policy pol
      JOIN pg_class tab ON pol.polrelid = tab.oid
      WHERE tab.relname IN ('client_facturacion_cargas', 'client_facturacion_mensual_resumen')
      ORDER BY tab.relname, pol.polname;
    `;

    const { data: altData, error: altError } = await supabase.rpc('exec_sql', { query });

    if (altError) {
      console.log('❌ No se puede acceder a las políticas directamente');
      console.log('Vamos a verificar si el cliente puede ver sus datos...\n');

      // Obtener un cliente de prueba
      const { data: cliente } = await supabase
        .from('client_fiscal_data')
        .select('id, user_id')
        .limit(1)
        .single();

      if (cliente) {
        console.log(`📌 Cliente de prueba: ${cliente.id}`);
        console.log(`📌 User ID: ${cliente.user_id}\n`);

        // Ver cargas de facturación
        const { data: cargas, error: e1 } = await supabase
          .from('client_facturacion_cargas')
          .select('*')
          .eq('client_id', cliente.id);

        console.log(`📊 Cargas de facturación: ${cargas?.length || 0}`);
        if (e1) console.log(`   Error: ${e1.message}`);

        // Ver resumen mensual
        const { data: resumen, error: e2 } = await supabase
          .from('client_facturacion_mensual_resumen')
          .select('*')
          .eq('client_id', cliente.id);

        console.log(`📊 Resúmenes mensuales: ${resumen?.length || 0}`);
        if (e2) console.log(`   Error: ${e2.message}`);
      }
    } else {
      console.log('Políticas encontradas:');
      console.log(JSON.stringify(altData, null, 2));
    }
  } else {
    console.log('Políticas RLS:');
    policies?.forEach(p => {
      console.log(`\n📋 ${p.tablename}.${p.policyname}`);
      console.log(`   Comando: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   Condición: ${p.qual || '(sin condición)'}`);
    });
  }
}

main().catch(console.error);
