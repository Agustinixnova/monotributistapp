import { createClient } from '@supabase/supabase-js';

// Proyecto ACTUAL (USA) - usando SERVICE_ROLE key para acceso completo
const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

// Proyecto NUEVO (São Paulo) - usando SERVICE_ROLE key para acceso completo
const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

// Tablas en orden de dependencias
const tables = [
  'roles',
  'modules',
  'monotributo_categorias',
  'role_default_modules',
  'role_permissions',
  'subscription_plans',
  'profiles',
  'subscriptions',
  'user_module_access',
  'client_fiscal_data',
  'client_facturacion_cargas',
  'client_facturacion_resumen_mensual',
  'client_cuota_mensual',
  'historial_cambio_categoria',
  'historial_cambios_cliente',
  'client_notas_internas',
  'client_locales',
  'client_grupo_familiar',
  'client_sugerencias_cambio',
  'client_notifications',
  'notificaciones',
  'buzon_conversaciones',
  'buzon_participantes',
  'buzon_mensajes',
  'buzon_adjuntos',
  'convenio_multilateral_vencimientos',
  'educacion_categorias',
  'educacion_articulos',
  'educacion_adjuntos',
  'invoices',
  'payments',
  'app_settings'
];

async function migrateTable(tableName) {
  try {
    console.log(`\n📦 Migrando tabla: ${tableName}`);

    // 1. Obtener datos del proyecto actual
    const { data, error } = await supabaseOld
      .from(tableName)
      .select('*');

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ⚠️  Tabla ${tableName} no existe o está vacía`);
        return { success: true, count: 0 };
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`   ℹ️  Tabla ${tableName} está vacía`);
      return { success: true, count: 0 };
    }

    console.log(`   ✓ Leídos ${data.length} registros`);

    // 2. Insertar en proyecto nuevo
    const { error: insertError } = await supabaseNew
      .from(tableName)
      .insert(data);

    if (insertError) {
      console.error(`   ❌ Error insertando en ${tableName}:`, insertError);
      return { success: false, count: 0, error: insertError };
    }

    console.log(`   ✅ ${data.length} registros migrados exitosamente`);
    return { success: true, count: data.length };

  } catch (error) {
    console.error(`   ❌ Error en tabla ${tableName}:`, error.message);
    return { success: false, count: 0, error };
  }
}

async function main() {
  console.log('🚀 Iniciando migración de datos...\n');
  console.log('Proyecto origen: hymhyqwylgjmqbvuyutd (USA)');
  console.log('Proyecto destino: nhwiezngaprzoqcvutbx (São Paulo)\n');
  console.log('='.repeat(60));

  const results = [];
  let totalRecords = 0;

  for (const table of tables) {
    const result = await migrateTable(table);
    results.push({ table, ...result });
    if (result.success) {
      totalRecords += result.count;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMEN DE MIGRACIÓN\n');

  const successful = results.filter(r => r.success && r.count > 0);
  const empty = results.filter(r => r.success && r.count === 0);
  const failed = results.filter(r => !r.success);

  console.log('✅ Tablas migradas exitosamente:');
  successful.forEach(r => {
    console.log(`   - ${r.table}: ${r.count} registros`);
  });

  if (empty.length > 0) {
    console.log('\nℹ️  Tablas vacías (esperado):');
    empty.forEach(r => console.log(`   - ${r.table}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Tablas con errores:');
    failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.error?.message || 'Error desconocido'}`);
    });
  }

  console.log(`\n📈 Total de registros migrados: ${totalRecords}`);
  console.log('\n🎉 Migración completada!\n');
}

main().catch(console.error);
