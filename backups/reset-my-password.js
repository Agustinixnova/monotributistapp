import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔑 Reseteando password de agustin@ixnova.com.ar...\n');

  // Obtener el user ID
  const { data: { users }, error: listError } = await supabaseNew.auth.admin.listUsers();

  if (listError) {
    console.error('Error listando usuarios:', listError.message);
    return;
  }

  const user = users.find(u => u.email === 'agustin@ixnova.com.ar');

  if (!user) {
    console.error('❌ Usuario no encontrado');
    return;
  }

  console.log(`   User ID: ${user.id}`);

  // Resetear password
  const { data, error } = await supabaseNew.auth.admin.updateUserById(
    user.id,
    { password: 'Avanzaelleon2025!' }
  );

  if (error) {
    console.error('❌ Error reseteando password:', error.message);
    return;
  }

  console.log('   ✅ Password reseteado exitosamente!');
  console.log('\n   Podés hacer login con:');
  console.log('   Email: agustin@ixnova.com.ar');
  console.log('   Password: Avanzaelleon2025!\n');
}

main().catch(console.error);
