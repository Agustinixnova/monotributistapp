import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando RLS de profiles y roles...\n');

  // Obtener todos los usuarios
  const { data: profiles, error: e1 } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido, role_id')
    .eq('is_active', true);

  console.log(`📊 Profiles activos: ${profiles?.length || 0}`);
  if (e1) console.log(`   Error: ${e1.message}`);

  // Intentar query con join como lo hace destinatariosService
  const { data: withJoin, error: e2 } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!role_id(name)
    `)
    .eq('is_active', true)
    .eq('roles.name', 'monotributista')
    .order('nombre');

  console.log(`\n📊 Query con join (monotributistas): ${withJoin?.length || 0}`);
  if (e2) console.log(`   Error: ${e2.message}\n`);
  else withJoin?.forEach(u => console.log(`   - ${u.nombre} ${u.apellido} (${u.email})`));

  // Verificar tabla roles
  const { data: roles, error: e3 } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', 'monotributista');

  console.log(`\n📊 Rol monotributista existe: ${roles?.length > 0 ? 'SÍ' : 'NO'}`);
  if (e3) console.log(`   Error: ${e3.message}`);
  if (roles?.length > 0) console.log(`   ID: ${roles[0].id}`);

  // Contar profiles por rol
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('is_active', true);

  const roleIdMonotributista = roles?.[0]?.id;
  const countMonotributistas = allProfiles?.filter(p => p.role_id === roleIdMonotributista).length || 0;

  console.log(`\n📊 Profiles con rol monotributista: ${countMonotributistas}`);
}

main().catch(console.error);
