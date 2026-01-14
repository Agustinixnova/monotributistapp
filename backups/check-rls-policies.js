import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando RLS de client_fiscal_data...\n');

  // Obtener políticas RLS
  const { data: policies, error } = await supabaseNew
    .rpc('get_policies_for_table', { table_name: 'client_fiscal_data' });

  if (error) {
    console.log('No se pudo obtener políticas via RPC, intentando query directa...\n');

    // Query directa a pg_policies
    const { data: pgPolicies, error: pgError } = await supabaseNew
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'client_fiscal_data');

    if (pgError) {
      console.log('Error:', pgError.message);

      // Intentar con SQL raw
      console.log('\nIntentando verificar si is_full_access() funciona...');

      // Verificar las funciones de RLS
      const { data: funcs, error: funcError } = await supabaseNew
        .rpc('is_full_access');

      console.log('is_full_access() result:', funcs, funcError?.message);
    }
  }

  // Verificar el rol del usuario agustin
  console.log('\n📊 Verificando rol de agustin@ixnova.com.ar:');
  const { data: profile } = await supabaseNew
    .from('profiles')
    .select(`
      id,
      email,
      role_id,
      role:roles(id, name)
    `)
    .eq('email', 'agustin@ixnova.com.ar')
    .single();

  console.log('   Profile:', profile?.email);
  console.log('   Role ID:', profile?.role_id);
  console.log('   Role name:', profile?.role?.name);

  // Verificar la función is_full_access
  console.log('\n📊 Verificando funciones RLS...');

  // Ver si desarrollo está en is_full_access
  const { data: roles } = await supabaseNew
    .from('roles')
    .select('id, name')
    .in('name', ['admin', 'contadora_principal', 'desarrollo', 'comunicadora']);

  console.log('   Roles con acceso total esperado:', roles?.map(r => r.name).join(', '));

  // Simular query como usuario normal
  console.log('\n📊 Verificando si RLS está habilitado en client_fiscal_data...');

  const { data: rlsCheck } = await supabaseNew.rpc('check_table_rls', {
    p_table: 'client_fiscal_data'
  });

  if (!rlsCheck) {
    // Verificar directamente
    const { count } = await supabaseNew
      .from('client_fiscal_data')
      .select('*', { count: 'exact', head: true });

    console.log('   Registros visibles con service_role:', count);
  }
}

main().catch(console.error);
