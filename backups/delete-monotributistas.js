import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🗑️  Eliminando usuarios con rol monotributista...\n');

  // 1. Obtener el ID del rol monotributista
  const { data: roles } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', 'monotributista')
    .single();

  if (!roles) {
    console.log('❌ No se encontró el rol monotributista');
    return;
  }

  console.log(`📌 Rol monotributista ID: ${roles.id}`);

  // 2. Obtener usuarios con ese rol
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, email, nombre, apellido')
    .eq('role_id', roles.id);

  if (!usuarios || usuarios.length === 0) {
    console.log('✅ No hay usuarios monotributistas para eliminar');
    return;
  }

  console.log(`\n📊 Usuarios a eliminar: ${usuarios.length}`);
  usuarios.forEach(u => console.log(`   - ${u.email} (${u.nombre} ${u.apellido})`));

  const userIds = usuarios.map(u => u.id);

  // 3. Obtener los client_fiscal_data IDs
  const { data: fiscalData } = await supabase
    .from('client_fiscal_data')
    .select('id')
    .in('user_id', userIds);

  const clientIds = fiscalData?.map(f => f.id) || [];
  console.log(`\n📌 Client IDs encontrados: ${clientIds.length}`);

  if (clientIds.length > 0) {
    // 4. Eliminar historial de cambios de categoria
    console.log('🗑️  Eliminando historial_cambio_categoria...');
    const { error: e0 } = await supabase
      .from('historial_cambio_categoria')
      .delete()
      .in('client_id', clientIds);
    if (e0) console.log('   Error:', e0.message);
    else console.log('   ✅ Eliminados');

    // 5. Eliminar cargas de facturación
    console.log('🗑️  Eliminando client_facturacion_cargas...');
    const { error: e1 } = await supabase
      .from('client_facturacion_cargas')
      .delete()
      .in('client_id', clientIds);
    if (e1) console.log('   Error:', e1.message);
    else console.log('   ✅ Eliminados');

    // 6. Eliminar resumen mensual
    console.log('🗑️  Eliminando client_facturacion_mensual_resumen...');
    const { error: e2 } = await supabase
      .from('client_facturacion_mensual_resumen')
      .delete()
      .in('client_id', clientIds);
    if (e2) console.log('   Error:', e2.message);
    else console.log('   ✅ Eliminados');

    // 7. Eliminar cuotas mensuales
    console.log('🗑️  Eliminando client_cuota_mensual...');
    const { error: e3 } = await supabase
      .from('client_cuota_mensual')
      .delete()
      .in('client_id', clientIds);
    if (e3) console.log('   Error:', e3.message);
    else console.log('   ✅ Eliminados');

    // 8. Eliminar locales
    console.log('🗑️  Eliminando client_locales...');
    const { error: e4 } = await supabase
      .from('client_locales')
      .delete()
      .in('client_id', clientIds);
    if (e4) console.log('   Error:', e4.message);
    else console.log('   ✅ Eliminados');

    // 9. Eliminar grupo familiar
    console.log('🗑️  Eliminando client_grupo_familiar...');
    const { error: e5 } = await supabase
      .from('client_grupo_familiar')
      .delete()
      .in('client_id', clientIds);
    if (e5) console.log('   Error:', e5.message);
    else console.log('   ✅ Eliminados');

    // 10. Eliminar sugerencias
    console.log('🗑️  Eliminando client_sugerencias_cambio...');
    const { error: e6 } = await supabase
      .from('client_sugerencias_cambio')
      .delete()
      .in('client_id', clientIds);
    if (e6) console.log('   Error:', e6.message);
    else console.log('   ✅ Eliminados');

    // 11. Eliminar notas internas
    console.log('🗑️  Eliminando client_notas_internas...');
    const { error: e7 } = await supabase
      .from('client_notas_internas')
      .delete()
      .in('client_id', clientIds);
    if (e7) console.log('   Error:', e7.message);
    else console.log('   ✅ Eliminados');

    // 12. Eliminar notificaciones (por client_id)
    console.log('🗑️  Eliminando client_notifications...');
    const { error: e8 } = await supabase
      .from('client_notifications')
      .delete()
      .in('client_id', clientIds);
    if (e8) console.log('   Error:', e8.message);
    else console.log('   ✅ Eliminados');

    // 13. Eliminar datos fiscales
    console.log('🗑️  Eliminando client_fiscal_data...');
    const { error: e9 } = await supabase
      .from('client_fiscal_data')
      .delete()
      .in('user_id', userIds);
    if (e9) console.log('   Error:', e9.message);
    else console.log('   ✅ Eliminados');
  }

  // 14. Eliminar user_module_access
  console.log('🗑️  Eliminando user_module_access...');
  const { error: e10 } = await supabase
    .from('user_module_access')
    .delete()
    .in('user_id', userIds);
  if (e10) console.log('   Error:', e10.message);
  else console.log('   ✅ Eliminados');

  // 15. Eliminar buzón mensajes (enviados por estos usuarios)
  console.log('🗑️  Eliminando buzon_mensajes...');
  const { error: e11a } = await supabase
    .from('buzon_mensajes')
    .delete()
    .in('enviado_por', userIds);
  if (e11a) console.log('   Error:', e11a.message);
  else console.log('   ✅ Eliminados');

  // 16. Eliminar buzón participantes
  console.log('🗑️  Eliminando buzon_participantes...');
  const { error: e11 } = await supabase
    .from('buzon_participantes')
    .delete()
    .in('user_id', userIds);
  if (e11) console.log('   Error:', e11.message);
  else console.log('   ✅ Eliminados');

  // 17. Eliminar profiles
  console.log('🗑️  Eliminando profiles...');
  const { error: e12 } = await supabase
    .from('profiles')
    .delete()
    .in('id', userIds);
  if (e12) console.log('   Error:', e12.message);
  else console.log('   ✅ Eliminados');

  // 18. Eliminar de auth.users
  console.log('🗑️  Eliminando de auth.users...');
  let authDeleted = 0;
  for (const userId of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.log(`   Error eliminando ${userId}:`, error.message);
    } else {
      authDeleted++;
    }
  }
  console.log(`   ✅ ${authDeleted}/${userIds.length} eliminados de auth`);

  console.log('\n✅ Limpieza completada!\n');

  // Verificar
  const { data: remaining } = await supabase
    .from('profiles')
    .select('email')
    .eq('role_id', roles.id);

  console.log(`📊 Usuarios monotributistas restantes: ${remaining?.length || 0}`);
}

main().catch(console.error);
