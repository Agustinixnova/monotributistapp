import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Campos de un cliente...\n');

  const { data: cliente } = await supabase
    .from('client_fiscal_data')
    .select('*')
    .limit(1)
    .single();

  console.log('Campos disponibles:');
  Object.keys(cliente).forEach(key => {
    const value = cliente[key];
    if (value !== null && value !== undefined && value !== '') {
      console.log(`   ${key}: ${value}`);
    } else {
      console.log(`   ${key}: (vacío/null)`);
    }
  });
}

main().catch(console.error);
