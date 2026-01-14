import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Debug de facturación...\n');

  // 1. Verificar clientes monotributistas
  const { data: clientes, error: e1 } = await supabase
    .from('client_fiscal_data')
    .select('id, razon_social, tipo_contribuyente, categoria_monotributo')
    .eq('tipo_contribuyente', 'monotributista');

  console.log('📊 Clientes monotributistas:', clientes?.length || 0);
  if (e1) console.log('   Error:', e1.message);
  clientes?.forEach(c => console.log(`   ${c.id} → ${c.razon_social} (Cat ${c.categoria_monotributo})`));

  // 2. Verificar resúmenes mensuales
  console.log('\n📊 Resúmenes mensuales:');
  const { data: resumenes, error: e2 } = await supabase
    .from('client_facturacion_mensual_resumen')
    .select('client_id, anio, mes, total_neto')
    .order('anio', { ascending: false })
    .order('mes', { ascending: false })
    .limit(10);

  if (e2) console.log('   Error:', e2.message);
  resumenes?.forEach(r => console.log(`   ${r.client_id} → ${r.anio}/${r.mes}: $${r.total_neto}`));

  // 3. Verificar si los client_id del resumen coinciden con client_fiscal_data
  console.log('\n📊 Verificando coincidencias:');
  const clienteIds = new Set(clientes?.map(c => c.id) || []);
  const resumenClientIds = [...new Set(resumenes?.map(r => r.client_id) || [])];

  resumenClientIds.forEach(id => {
    if (clienteIds.has(id)) {
      const cliente = clientes.find(c => c.id === id);
      console.log(`   ✅ ${id} → ${cliente?.razon_social}`);
    } else {
      console.log(`   ❌ ${id} → NO existe en client_fiscal_data`);
    }
  });

  // 4. Verificar categorías
  console.log('\n📊 Categorías vigentes:');
  const { data: categorias } = await supabase
    .from('monotributo_categorias')
    .select('categoria, tope_facturacion_anual')
    .is('vigente_hasta', null);

  categorias?.forEach(c => console.log(`   Cat ${c.categoria}: $${c.tope_facturacion_anual}`));
}

main().catch(console.error);
