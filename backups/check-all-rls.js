import { createClient } from '@supabase/supabase-js';

// Con anon key para simular usuario normal
const supabaseAnon = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
);

async function main() {
  console.log('\n🔐 Logueando como agustin@ixnova.com.ar...\n');

  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: 'agustin@ixnova.com.ar',
    password: 'Avanzaelleon2025!'
  });

  if (authError) {
    console.error('Error login:', authError.message);
    return;
  }

  console.log('✅ Logueado como:', authData.user.email);
  console.log('   User ID:', authData.user.id);

  console.log('\n🔍 Verificando acceso a tablas de facturación...\n');

  const tables = [
    'client_fiscal_data',
    'client_facturacion_cargas',
    'client_facturacion_mensual_resumen',
    'client_cuota_mensual',
    'client_facturas_detalle',
    'client_notas_internas',
    'alertas_config',
    'convenio_multilateral_vencimientos',
    'monotributo_categorias',
    'historial_cambio_categoria',
    'historial_cambios_cliente'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabaseAnon
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: ${error.code} - ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} registros accesibles`);
    }
  }

  await supabaseAnon.auth.signOut();
}

main().catch(console.error);
