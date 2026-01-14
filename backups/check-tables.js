import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando tablas de historial...\n');

  // Listar todas las tablas
  const { data: tables, error } = await supabaseNew
    .rpc('get_tables_list');

  if (error) {
    console.log('Intentando query directa...');

    // Probar tablas específicas
    const tablesToCheck = [
      'historial_cambio_categoria',
      'client_historial_categorias',
      'historial_cambios_cliente'
    ];

    for (const tableName of tablesToCheck) {
      const { data, error: tableError } = await supabaseNew
        .from(tableName)
        .select('*')
        .limit(1);

      if (tableError) {
        console.log(`❌ ${tableName}: ${tableError.message}`);
      } else {
        console.log(`✅ ${tableName}: existe (${data?.length || 0} registros de muestra)`);
      }
    }
  }

  // Verificar estructura de historial_cambio_categoria
  console.log('\n📊 Estructura de historial_cambio_categoria:');
  const { data: historial, error: histError } = await supabaseNew
    .from('historial_cambio_categoria')
    .select('*')
    .limit(3);

  if (histError) {
    console.log('Error:', histError.message);
  } else {
    console.log('Registros:', historial?.length || 0);
    if (historial && historial.length > 0) {
      console.log('Columnas:', Object.keys(historial[0]));
    }
  }

  // Verificar estructura de historial_cambios_cliente
  console.log('\n📊 Estructura de historial_cambios_cliente:');
  const { data: cambios, error: cambiosError } = await supabaseNew
    .from('historial_cambios_cliente')
    .select('*')
    .limit(3);

  if (cambiosError) {
    console.log('Error:', cambiosError.message);
  } else {
    console.log('Registros:', cambios?.length || 0);
    if (cambios && cambios.length > 0) {
      console.log('Columnas:', Object.keys(cambios[0]));
    }
  }
}

main().catch(console.error);
