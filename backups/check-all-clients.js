import { createClient } from '@supabase/supabase-js';

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Verificando todos los datos...\n');

  // 1. Contar profiles
  const { data: profiles, error: profError } = await supabaseNew
    .from('profiles')
    .select('id, email, nombre, apellido, role_id, is_active');

  console.log('📊 PROFILES:', profiles?.length || 0);

  // 2. Obtener roles de cliente
  const { data: roles } = await supabaseNew
    .from('roles')
    .select('id, name')
    .in('name', ['monotributista', 'responsable_inscripto']);

  const rolesClienteIds = new Set(roles?.map(r => r.id) || []);
  console.log('   Roles de cliente:', roles?.map(r => `${r.name}(${r.id})`).join(', '));

  // 3. Contar profiles con rol de cliente
  const profilesCliente = profiles?.filter(p => rolesClienteIds.has(p.role_id) && p.is_active) || [];
  console.log('   Profiles con rol cliente activos:', profilesCliente.length);

  // 4. Contar client_fiscal_data
  const { data: fiscalData, error: fiscalError } = await supabaseNew
    .from('client_fiscal_data')
    .select('id, user_id, razon_social, cuit');

  console.log('\n📊 CLIENT_FISCAL_DATA:', fiscalData?.length || 0);

  // 5. Verificar cuántos profiles de cliente tienen fiscal data
  const fiscalUserIds = new Set(fiscalData?.map(f => f.user_id) || []);

  const conFiscal = profilesCliente.filter(p => fiscalUserIds.has(p.id));
  const sinFiscal = profilesCliente.filter(p => !fiscalUserIds.has(p.id));

  console.log('\n📊 RESUMEN:');
  console.log(`   Clientes CON fiscal data: ${conFiscal.length}`);
  console.log(`   Clientes SIN fiscal data: ${sinFiscal.length}`);

  console.log('\n✅ Clientes CON fiscal data:');
  conFiscal.forEach(p => {
    const fiscal = fiscalData.find(f => f.user_id === p.id);
    console.log(`   - ${p.nombre} ${p.apellido} (${p.email}) → CUIT: ${fiscal?.cuit || 'N/A'}`);
  });

  console.log('\n⚠️ Clientes SIN fiscal data (deberían tener banner amarillo):');
  sinFiscal.forEach(p => {
    console.log(`   - ${p.nombre} ${p.apellido} (${p.email})`);
  });

  // 6. Total que debería mostrar Mi Cartera
  console.log('\n📊 TOTAL en Mi Cartera:', profilesCliente.length);
}

main().catch(console.error);
