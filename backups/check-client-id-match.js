import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando si client_id coinciden...\n');

  // Obtener IDs de client_fiscal_data
  const { data: fiscalData } = await supabaseNew
    .from('client_fiscal_data')
    .select('id, razon_social');

  console.log('📊 IDs en client_fiscal_data:');
  fiscalData.forEach(f => console.log(`   ${f.id} → ${f.razon_social}`));

  // Obtener client_id únicos en facturacion_cargas
  const { data: cargas } = await supabaseNew
    .from('client_facturacion_cargas')
    .select('client_id')
    .limit(100);

  const cargasClientIds = [...new Set(cargas.map(c => c.client_id))];
  console.log('\n📊 client_id únicos en client_facturacion_cargas:');
  cargasClientIds.forEach(id => console.log(`   ${id}`));

  // Verificar cuántos coinciden
  const fiscalIds = new Set(fiscalData.map(f => f.id));
  const matches = cargasClientIds.filter(id => fiscalIds.has(id));
  const noMatches = cargasClientIds.filter(id => !fiscalIds.has(id));

  console.log(`\n✅ Coinciden: ${matches.length}`);
  console.log(`❌ NO coinciden: ${noMatches.length}`);

  if (noMatches.length > 0) {
    console.log('\n❌ IDs en facturacion que NO existen en client_fiscal_data:');
    noMatches.forEach(id => console.log(`   ${id}`));
  }
}

main().catch(console.error);
