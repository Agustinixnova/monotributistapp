import { createClient } from '@supabase/supabase-js';

const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('🔧 Insertando roles faltantes...\n');

  const { data: oldRoles } = await supabaseOld.from('roles').select('*');
  const { data: newRoles } = await supabaseNew.from('roles').select('name');

  const newRoleNames = newRoles.map(r => r.name);
  const missingRoles = oldRoles.filter(r => !newRoleNames.includes(r.name));

  if (missingRoles.length === 0) {
    console.log('✅ No hay roles faltantes!');
    return;
  }

  console.log(`📋 Roles que faltan: ${missingRoles.map(r => r.name).join(', ')}\n`);

  for (const role of missingRoles) {
    console.log(`📦 Insertando: ${role.name}...`);

    // NO incluir id para que se genere uno nuevo
    const { id, ...roleData } = role;

    const { error } = await supabaseNew
      .from('roles')
      .insert(roleData);

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Insertado`);
    }
  }

  console.log('\n✅ Roles faltantes insertados!');
}

main().catch(console.error);
