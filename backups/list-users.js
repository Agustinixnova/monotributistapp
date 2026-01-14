import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n👥 Usuarios en proyecto São Paulo:\n');

  const { data: { users }, error } = await supabaseNew.auth.admin.listUsers();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  // Obtener profiles para ver roles
  const { data: profiles } = await supabaseNew.from('profiles').select('id, email, nombre, apellido');
  const { data: roles } = await supabaseNew.from('roles').select('*');

  users.forEach(user => {
    const profile = profiles.find(p => p.id === user.id);
    console.log(`   ${user.email}`);
    if (profile) {
      console.log(`      - Nombre: ${profile.nombre} ${profile.apellido}`);
    }
  });

  console.log(`\n   Total: ${users.length} usuarios\n`);
}

main().catch(console.error);
