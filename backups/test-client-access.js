import { createClient } from '@supabase/supabase-js';

// Cliente con credenciales del cliente de prueba
const clientSupabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.xgIyPOACtilf_tNsQy-yEA3T6vc-uT7yqvH_D0cZXG0'
);

// Admin con service role
const adminSupabase = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

async function main() {
  console.log('\n🔍 Test de acceso a facturación para cliente...\n');

  // Obtener último cliente creado
  const { data: cliente } = await adminSupabase
    .from('client_fiscal_data')
    .select('id, user_id, razon_social')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!cliente) {
    console.log('❌ No hay clientes');
    return;
  }

  console.log(`📌 Cliente: ${cliente.razon_social}`);
  console.log(`📌 Client ID: ${cliente.id}`);
  console.log(`📌 User ID: ${cliente.user_id}\n`);

  // Obtener email del usuario
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('email')
    .eq('id', cliente.user_id)
    .single();

  console.log(`📧 Email: ${profile?.email}\n`);

  // Ver cuántas cargas tiene como ADMIN
  const { data: cargasAdmin, error: e1 } = await adminSupabase
    .from('client_facturacion_cargas')
    .select('*')
    .eq('client_id', cliente.id);

  console.log(`👨‍💼 Admin ve ${cargasAdmin?.length || 0} cargas`);
  if (e1) console.log(`   Error admin: ${e1.message}`);

  // Ver resumen como ADMIN
  const { data: resumenAdmin, error: e2 } = await adminSupabase
    .from('client_facturacion_mensual_resumen')
    .select('*')
    .eq('client_id', cliente.id);

  console.log(`👨‍💼 Admin ve ${resumenAdmin?.length || 0} resúmenes mensuales`);
  if (e2) console.log(`   Error admin: ${e2.message}`);

  console.log(`\n${'='.repeat(60)}\n`);
  console.log(`⚠️  Ahora probá hacer login con: ${profile?.email}`);
  console.log(`    Y verificá si ves tus ${cargasAdmin?.length || 0} cargas en el módulo de Facturación\n`);
  console.log(`📝 Si NO ves las cargas, el problema es RLS`);
  console.log(`📝 Si SÍ ves las cargas, el problema es en el frontend\n`);
}

main().catch(console.error);
