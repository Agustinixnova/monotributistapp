import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Listando TODAS las tablas con "facturacion" o "resumen"...\n');

  // Query directo a pg_tables
  const { data, error } = await supabaseNew
    .rpc('get_all_tables');

  if (error) {
    console.log('RPC no disponible, probando query a tablas conocidas...\n');

    // Listar todas las tablas que empiezan con client_
    const tables = [
      'client_facturacion_cargas',
      'client_facturacion_resumen_mensual',
      'client_facturacion_mensual_resumen',
      'client_facturacion_mensual',
      'client_cuota_mensual'
    ];

    for (const t of tables) {
      try {
        const { count, error: e } = await supabaseNew
          .from(t)
          .select('*', { count: 'exact', head: true });

        if (e) {
          console.log(`❌ ${t}: ${e.code} - ${e.message}`);
        } else {
          console.log(`✅ ${t}: ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ ${t}: ${err.message}`);
      }
    }
  }

  // Verificar si es una VIEW en lugar de tabla
  console.log('\n📊 Verificando client_facturacion_resumen_mensual específicamente:');

  const { data: testData, error: testError } = await supabaseNew
    .from('client_facturacion_resumen_mensual')
    .select('*')
    .limit(1);

  if (testError) {
    console.log('Error:', testError);
  } else {
    console.log('Datos:', testData);
    console.log('La tabla/view existe y es accesible');
  }
}

main().catch(console.error);
