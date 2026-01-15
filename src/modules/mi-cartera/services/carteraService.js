import { supabase } from '../../../lib/supabase'
import { registrarCambio, TIPO_CAMBIO } from '../../../services/historialCambiosService'

// Mapeo de campos a tipos de cambio y labels para FichaCliente
const CAMPOS_FICHA = {
  tipo_contribuyente: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Tipo de contribuyente' },
  categoria_monotributo: { tipoCambio: TIPO_CAMBIO.CATEGORIA, label: 'Categoria monotributo' },
  tipo_actividad: { tipoCambio: TIPO_CAMBIO.TIPO_ACTIVIDAD, label: 'Tipo de actividad' },
  gestion_facturacion: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Gestion facturacion' },
  razon_social: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Razon social' },
  codigo_actividad_afip: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Codigo actividad AFIP' },
  descripcion_actividad_afip: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Descripcion actividad AFIP' },
  punto_venta_afip: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Punto de venta AFIP' },
  trabaja_relacion_dependencia: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Trabaja en relacion de dependencia' },
  empleador_cuit: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'CUIT empleador' },
  empleador_razon_social: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Empleador' },
  sueldo_bruto: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Sueldo bruto' },
  tiene_empleados: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Tiene empleados' },
  cantidad_empleados: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Cantidad empleados' },
  obra_social: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Obra social' },
  obra_social_tipo_cobertura: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Tipo cobertura obra social' },
  obra_social_adicional: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Obra social adicional' },
  obra_social_adicional_nombre: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Nombre obra social adicional' },
  metodo_pago_monotributo: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Metodo pago monotributo' },
  estado_pago_monotributo: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Estado pago monotributo' },
  cbu_debito: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'CBU debito automatico' },
  nivel_clave_fiscal: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Nivel clave fiscal' },
  servicios_delegados: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Servicios delegados' },
  fecha_delegacion: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Fecha delegacion' },
  factura_electronica_habilitada: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Factura electronica' },
  domicilio_fiscal: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Domicilio fiscal' },
  codigo_postal: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Codigo postal' },
  localidad: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Localidad' },
  provincia: { tipoCambio: TIPO_CAMBIO.OTROS, label: 'Provincia' },
  regimen_iibb: { tipoCambio: TIPO_CAMBIO.REGIMEN_IIBB, label: 'Regimen IIBB' },
  numero_iibb: { tipoCambio: TIPO_CAMBIO.REGIMEN_IIBB, label: 'Numero IIBB' }
}

// Helper para formatear valores
function formatValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 'Si' : 'No'
  return String(value)
}

/**
 * Obtener lista de clientes para la cartera
 * @param {string} userId - ID del usuario actual
 * @param {string} userRole - Rol del usuario
 * @param {Object} filters - Filtros de busqueda
 */
export async function getCarteraClientes(userId, userRole, filters = {}) {
  // DEBUG: Ver parámetros recibidos
  console.log('getCarteraClientes - userId:', userId, 'userRole:', userRole, 'filters:', filters)

  // Primero: obtener clientes CON datos fiscales
  let queryConFiscal = supabase
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
      regimen_iibb,
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
    queryConFiscal = queryConFiscal.eq('categoria_monotributo', filters.categoria)
  }
  if (filters.tipoContribuyente) {
    queryConFiscal = queryConFiscal.eq('tipo_contribuyente', filters.tipoContribuyente)
  }
  if (filters.estadoPago) {
    queryConFiscal = queryConFiscal.eq('estado_pago_monotributo', filters.estadoPago)
  }
  if (filters.gestionFacturacion) {
    queryConFiscal = queryConFiscal.eq('gestion_facturacion', filters.gestionFacturacion)
  }

  const { data: dataConFiscal, error: errorConFiscal } = await queryConFiscal
  if (errorConFiscal) {
    console.error('Error en getCarteraClientes (con fiscal):', errorConFiscal)
    throw errorConFiscal
  }

  console.log('getCarteraClientes - clientes CON fiscal data:', dataConFiscal?.length || 0)

  // Segundo: obtener TODOS los perfiles con roles de cliente para encontrar los que no tienen datos fiscales
  // IMPORTANTE: Siempre buscar clientes sin datos fiscales para que contadora_principal los vea
  let clientesSinFiscal = []

  // Solo omitir si hay filtros específicos de datos fiscales que excluirían a estos clientes
  const tieneFiltroDatosFiscales = filters.categoria || filters.estadoPago || filters.gestionFacturacion

  if (!tieneFiltroDatosFiscales) {
    // Obtener todos los perfiles con roles de cliente
    const { data: perfilesClientes, error: errorPerfiles } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        apellido,
        email,
        telefono,
        whatsapp,
        assigned_to,
        is_active,
        role_id,
        contador:profiles!assigned_to(id, nombre, apellido)
      `)
      .eq('is_active', true)

    // Obtener roles de cliente
    const { data: rolesCliente } = await supabase
      .from('roles')
      .select('id, name')
      .in('name', ['monotributista', 'responsable_inscripto'])

    const rolesClienteIds = new Set((rolesCliente || []).map(r => r.id))
    const rolesClienteMap = Object.fromEntries((rolesCliente || []).map(r => [r.id, r.name]))

    if (!errorPerfiles && perfilesClientes) {
      // Filtrar solo perfiles con rol de cliente
      const perfilesConRolCliente = perfilesClientes.filter(p => rolesClienteIds.has(p.role_id))

      // Filtrar los que NO tienen datos fiscales
      const idsConFiscal = new Set((dataConFiscal || []).map(c => c.user_id))

      clientesSinFiscal = perfilesConRolCliente
        .filter(p => !idsConFiscal.has(p.id))
        .map(p => ({
          id: null, // No tiene client_fiscal_data
          user_id: p.id,
          cuit: null,
          razon_social: null,
          tipo_contribuyente: rolesClienteMap[p.role_id] || null,
          categoria_monotributo: null,
          tipo_actividad: null,
          gestion_facturacion: null,
          fecha_alta_monotributo: null,
          estado_pago_monotributo: null,
          servicios_delegados: null,
          obra_social: null,
          trabaja_relacion_dependencia: null,
          tiene_local: null,
          regimen_iibb: null,
          user: {
            ...p,
            role: { name: rolesClienteMap[p.role_id] }
          },
          datos_incompletos: true
        }))

      // Filtrar por tipoContribuyente si está presente
      if (filters.tipoContribuyente) {
        clientesSinFiscal = clientesSinFiscal.filter(c => c.tipo_contribuyente === filters.tipoContribuyente)
      }

      console.log('getCarteraClientes - clientes SIN fiscal data:', clientesSinFiscal.length)
    }
  }

  // Combinar ambos resultados
  const data = [...(dataConFiscal || []), ...clientesSinFiscal]
  console.log('getCarteraClientes - TOTAL clientes:', data.length)

  // Transformar datos para mantener compatibilidad con la estructura esperada
  let clientesRaw = (data || [])
    .filter(c => c.user && c.user.is_active) // Solo clientes con perfil activo

  // Contador secundario solo ve sus clientes asignados (filtro post-query)
  if (userRole === 'contador_secundario') {
    clientesRaw = clientesRaw.filter(c => c.user?.assigned_to === userId)
  }

  // Obtener IDs de clientes para buscar facturación (filtrar nulls de clientes sin datos fiscales)
  const clienteIds = clientesRaw.map(c => c.id).filter(Boolean)

  // Obtener facturación de los últimos 12 meses para cada cliente
  let facturacionMap = {}
  if (clienteIds.length > 0) {
    const fechaHace12Meses = new Date()
    fechaHace12Meses.setMonth(fechaHace12Meses.getMonth() - 12)
    const fechaDesde = fechaHace12Meses.toISOString().split('T')[0]

    const { data: facturacion } = await supabase
      .from('client_facturacion_mensual_resumen')
      .select('client_id, total_neto')
      .in('client_id', clienteIds)
      .gte('created_at', fechaDesde)

    if (facturacion) {
      // Sumar por cliente
      facturacion.forEach(f => {
        if (!facturacionMap[f.client_id]) {
          facturacionMap[f.client_id] = 0
        }
        facturacionMap[f.client_id] += f.total_neto || 0
      })
    }
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
      regimen_iibb: c.regimen_iibb,
      facturacion_12_meses: facturacionMap[c.id] || null,
      contador_nombre: c.user?.contador?.nombre,
      contador_apellido: c.user?.contador?.apellido,
      sugerencias_pendientes: 0, // Se calculará después si es necesario
      cantidad_locales: 0, // Se calculará después si es necesario
      datos_incompletos: c.datos_incompletos || false // Flag para clientes sin CUIT
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

  // Jurisdicciones IIBB
  const { data: jurisdiccionesIibb } = await supabase
    .from('client_iibb_jurisdicciones')
    .select('*')
    .eq('client_id', clientId)
    .order('es_sede', { ascending: false }) // Sede primero
    .order('provincia')

  return {
    ...fiscal,
    historialCategorias: historial || [],
    categoriaInfo: categoria,
    sugerenciasPendientes: sugerencias || [],
    locales: locales || [],
    grupoFamiliar: grupoFamiliar || [],
    jurisdiccionesIibb: jurisdiccionesIibb || []
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
 * Actualizar multiples campos del cliente con historial unificado
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 * @param {Object} cambios - Objeto con los campos a cambiar
 * @param {Object} valoresAnteriores - Valores anteriores para historial
 * @param {string} userId - ID del usuario que realiza el cambio
 * @param {string} motivo - Motivo del cambio (opcional, se guarda en metadata)
 */
export async function actualizarCamposCliente(clientId, cambios, valoresAnteriores, userId, motivo = null) {
  // Obtener user_id del cliente para el historial
  const { data: clientData } = await supabase
    .from('client_fiscal_data')
    .select('user_id')
    .eq('id', clientId)
    .single()

  const clientUserId = clientData?.user_id

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

  // Registrar cada cambio en el nuevo historial unificado
  for (const [campo, valorNuevo] of Object.entries(cambios)) {
    const valorAnterior = valoresAnteriores[campo]
    const config = CAMPOS_FICHA[campo]

    // Solo registrar si hay cambio real
    if (formatValue(valorAnterior) !== formatValue(valorNuevo)) {
      await registrarCambio({
        userId: clientUserId,
        clientFiscalDataId: clientId,
        tipoCambio: config?.tipoCambio || TIPO_CAMBIO.OTROS,
        campo: config?.label || campo,
        valorAnterior: formatValue(valorAnterior),
        valorNuevo: formatValue(valorNuevo),
        metadata: motivo ? { motivo } : {},
        realizadoPor: userId
      })
    }
  }

  return data
}

/**
 * Obtener historial de auditoria de un cliente
 * @param {string} clientId - ID del cliente (client_fiscal_data.id)
 * @param {number} limit - Cantidad maxima de registros
 */
export async function getAuditoriaCliente(clientId, limit = 50) {
  const { data, error } = await supabase
    .from('historial_cambios_cliente')
    .select(`
      *,
      realizado_por_profile:profiles!realizado_por(nombre, apellido)
    `)
    .eq('client_fiscal_data_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Mapear a formato compatible con componentes existentes
  return (data || []).map(item => ({
    id: item.id,
    campo: item.campo,
    valor_anterior: item.valor_anterior,
    valor_nuevo: item.valor_nuevo,
    modified_at: item.created_at,
    modified_by: item.realizado_por,
    modified_by_profile: item.realizado_por_profile,
    tipo_cambio: item.tipo_cambio,
    metadata: item.metadata
  }))
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

/**
 * Guardar jurisdicciones IIBB de un cliente
 * @param {string} clientId - ID del cliente
 * @param {Array} jurisdicciones - Array de jurisdicciones
 * @param {string} userId - ID del usuario que guarda (para auditoría)
 */
export async function guardarJurisdiccionesIibb(clientId, jurisdicciones, userId) {
  // Eliminar jurisdicciones existentes
  await supabase
    .from('client_iibb_jurisdicciones')
    .delete()
    .eq('client_id', clientId)

  // Insertar nuevas jurisdicciones
  if (jurisdicciones && jurisdicciones.length > 0) {
    const data = jurisdicciones.map(j => ({
      client_id: clientId,
      provincia: j.provincia,
      numero_inscripcion: j.numeroInscripcion || j.numero_inscripcion || null,
      coeficiente: j.coeficiente !== undefined ? j.coeficiente : 100.00,
      alicuota: j.alicuota !== undefined ? j.alicuota : null,
      es_sede: j.esSede || j.es_sede || false,
      notas: j.notas || null,
      created_by: userId
    }))

    const { error } = await supabase
      .from('client_iibb_jurisdicciones')
      .insert(data)

    if (error) throw error
  }
}
