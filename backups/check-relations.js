import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando relaciones...\n');

  // Obtener profiles
  const { data: profiles } = await supabaseNew.from('profiles').select('id, email');
  console.log('📊 Profiles:', profiles.length);
  profiles.forEach(p => console.log(`   ${p.email} → ${p.id}`));

  // Obtener client_fiscal_data
  console.log('\n📊 Client Fiscal Data:');
  const { data: clients } = await supabaseNew.from('client_fiscal_data').select('id, user_id, razon_social');
  console.log('Total:', clients.length);

  clients.forEach(c => {
    const profile = profiles.find(p => p.id === c.user_id);
    if (profile) {
      console.log(`   ✅ ${c.razon_social} → user_id: ${c.user_id} (${profile.email})`);
    } else {
      console.log(`   ❌ ${c.razon_social} → user_id: ${c.user_id} (NO ENCONTRADO EN PROFILES!)`);
    }
  });
}

main().catch(console.error);
