import { createClient } from '@supabase/supabase-js';

const supabaseOld = createClient(
  'https://hymhyqwylgjmqbvuyutd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bWh5cXd5bGdqbXFidnV5dXRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjczMSwiZXhwIjoyMDgzMDcyNzMxfQ.qVEwxvaSdl1nHQlOxqgMAe0k4uBi55DsOpaOpZ7pifo'
);

const supabaseNew = createClient(
  'https://nhwiezngaprzoqcvutbx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMzNjk5NCwiZXhwIjoyMDgzOTEyOTk0fQ.57jskRgaw5Yr6liKBaUM477FwyCStcs_XcRth65HxZY'
);

// Mapeo global de IDs: VIEJO -> NUEVO
let userIdMap = {};
let roleIdMap = {};
let moduleIdMap = {};
let categoriaIdMap = {};
let clientIdMap = {};
let conversacionIdMap = {};
let articuloIdMap = {};

async function buildUserIdMapping() {
  console.log('\n🔗 Construyendo mapeo de IDs de usuarios...');

  // Obtener usuarios del proyecto nuevo
  const { data: newUsers, error } = await supabaseNew.auth.admin.listUsers();
  if (error) throw error;

  // Obtener profiles del proyecto viejo
  const { data: oldProfiles } = await supabaseOld.from('profiles').select('id, email');

  // Crear mapeo por email
  oldProfiles.forEach(oldProfile => {
    const newUser = newUsers.users.find(u => u.email === oldProfile.email);
    if (newUser) {
      userIdMap[oldProfile.id] = newUser.id;
    }
  });

  console.log(`   ✓ Mapeados ${Object.keys(userIdMap).length} usuarios por email`);
  return userIdMap;
}

async function buildRoleIdMapping() {
  console.log('\n🔗 Construyendo mapeo de IDs de roles...');

  const { data: oldRoles } = await supabaseOld.from('roles').select('id, name');
  const { data: newRoles } = await supabaseNew.from('roles').select('id, name');

  oldRoles.forEach(oldRole => {
    const newRole = newRoles.find(r => r.name === oldRole.name);
    if (newRole) {
      roleIdMap[oldRole.id] = newRole.id;
    }
  });

  console.log(`   ✓ Mapeados ${Object.keys(roleIdMap).length} roles por nombre`);
  return roleIdMap;
}

async function buildModuleIdMapping() {
  console.log('\n🔗 Construyendo mapeo de IDs de módulos...');

  const { data: oldModules } = await supabaseOld.from('modules').select('id, slug');
  const { data: newModules } = await supabaseNew.from('modules').select('id, slug');

  oldModules.forEach(oldModule => {
    const newModule = newModules.find(m => m.slug === oldModule.slug);
    if (newModule) {
      moduleIdMap[oldModule.id] = newModule.id;
    }
  });

  console.log(`   ✓ Mapeados ${Object.keys(moduleIdMap).length} módulos por slug`);
  return moduleIdMap;
}

async function buildCategoriaIdMapping() {
  console.log('\n🔗 Construyendo mapeo de IDs de categorías...');

  const { data: oldCats } = await supabaseOld.from('monotributo_categorias').select('id, categoria');
  const { data: newCats } = await supabaseNew.from('monotributo_categorias').select('id, categoria');

  oldCats.forEach(oldCat => {
    const newCat = newCats.find(c => c.categoria === oldCat.categoria);
    if (newCat) {
      categoriaIdMap[oldCat.id] = newCat.id;
    }
  });

  console.log(`   ✓ Mapeadas ${Object.keys(categoriaIdMap).length} categorías`);
  return categoriaIdMap;
}

function remapIds(data, idField, mapping) {
  return data.map(row => ({
    ...row,
    [idField]: mapping[row[idField]] || row[idField]
  }));
}

function filterColumns(data, excludeColumns = []) {
  return data.map(row => {
    const filtered = { ...row };
    excludeColumns.forEach(col => delete filtered[col]);
    return filtered;
  });
}

async function migrateProfiles() {
  console.log('\n📦 Migrando PROFILES...');

  const { data, error } = await supabaseOld.from('profiles').select('*');
  if (error) throw error;

  console.log(`   ✓ Leídos ${data.length} registros`);

  // Filtrar columnas que no existen y remapear IDs
  let profiles = filterColumns(data, ['codigo_postal', 'direccion', 'localidad', 'provincia']);

  profiles = profiles.map(profile => ({
    ...profile,
    id: userIdMap[profile.id] || profile.id,
    role_id: roleIdMap[profile.role_id] || profile.role_id,
    assigned_to: profile.assigned_to ? (userIdMap[profile.assigned_to] || profile.assigned_to) : null,
    created_by: profile.created_by ? (userIdMap[profile.created_by] || profile.created_by) : null
  }));

  const { error: insertError } = await supabaseNew.from('profiles').insert(profiles);

  if (insertError) {
    console.error(`   ❌ Error:`, insertError.message);
    return { success: false, count: 0 };
  }

  console.log(`   ✅ ${profiles.length} registros migrados`);
  return { success: true, count: profiles.length };
}

async function migrateClientFiscalData() {
  console.log('\n📦 Migrando CLIENT_FISCAL_DATA...');

  const { data, error } = await supabaseOld.from('client_fiscal_data').select('*');
  if (error) throw error;

  console.log(`   ✓ Leídos ${data.length} registros`);

  // Obtener categorías del viejo para mapear ID -> letra
  const { data: oldCategories } = await supabaseOld.from('monotributo_categorias').select('id, categoria');
  const catIdToLetter = {};
  oldCategories.forEach(cat => {
    catIdToLetter[cat.id] = cat.categoria;
  });

  // Remapear user_id y convertir categoria_actual_id a categoria_monotributo (TEXT)
  const clients = data.map(client => {
    const newId = client.id; // Guardamos el ID original para mapeo posterior
    clientIdMap[client.id] = newId;

    const { categoria_actual_id, ...rest } = client; // Excluir categoria_actual_id

    return {
      ...rest,
      user_id: userIdMap[client.user_id] || client.user_id,
      categoria_monotributo: catIdToLetter[categoria_actual_id] || null,
      last_modified_by: client.last_modified_by ? (userIdMap[client.last_modified_by] || null) : null
    };
  });

  const { error: insertError } = await supabaseNew.from('client_fiscal_data').insert(clients);

  if (insertError) {
    console.error(`   ❌ Error:`, insertError.message);
    return { success: false, count: 0 };
  }

  console.log(`   ✅ ${clients.length} registros migrados`);
  return { success: true, count: clients.length };
}

async function migrateUserModuleAccess() {
  console.log('\n📦 Migrando USER_MODULE_ACCESS...');

  const { data, error } = await supabaseOld.from('user_module_access').select('*');
  if (error) throw error;

  console.log(`   ✓ Leídos ${data.length} registros`);

  // Remapear user_id y module_id
  const access = data.map(row => ({
    ...row,
    user_id: userIdMap[row.user_id] || row.user_id,
    module_id: moduleIdMap[row.module_id] || row.module_id
  }));

  const { error: insertError } = await supabaseNew.from('user_module_access').insert(access);

  if (insertError) {
    console.error(`   ❌ Error:`, insertError.message);
    return { success: false, count: 0 };
  }

  console.log(`   ✅ ${access.length} registros migrados`);
  return { success: true, count: access.length };
}

async function migrateClientData(tableName, clientIdField = 'client_id', otherMappings = {}) {
  console.log(`\n📦 Migrando ${tableName.toUpperCase()}...`);

  const { data, error } = await supabaseOld.from(tableName).select('*');

  if (error) {
    if (error.code === 'PGRST116') {
      console.log(`   ℹ️  Tabla vacía o no existe`);
      return { success: true, count: 0 };
    }
    throw error;
  }

  if (!data || data.length === 0) {
    console.log(`   ℹ️  Tabla vacía`);
    return { success: true, count: 0 };
  }

  console.log(`   ✓ Leídos ${data.length} registros`);

  // Remapear IDs según sea necesario
  const mapped = data.map(row => {
    const newRow = { ...row };

    // Remapear client_id si existe
    if (clientIdField && row[clientIdField]) {
      newRow[clientIdField] = clientIdMap[row[clientIdField]] || row[clientIdField];
    }

    // Remapear otros campos
    Object.entries(otherMappings).forEach(([field, mapName]) => {
      if (row[field]) {
        if (mapName === 'user') {
          newRow[field] = userIdMap[row[field]] || null;
        } else if (mapName === 'client') {
          newRow[field] = clientIdMap[row[field]] || row[field];
        } else if (mapName === 'conversacion') {
          newRow[field] = conversacionIdMap[row[field]] || row[field];
        } else if (mapName === 'articulo') {
          newRow[field] = articuloIdMap[row[field]] || row[field];
        }
      }
    });

    return newRow;
  });

  const { error: insertError } = await supabaseNew.from(tableName).insert(mapped);

  if (insertError) {
    console.error(`   ❌ Error:`, insertError.message);
    return { success: false, count: 0 };
  }

  console.log(`   ✅ ${mapped.length} registros migrados`);
  return { success: true, count: mapped.length };
}

async function migrateBuzonConversaciones() {
  console.log(`\n📦 Migrando BUZON_CONVERSACIONES...`);

  const { data, error } = await supabaseOld.from('buzon_conversaciones').select('*');
  if (error || !data || data.length === 0) {
    console.log(`   ℹ️  Tabla vacía`);
    return { success: true, count: 0 };
  }

  console.log(`   ✓ Leídos ${data.length} registros`);

  const mapped = data.map(row => {
    conversacionIdMap[row.id] = row.id; // Mantener mismo ID para conversaciones
    return {
      ...row,
      iniciado_por: userIdMap[row.iniciado_por] || row.iniciado_por
    };
  });

  const { error: insertError } = await supabaseNew.from('buzon_conversaciones').insert(mapped);

  if (insertError) {
    console.error(`   ❌ Error:`, insertError.message);
    return { success: false, count: 0 };
  }

  console.log(`   ✅ ${mapped.length} registros migrados`);
  return { success: true, count: mapped.length };
}

async function main() {
  console.log('🚀 Iniciando migración FINAL de datos...\n');
  console.log('Proyecto origen: hymhyqwylgjmqbvuyutd (USA)');
  console.log('Proyecto destino: nhwiezngaprzoqcvutbx (São Paulo)\n');
  console.log('='.repeat(60));

  try {
    // PASO 1: Construir todos los mapeos de IDs
    await buildUserIdMapping();
    await buildRoleIdMapping();
    await buildModuleIdMapping();
    await buildCategoriaIdMapping();

    // PASO 2: Migrar profiles
    await migrateProfiles();

    // PASO 3: Migrar user_module_access
    await migrateUserModuleAccess();

    // PASO 4: Migrar client_fiscal_data
    await migrateClientFiscalData();

    // PASO 5: Migrar datos relacionados con clientes
    await migrateClientData('client_facturacion_cargas', 'client_id', {
      cargado_por: 'user',
      revisado_por: 'user'
    });
    await migrateClientData('client_cuota_mensual', 'client_id', {
      informado_por: 'user'
    });
    await migrateClientData('client_locales');
    await migrateClientData('client_notifications', 'client_id', {
      created_by: 'user'
    });

    // PASO 6: Historial cambios (usa client_fiscal_data_id, user_id y realizado_por)
    await migrateClientData('historial_cambios_cliente', null, {
      client_fiscal_data_id: 'client',
      user_id: 'user',
      realizado_por: 'user'
    });

    // PASO 7: Buzón
    await migrateBuzonConversaciones();
    await migrateClientData('buzon_participantes', null, {
      conversacion_id: 'conversacion',
      user_id: 'user'
    });
    await migrateClientData('buzon_mensajes', null, {
      conversacion_id: 'conversacion',
      enviado_por: 'user'
    });

    // PASO 8: Educación
    const { data: educacionArticulos } = await supabaseOld.from('educacion_articulos').select('*');
    if (educacionArticulos && educacionArticulos.length > 0) {
      console.log('\n📦 Migrando EDUCACION_ARTICULOS...');
      const articulos = educacionArticulos.map(art => {
        articuloIdMap[art.id] = art.id;
        return {
          ...art,
          creado_por: userIdMap[art.creado_por] || null,
          actualizado_por: art.actualizado_por ? (userIdMap[art.actualizado_por] || null) : null
        };
      });

      const { error: artError } = await supabaseNew.from('educacion_articulos').insert(articulos);
      if (artError) {
        console.error(`   ❌ Error:`, artError.message);
      } else {
        console.log(`   ✅ ${articulos.length} artículos migrados`);
      }

      // Ahora adjuntos
      await migrateClientData('educacion_adjuntos', null, {
        articulo_id: 'articulo',
        subido_por: 'user'
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 ¡Migración de datos completada exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    throw error;
  }
}

main().catch(console.error);
