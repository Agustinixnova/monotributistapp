import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando tablas de facturación...\n');

  const tablesToCheck = [
    'client_facturacion_cargas',
    'client_facturacion_resumen_mensual',
    'client_facturacion_mensual_resumen',
    'client_cuota_mensual',
    'client_facturas_detalle'
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabaseNew
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: existe`);
    }
  }
}

main().catch(console.error);
