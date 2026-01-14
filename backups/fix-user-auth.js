import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔧 Verificando y corrigiendo usuario...\n');

  // Obtener el usuario
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

  console.log('📊 Estado actual del usuario:');
  console.log(`   - Email: ${user.email}`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Email confirmado: ${user.email_confirmed_at ? 'SÍ' : 'NO'}`);
  console.log(`   - Phone confirmado: ${user.phone_confirmed_at ? 'SÍ' : 'NO'}`);
  console.log(`   - Banned: ${user.banned_until ? 'SÍ' : 'NO'}`);
  console.log(`   - Último login: ${user.last_sign_in_at || 'Nunca'}`);

  // Actualizar usuario para asegurar que esté confirmado y activo
  console.log('\n🔄 Actualizando usuario...');

  const { data, error } = await supabaseNew.auth.admin.updateUserById(
    user.id,
    {
      password: 'Avanzaelleon2025!',
      email_confirm: true,
      ban_duration: 'none'
    }
  );

  if (error) {
    console.error('❌ Error actualizando usuario:', error.message);
    return;
  }

  console.log('✅ Usuario actualizado correctamente!');
  console.log('\n📋 Intentá hacer login con:');
  console.log('   Email: agustin@ixnova.com.ar');
  console.log('   Password: Avanzaelleon2025!\n');
}

main().catch(console.error);
