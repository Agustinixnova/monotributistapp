import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function count(table) {
  const { count, error } = await supabaseNew.from(table).select('*', { count: 'exact', head: true });
  return error ? 0 : count;
}

async function main() {
  console.log('\n📊 Datos migrados en proyecto nuevo (São Paulo):\n');

  const tables = [
    'profiles',
    'user_module_access',
    'client_fiscal_data',
    'client_facturacion_cargas',
    'client_cuota_mensual',
    'client_locales',
    'client_notifications',
    'historial_cambios_cliente',
    'buzon_conversaciones',
    'buzon_participantes',
    'buzon_mensajes',
    'educacion_articulos',
    'educacion_adjuntos'
  ];

  for (const table of tables) {
    const total = await count(table);
    console.log(`   ${table.padEnd(30)} ${total} registros`);
  }

  console.log('\n');
}

main().catch(console.error);
