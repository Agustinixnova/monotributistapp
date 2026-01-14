import { createClient } from '@supabase/supabase-js';

// Proyecto ACTUAL (USA) - usando SERVICE_ROLE key
const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

// Proyecto NUEVO (São Paulo) - usando SERVICE_ROLE key
const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

// Mapeo de columnas: VIEJO -> NUEVO (para compatibilidad)
const columnMappings = {
  profiles: {
    exclude: ['codigo_postal', 'direccion', 'localidad', 'provincia'] // Columnas que existen en viejo pero no en nuevo
  },
  monotributo_categorias: {
    exclude: ['periodo_id'] // Columna que existe en viejo pero no en nuevo
  }
};

// Configuración de conflictos para UPSERT
const upsertConfig = {
  roles: 'name',
  modules: 'slug',
  monotributo_categorias: 'id',
  subscription_plans: 'plan_key',
  app_settings: 'key'
};

// Datos seed que ya existen (hacer UPSERT)
const upsertTables = ['roles', 'modules', 'monotributo_categorias', 'subscription_plans', 'app_settings'];

async function copyAuthUsers() {
  console.log('\n👤 Copiando auth.users (usuarios con passwords)...');

  try {
    // Leer usuarios de auth.users
    const { data: users, error } = await supabaseOld.auth.admin.listUsers();

    if (error) throw error;

    console.log(`   ✓ Encontrados ${users.users.length} usuarios`);

    // Crear cada usuario en el proyecto nuevo
    let copied = 0;
    for (const user of users.users) {
      const { data, error: createError } = await supabaseNew.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
        // Usar el password hash del usuario original
        password: user.encrypted_password || 'temporal123' // Fallback temporal
      });

      if (createError) {
        if (createError.message.includes('already registered')) {
          console.log(`   ⚠️  Usuario ${user.email} ya existe, saltando...`);
        } else {
          console.error(`   ❌ Error creando ${user.email}:`, createError.message);
        }
      } else {
        copied++;
      }
    }

    console.log(`   ✅ ${copied} usuarios copiados exitosamente`);
    return { success: true, count: copied };

  } catch (error) {
    console.error('   ❌ Error copiando auth.users:', error.message);
    return { success: false, error };
  }
}

function filterColumns(tableName, data) {
  if (!columnMappings[tableName]?.exclude) return data;

  const exclude = columnMappings[tableName].exclude;
  return data.map(row => {
    const filtered = { ...row };
    exclude.forEach(col => delete filtered[col]);
    return filtered;
  });
}

async function migrateTable(tableName, isUpsert = false) {
  try {
    console.log(`\n📦 Migrando tabla: ${tableName} ${isUpsert ? '(UPSERT)' : ''}`);

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

    // 2. Filtrar columnas que no existen en el schema nuevo
    const filteredData = filterColumns(tableName, data);

    // 3. Insertar o hacer upsert en proyecto nuevo
    let result;
    if (isUpsert) {
      const conflictColumn = upsertConfig[tableName] || 'id';
      result = await supabaseNew
        .from(tableName)
        .upsert(filteredData, { onConflict: conflictColumn });
    } else {
      result = await supabaseNew
        .from(tableName)
        .insert(filteredData);
    }

    if (result.error) {
      console.error(`   ❌ Error en ${tableName}:`, result.error.message);
      return { success: false, count: 0, error: result.error };
    }

    console.log(`   ✅ ${data.length} registros migrados exitosamente`);
    return { success: true, count: data.length };

  } catch (error) {
    console.error(`   ❌ Error en tabla ${tableName}:`, error.message);
    return { success: false, count: 0, error };
  }
}

async function main() {
  console.log('🚀 Iniciando migración de datos V2...\n');
  console.log('Proyecto origen: hymhyqwylgjmqbvuyutd (USA)');
  console.log('Proyecto destino: nhwiezngaprzoqcvutbx (São Paulo)\n');
  console.log('='.repeat(60));

  const results = [];
  let totalRecords = 0;

  // PASO 1: Copiar auth.users PRIMERO
  const authResult = await copyAuthUsers();
  results.push({ table: 'auth.users', ...authResult });
  if (authResult.success) totalRecords += authResult.count;

  // PASO 2: Tablas seed (UPSERT para evitar duplicados)
  console.log('\n📝 Migrando datos SEED (con UPSERT)...');
  for (const table of upsertTables) {
    const result = await migrateTable(table, true);
    results.push({ table, ...result });
    if (result.success) totalRecords += result.count;
  }

  // PASO 3: Resto de tablas en orden de dependencias
  console.log('\n📊 Migrando datos de PRODUCCIÓN...');
  const productionTables = [
    'role_default_modules',
    'profiles',
    'user_module_access',
    'client_fiscal_data',
    'client_facturacion_cargas',
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
    'convenio_multilateral_vencimientos',
    'educacion_categorias',
    'educacion_articulos',
    'educacion_adjuntos',
    'invoices',
    'payments',
    'subscriptions'
  ];

  for (const table of productionTables) {
    const result = await migrateTable(table, false);
    results.push({ table, ...result });
    if (result.success) totalRecords += result.count;
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
    console.log('\nℹ️  Tablas vacías (OK):');
    empty.forEach(r => console.log(`   - ${r.table}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Tablas con errores:');
    failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.error?.message || 'Error desconocido'}`);
    });
  }

  console.log(`\n📈 Total de registros migrados: ${totalRecords}`);

  if (failed.length === 0) {
    console.log('\n🎉 ¡Migración completada exitosamente!\n');
  } else {
    console.log('\n⚠️  Migración completada con algunos errores (revisar arriba)\n');
  }
}

main().catch(console.error);
