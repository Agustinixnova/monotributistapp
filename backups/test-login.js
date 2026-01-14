import { createClient } from '@supabase/supabase-js';

// Cliente con ANON KEY (como usa el frontend)
const supabaseAnon = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
);

async function main() {
  console.log('\n🧪 Probando login con ANON KEY (como el frontend)...\n');

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: 'agustin@ixnova.com.ar',
    password: 'Avanzaelleon2025!'
  });

  if (error) {
    console.error('❌ Error en login:');
    console.error('   Código:', error.status);
    console.error('   Mensaje:', error.message);
    console.error('   Nombre:', error.name);

    if (error.__isAuthError) {
      console.error('   Es AuthError:', true);
    }

    console.error('\n📋 Detalles completos del error:');
    console.error(JSON.stringify(error, null, 2));
    return;
  }

  console.log('✅ Login exitoso!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log('   Access Token:', data.session.access_token.substring(0, 50) + '...');
  console.log('\n🎉 Todo funciona correctamente!\n');
}

main().catch(console.error);
