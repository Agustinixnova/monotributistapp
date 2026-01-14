import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando IDs de client_fiscal_data...\n');

  // Obtener client_fiscal_data con sus IDs
  const { data: clients, error } = await supabaseNew
    .from('client_fiscal_data')
    .select(`
      id,
      user_id,
      razon_social,
      cuit,
      user:profiles!user_id(
        id,
        nombre,
        apellido,
        email
      )
    `);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('📊 Client Fiscal Data (con IDs):');
  console.log('Total:', clients.length);
  console.log('\n');

  clients.forEach(c => {
    console.log(`📋 ${c.razon_social || 'Sin nombre'}`);
    console.log(`   client_fiscal_data.id: ${c.id}`);
    console.log(`   user_id: ${c.user_id}`);
    console.log(`   Profile match: ${c.user ? `✅ ${c.user.nombre} ${c.user.apellido} (${c.user.email})` : '❌ NO MATCH'}`);
    console.log(`   URL para detalle: /mi-cartera/${c.id}`);
    console.log('');
  });

  // Verificar si los IDs de client_fiscal_data son UUIDs válidos
  console.log('\n🔗 Verificando estructura de IDs:');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  clients.forEach(c => {
    const isValidUuid = uuidRegex.test(c.id);
    console.log(`   ${c.id}: ${isValidUuid ? '✅ UUID válido' : '❌ NO es UUID'}`);
  });
}

main().catch(console.error);
