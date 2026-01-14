import { createClient } from '@supabase/supabase-js';

// Proyecto VIEJO (USA)
const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.hTpBLoLEsE_6cH5oI5RflzGDRGwbKEwRWlwIEUqLfcQ'
);

async function main() {
  console.log('\n🔍 Verificando categorías en proyecto VIEJO (USA)...\n');

  try {
    // 1. Obtener clientes con su categoría
    const { data: clientes, error: e1 } = await supabaseOld
      .from('client_fiscal_data')
      .select('id, razon_social, categoria_actual_id, categoria_monotributo');

    if (e1) {
      console.log('❌ Error accediendo al proyecto viejo:', e1.message);
      return;
    }

    console.log('📊 Clientes en proyecto viejo:', clientes?.length || 0);
    clientes?.forEach(c => {
      console.log(`   ${c.razon_social}:`);
      console.log(`      categoria_actual_id: ${c.categoria_actual_id || '(null)'}`);
      console.log(`      categoria_monotributo: ${c.categoria_monotributo || '(null)'}`);
    });

    // 2. Obtener mapeo de categorías
    const { data: categorias } = await supabaseOld
      .from('monotributo_categorias')
      .select('id, categoria');

    console.log('\n📊 Mapeo de categorías (ID → Letra):');
    categorias?.forEach(c => console.log(`   ${c.id} → ${c.categoria}`));

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

main().catch(console.error);
