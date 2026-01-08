import { supabase } from '../../../lib/supabase'

/**
 * Obtener lista de clientes para la cartera
 * @param {string} userId - ID del usuario actual
 * @param {string} userRole - Rol del usuario
 * @param {Object} filters - Filtros de busqueda
 */
export async function getCarteraClientes(userId, userRole, filters = {}) {
  // Usar query directa en lugar de vista para evitar problemas de RLS
  let query = supabase
    .from('client_fiscal_data')
    .select(`
      id,
      user_id,
      cuit,
      razon_social,
      tipo_contribuyente,
      categoria_monotributo,
      tipo_actividad,
      gestion_facturacion,
      fecha_alta_monotributo,
      estado_pago_monotributo,
      servicios_delegados,
      obra_social,
      trabaja_relacion_dependencia,
      tiene_local,
      user:profiles!user_id(
        id,
        nombre,
        apellido,
        email,
        telefono,
        whatsapp,
        assigned_to,
        is_active,
        contador:profiles!assigned_to(id, nombre, apellido)
      )
    `)

  // Aplicar filtros en la tabla client_fiscal_data
  if (filters.categoria) {
    query = query.eq('categoria_monotributo', filters.categoria)
  }
  if (filters.tipoContribuyente) {
    query = query.eq('tipo_contribuyente', filters.tipoContribuyente)
  }
  if (filters.estadoPago) {
    query = query.eq('estado_pago_monotributo', filters.estadoPago)
  }
  if (filters.gestionFacturacion) {
    query = query.eq('gestion_facturacion', filters.gestionFacturacion)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error en getCarteraClientes:', error)
    throw error
  }

  // Transformar datos para mantener compatibilidad con la estructura esperada
  let clientesRaw = (data || [])
    .filter(c => c.user && c.user.is_active) // Solo clientes con perfil activo

  // Contador secundario solo ve sus clientes asignados (filtro post-query)
  if (userRole === 'contador_secundario') {
    clientesRaw = clientesRaw.filter(c => c.user?.assigned_to === userId)
  }

  const clientes = clientesRaw.map(c => ({
      client_id: c.id,
      user_id: c.user_id,
      profile_id: c.user?.id,
      nombre: c.user?.nombre,
      apellido: c.user?.apellido,
      full_name: c.user?.nombre && c.user?.apellido
        ? `${c.user.nombre} ${c.user.apellido}`
        : c.user?.email || c.razon_social,
      email: c.user?.email,
      telefono: c.user?.telefono,
      whatsapp: c.user?.whatsapp,
      assigned_to: c.user?.assigned_to,
      cuit: c.cuit,
      razon_social: c.razon_social,
      tipo_contribuyente: c.tipo_contribuyente,
      categoria_monotributo: c.categoria_monotributo,
      tipo_actividad: c.tipo_actividad,
      gestion_facturacion: c.gestion_facturacion,
      fecha_alta_monotributo: c.fecha_alta_monotributo,
      estado_pago_monotributo: c.estado_pago_monotributo,
      servicios_delegados: c.servicios_delegados,
      obra_social: c.obra_social,
      trabaja_relacion_dependencia: c.trabaja_relacion_dependencia,
      tiene_local: c.tiene_local,
      contador_nombre: c.user?.contador?.nombre,
      contador_apellido: c.user?.contador?.apellido,
      sugerencias_pendientes: 0, // Se calculará después si es necesario
      cantidad_locales: 0 // Se calculará después si es necesario
    }))

  // Ordenar por nombre
  clientes.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  return clientes
}

/**
 * Obtener detalle completo de un cliente
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 */
export async function getClienteDetalle(clientId) {
  // Datos fiscales con perfil
  const { data: fiscal, error } = await supabase
    .from('client_fiscal_data')
    .select(`
      *,
      user:profiles!user_id(
        *,
        role:roles(*),
        contador:profiles!assigned_to(id, nombre, apellido, email, telefono)
      )
    `)
    .eq('id', clientId)
    .single()

  if (error) throw error

  // Historial de categorias
  const { data: historial } = await supabase
    .from('client_historial_categorias')
    .select(`
      *,
      created_by_profile:profiles!created_by(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .order('fecha_desde', { ascending: false })

  // Categoria actual con topes
  const { data: categoria } = await supabase
    .from('monotributo_categorias')
    .select('*')
    .eq('categoria', fiscal.categoria_monotributo)
    .is('vigente_hasta', null)
    .single()

  // Sugerencias pendientes
  const { data: sugerencias } = await supabase
    .from('client_sugerencias_cambio')
    .select(`
      *,
      user_profile:profiles!user_id(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .eq('estado', 'pendiente')

  // Locales del cliente
  const { data: locales } = await supabase
    .from('client_locales')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at')

  // Grupo familiar
  const { data: grupoFamiliar } = await supabase
    .from('client_grupo_familiar')
    .select('*')
    .eq('client_id', clientId)

  return {
    ...fiscal,
    historialCategorias: historial || [],
    categoriaInfo: categoria,
    sugerenciasPendientes: sugerencias || [],
    locales: locales || [],
    grupoFamiliar: grupoFamiliar || []
  }
}

/**
 * Actualizar un campo del cliente con auditoria
 * @param {string} clientId - ID del cliente
 * @param {string} campo - Nombre del campo (snake_case)
 * @param {any} valorNuevo - Nuevo valor
 * @param {any} valorAnterior - Valor anterior
 * @param {string} userId - ID del usuario que hace el cambio
 * @param {string} motivo - Motivo del cambio (opcional)
 */
export async function actualizarCampoCliente(clientId, campo, valorNuevo, valorAnterior, userId, motivo = null) {
  // 1. Registrar en auditoria
  await supabase.rpc('registrar_cambio_auditoria', {
    p_client_id: clientId,
    p_campo: campo,
    p_valor_anterior: String(valorAnterior ?? ''),
    p_valor_nuevo: String(valorNuevo ?? ''),
    p_user_id: userId,
    p_motivo: motivo
  })

  // 2. Actualizar el campo
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .update({
      [campo]: valorNuevo,
      last_modified_by: userId,
      last_modified_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar multiples campos del cliente con auditoria
 * @param {string} clientId - ID del cliente
 * @param {Object} cambios - Objeto con los campos a cambiar
 * @param {Object} valoresAnteriores - Valores anteriores para auditoria
 * @param {string} userId - ID del usuario
 * @param {string} motivo - Motivo del cambio
 */
export async function actualizarCamposCliente(clientId, cambios, valoresAnteriores, userId, motivo = null) {
  // Registrar cada cambio en auditoria
  for (const [campo, valorNuevo] of Object.entries(cambios)) {
    const valorAnterior = valoresAnteriores[campo]
    if (valorAnterior !== valorNuevo) {
      await supabase.rpc('registrar_cambio_auditoria', {
        p_client_id: clientId,
        p_campo: campo,
        p_valor_anterior: String(valorAnterior ?? ''),
        p_valor_nuevo: String(valorNuevo ?? ''),
        p_user_id: userId,
        p_motivo: motivo
      })
    }
  }

  // Actualizar todos los campos
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .update({
      ...cambios,
      last_modified_by: userId,
      last_modified_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtener historial de auditoria de un cliente
 * @param {string} clientId - ID del cliente
 * @param {number} limit - Cantidad maxima de registros
 */
export async function getAuditoriaCliente(clientId, limit = 50) {
  const { data, error } = await supabase
    .from('client_audit_log')
    .select(`
      *,
      modified_by_profile:profiles!modified_by(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .order('modified_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/**
 * Guardar/actualizar locales de un cliente
 * @param {string} clientId - ID del cliente
 * @param {Array} locales - Array de locales
 */
export async function guardarLocalesCliente(clientId, locales) {
  // Eliminar locales existentes
  await supabase
    .from('client_locales')
    .delete()
    .eq('client_id', clientId)

  // Insertar nuevos locales
  if (locales && locales.length > 0) {
    const localesData = locales.map(local => ({
      client_id: clientId,
      descripcion: local.descripcion || null,
      direccion: local.direccion || null,
      alquiler_mensual: local.alquiler || local.alquiler_mensual || null,
      superficie_m2: local.superficie || local.superficie_m2 || null,
      es_propio: local.esPropio || local.es_propio || false
    }))

    const { error } = await supabase
      .from('client_locales')
      .insert(localesData)

    if (error) throw error
  }
}

/**
 * Guardar/actualizar grupo familiar de un cliente
 * @param {string} clientId - ID del cliente
 * @param {Array} grupo - Array de integrantes
 */
export async function guardarGrupoFamiliar(clientId, grupo) {
  // Eliminar grupo existente
  await supabase
    .from('client_grupo_familiar')
    .delete()
    .eq('client_id', clientId)

  // Insertar nuevos integrantes
  if (grupo && grupo.length > 0) {
    const grupoData = grupo.filter(g => g.nombre).map(integrante => ({
      client_id: clientId,
      nombre: integrante.nombre,
      dni: integrante.dni || null,
      parentesco: integrante.parentesco || 'otro',
      fecha_nacimiento: integrante.fechaNacimiento || integrante.fecha_nacimiento || null
    }))

    if (grupoData.length > 0) {
      const { error } = await supabase
        .from('client_grupo_familiar')
        .insert(grupoData)

      if (error) throw error
    }
  }
}
