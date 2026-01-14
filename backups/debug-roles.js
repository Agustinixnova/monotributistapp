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
  console.log('🔍 Debug de roles...\n');

  const { data: oldRoles } = await supabaseOld.from('roles').select('*');
  const { data: newRoles } = await supabaseNew.from('roles').select('*');

  console.log('📊 Roles en proyecto VIEJO:');
  oldRoles.forEach(r => console.log(`   ${r.name} (${r.id})`));

  console.log('\n📊 Roles en proyecto NUEVO:');
  newRoles.forEach(r => console.log(`   ${r.name} (${r.id})`));

  console.log('\n🔗 Mapeo:');
  oldRoles.forEach(oldRole => {
    const newRole = newRoles.find(r => r.name === oldRole.name);
    if (newRole) {
      console.log(`   ✓ ${oldRole.name}: ${oldRole.id} -> ${newRole.id}`);
    } else {
      console.log(`   ❌ ${oldRole.name}: ${oldRole.id} -> NO ENCONTRADO`);
    }
  });

  // Verificar profiles
  const { data: oldProfiles } = await supabaseOld.from('profiles').select('id, email, role_id');

  console.log('\n📊 Roles usados en profiles:');
  const roleIdsUsed = [...new Set(oldProfiles.map(p => p.role_id))];
  roleIdsUsed.forEach(roleId => {
    const role = oldRoles.find(r => r.id === roleId);
    const count = oldProfiles.filter(p => p.role_id === roleId).length;
    console.log(`   ${role ? role.name : 'DESCONOCIDO'} (${roleId}): ${count} usuarios`);
  });
}

main().catch(console.error);
