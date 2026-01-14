import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

// Test con el primer cliente
const testClientId = '503651f7-16e8-462b-8c07-6aaf070eae1d'; // Rosana Enriquez

async function main() {
  console.log('\n🔍 Probando getClienteDetalle...\n');
  console.log('Client ID:', testClientId);

  // Datos fiscales con perfil
  const { data: fiscal, error } = await supabaseNew
    .from('client_fiscal_data')
    .select(`
      *,
      user:profiles!user_id(
        *,
        role:roles(*),
        contador:profiles!assigned_to(id, nombre, apellido, email, telefono)
      )
    `)
    .eq('id', testClientId)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles:', error.details);
    return;
  }

  console.log('✅ Datos obtenidos correctamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`   Razón social: ${fiscal.razon_social}`);
  console.log(`   CUIT: ${fiscal.cuit}`);
  console.log(`   Categoría: ${fiscal.categoria_monotributo}`);
  console.log(`   User ID: ${fiscal.user_id}`);
  console.log('');
  console.log('👤 Perfil del usuario:');
  console.log(`   Nombre: ${fiscal.user?.nombre} ${fiscal.user?.apellido}`);
  console.log(`   Email: ${fiscal.user?.email}`);
  console.log(`   Role: ${fiscal.user?.role?.name}`);
  console.log(`   Activo: ${fiscal.user?.is_active}`);

  // Probar historial de categorías
  const { data: historial, error: histError } = await supabaseNew
    .from('historial_cambio_categoria')
    .select(`
      *,
      created_by_profile:profiles!realizado_por(nombre, apellido)
    `)
    .eq('client_id', testClientId)
    .order('fecha_cambio', { ascending: false });

  if (histError) {
    console.log('\n⚠️ Historial categorías error:', histError.message);
  } else {
    console.log('\n📜 Historial de categorías:', historial?.length || 0, 'registros');
  }

  // Probar locales
  const { data: locales, error: localesError } = await supabaseNew
    .from('client_locales')
    .select('*')
    .eq('client_id', testClientId);

  if (localesError) {
    console.log('\n⚠️ Locales error:', localesError.message);
  } else {
    console.log('🏢 Locales:', locales?.length || 0, 'registros');
  }

  // Probar grupo familiar
  const { data: grupo, error: grupoError } = await supabaseNew
    .from('client_grupo_familiar')
    .select('*')
    .eq('client_id', testClientId);

  if (grupoError) {
    console.log('\n⚠️ Grupo familiar error:', grupoError.message);
  } else {
    console.log('👨‍👩‍👧 Grupo familiar:', grupo?.length || 0, 'registros');
  }

  console.log('\n✅ Todo funciona correctamente!');
}

main().catch(console.error);
