import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando usuarios y datos fiscales recientes...\n');

  // Últimos usuarios creados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('📊 Últimos 5 perfiles:');
  profiles?.forEach(p => console.log(`   ${p.email} - ${p.nombre} ${p.apellido} (${p.created_at})`));

  // Últimos datos fiscales
  const { data: fiscal } = await supabase
    .from('client_fiscal_data')
    .select('id, user_id, razon_social, cuit, categoria_monotributo, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📊 Últimos 5 client_fiscal_data:');
  fiscal?.forEach(f => console.log(`   ${f.razon_social} - CUIT: ${f.cuit} - Cat: ${f.categoria_monotributo} (${f.created_at})`));

  // Verificar si hay perfiles sin datos fiscales
  console.log('\n📊 Verificando perfiles sin datos fiscales...');

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, role_id');

  const { data: roles } = await supabase
    .from('roles')
    .select('id, name')
    .in('name', ['monotributista', 'responsable_inscripto']);

  const clientRoleIds = roles?.map(r => r.id) || [];

  const { data: allFiscal } = await supabase
    .from('client_fiscal_data')
    .select('user_id');

  const fiscalUserIds = new Set(allFiscal?.map(f => f.user_id) || []);

  const clientesWithoutFiscal = allProfiles?.filter(p =>
    clientRoleIds.includes(p.role_id) && !fiscalUserIds.has(p.id)
  ) || [];

  console.log(`   Clientes sin datos fiscales: ${clientesWithoutFiscal.length}`);
  clientesWithoutFiscal.forEach(p => console.log(`      - ${p.email}`));
}

main().catch(console.error);
