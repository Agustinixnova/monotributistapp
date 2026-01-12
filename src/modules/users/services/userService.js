import { supabase } from '../../../lib/supabase'
import { updateFiscalData, createFiscalData, getFiscalDataByUserId } from './fiscalDataService'

/**
 * Servicio para gestión de usuarios
 */

/**
 * Obtiene todos los usuarios con sus roles y datos relacionados
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.roleId - Filtrar por rol
 * @param {boolean} filters.isActive - Filtrar por estado activo
 * @param {string} filters.assignedTo - Filtrar por contador asignado
 * @param {string} filters.search - Búsqueda por nombre/email
 */
export async function getUsers(filters = {}) {
  let query = supabase
    .from('profiles')
    .select(`
      *,
      role:roles(*),
      fiscal_data:client_fiscal_data!user_id(*)
    `)
    .order('created_at', { ascending: false })

  if (filters.roleId) {
    query = query.eq('role_id', filters.roleId)
  }

  if (typeof filters.isActive === 'boolean') {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters.search) {
    query = query.or(`nombre.ilike.%${filters.search}%,apellido.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  // Obtener los IDs únicos de contadores asignados
  const assignedToIds = [...new Set(data?.filter(u => u.assigned_to).map(u => u.assigned_to))]

  // Si hay contadores asignados, buscar sus datos
  let countersMap = {}
  if (assignedToIds.length > 0) {
    const { data: counters } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email')
      .in('id', assignedToIds)

    if (counters) {
      countersMap = counters.reduce((acc, c) => {
        acc[c.id] = c
        return acc
      }, {})
    }
  }

  // Obtener suscripciones de todos los usuarios
  const userIds = data?.map(u => u.id) || []
  let subscriptionsMap = {}

  if (userIds.length > 0) {
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        status,
        starts_at,
        ends_at,
        total_amount,
        price_per_month,
        duration_months,
        plan_name,
        plan:subscription_plans(name, plan_key)
      `)
      .in('user_id', userIds)
      .in('status', ['active', 'grace_period', 'pending_payment'])

    if (subscriptions) {
      // Obtener IDs de suscripciones para buscar facturas
      const subscriptionIds = subscriptions.map(s => s.id)

      // Buscar facturas asociadas a las suscripciones
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, subscription_id')
        .in('subscription_id', subscriptionIds)

      // Crear set de subscription_ids que tienen factura
      const invoicedSubscriptionIds = new Set(invoices?.map(i => i.subscription_id) || [])

      // Agrupar suscripciones por user_id y agregar flag de facturación
      subscriptions.forEach(sub => {
        if (!subscriptionsMap[sub.user_id]) {
          subscriptionsMap[sub.user_id] = []
        }
        subscriptionsMap[sub.user_id].push({
          ...sub,
          has_invoice: invoicedSubscriptionIds.has(sub.id)
        })
      })
    }
  }

  // Agregar assigned_counter y subscription a cada usuario
  // Normalizar fiscal_data (puede venir como array desde Supabase)
  const usersWithData = data?.map(user => ({
    ...user,
    fiscal_data: Array.isArray(user.fiscal_data) ? user.fiscal_data[0] || null : user.fiscal_data,
    assigned_counter: user.assigned_to ? countersMap[user.assigned_to] || null : null,
    subscription: subscriptionsMap[user.id] || []
  }))

  return usersWithData
}

/**
 * Obtiene un usuario por ID
 * @param {string} id - UUID del usuario
 */
export async function getUserById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(*),
      fiscal_data:client_fiscal_data!user_id(*),
      module_access:user_module_access(
        *,
        module:modules(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  // Obtener datos del contador asignado si existe
  let assigned_counter = null
  if (data?.assigned_to) {
    const { data: counter } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email')
      .eq('id', data.assigned_to)
      .single()

    assigned_counter = counter
  }

  // Normalizar fiscal_data (puede venir como array desde Supabase)
  const normalizedFiscalData = Array.isArray(data.fiscal_data) ? data.fiscal_data[0] || null : data.fiscal_data

  // Cargar locales y grupo familiar si tiene fiscal_data
  let locales = []
  let grupo_familiar = []

  if (normalizedFiscalData?.id) {
    // Cargar locales
    const { data: localesData } = await supabase
      .from('client_locales')
      .select('*')
      .eq('client_id', normalizedFiscalData.id)
      .order('orden', { ascending: true })

    if (localesData) {
      locales = localesData
    }

    // Cargar grupo familiar
    const { data: grupoData } = await supabase
      .from('client_grupo_familiar')
      .select('*')
      .eq('client_id', normalizedFiscalData.id)

    if (grupoData) {
      grupo_familiar = grupoData
    }
  }

  return {
    ...data,
    fiscal_data: normalizedFiscalData,
    locales,
    grupo_familiar,
    assigned_counter
  }
}

/**
 * Crea un nuevo usuario usando Edge Function (evita rate limiting)
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.nombre
 * @param {string} userData.apellido
 * @param {string} userData.telefono
 * @param {string} userData.whatsapp
 * @param {string} userData.dni
 * @param {string} userData.roleId
 * @param {string} userData.assignedTo - UUID del contador asignado
 * @param {Object} userData.fiscalData - Datos fiscales (opcional)
 */
export async function createUser(userData) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No hay sesión activa. Por favor, volvé a iniciar sesión.')
  }

  // DEBUG: Ver datos recibidos
  console.log('createUser - userData recibido:', userData)
  console.log('createUser - fiscalData:', userData.fiscalData)

  // Limpiar campos vacíos que deberían ser null
  const cleanedData = {
    ...userData,
    assignedTo: userData.assignedTo || null,
    telefono: userData.telefono || null,
    whatsapp: userData.whatsapp || null,
    dni: userData.dni || null
  }

  // DEBUG: Ver datos limpios
  console.log('createUser - cleanedData fiscalData:', cleanedData.fiscalData)

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify(cleanedData)
    }
  )

  let data
  try {
    const text = await response.text()
    data = JSON.parse(text)
  } catch (e) {
    throw new Error('Error de conexión con el servidor')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al crear usuario')
  }

  return { userId: data.userId }
}

/**
 * Actualiza un usuario existente
 * @param {string} id - UUID del usuario
 * @param {Object} userData - Datos a actualizar
 */
export async function updateUser(id, userData) {
  const { nombre, apellido, telefono, whatsapp, dni, roleId, assignedTo, notasInternas, fiscalData } = userData

  const updateData = {}
  if (nombre !== undefined) updateData.nombre = nombre
  if (apellido !== undefined) updateData.apellido = apellido
  if (telefono !== undefined) updateData.telefono = telefono || null
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null
  if (dni !== undefined) updateData.dni = dni || null
  if (roleId !== undefined) updateData.role_id = roleId || null
  if (assignedTo !== undefined) updateData.assigned_to = assignedTo || null
  if (notasInternas !== undefined) updateData.notas_internas = notasInternas || null

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Actualizar datos fiscales si existen
  if (fiscalData && Object.keys(fiscalData).length > 0) {
    try {
      // Verificar si ya tiene datos fiscales
      const existingFiscalData = await getFiscalDataByUserId(id)

      if (existingFiscalData) {
        // Actualizar datos fiscales existentes
        await updateFiscalData(id, fiscalData)
      } else if (fiscalData.cuit) {
        // Crear datos fiscales si tiene CUIT
        await createFiscalData({
          user_id: id,
          cuit: fiscalData.cuit,
          razon_social: fiscalData.razonSocial || null,
          tipo_contribuyente: fiscalData.tipoContribuyente || null,
          categoria_monotributo: fiscalData.categoriaMonotributo || null,
          tipo_actividad: fiscalData.tipoActividad || null,
          gestion_facturacion: fiscalData.gestionFacturacion || 'contadora',
          domicilio_fiscal: fiscalData.domicilioFiscal || null,
          codigo_postal: fiscalData.codigoPostal || null,
          localidad: fiscalData.localidad || null,
          provincia: fiscalData.provincia || null,
          regimen_iibb: fiscalData.regimenIibb || null,
          numero_iibb: fiscalData.numeroIibb || null,
          facturador_electronico: fiscalData.facturadorElectronico || null,
          fecha_alta_monotributo: fiscalData.fechaAltaMonotributo || null,
          fecha_ultima_recategorizacion: fiscalData.fechaUltimaRecategorizacion || null,
          codigo_actividad_afip: fiscalData.codigoActividadAfip || null,
          descripcion_actividad_afip: fiscalData.descripcionActividadAfip || null,
          punto_venta_afip: fiscalData.puntoVentaAfip || null,
          notas_internas_fiscales: fiscalData.notasInternasFiscales || null,
          // Situacion especial
          trabaja_relacion_dependencia: fiscalData.trabajaRelacionDependencia || false,
          empleador_cuit: fiscalData.empleadorCuit || null,
          empleador_razon_social: fiscalData.empleadorRazonSocial || null,
          sueldo_bruto: fiscalData.sueldoBruto || null,
          tiene_local: fiscalData.tieneLocal || false,
          // Empleados
          tiene_empleados: fiscalData.tieneEmpleados || false,
          cantidad_empleados: fiscalData.cantidadEmpleados || 0,
          // Obra social
          obra_social: fiscalData.obraSocial || null,
          obra_social_tipo_cobertura: fiscalData.obraSocialTipoCobertura || 'titular',
          obra_social_adicional: fiscalData.obraSocialAdicional || false,
          obra_social_adicional_nombre: fiscalData.obraSocialAdicionalNombre || null,
          // Pago monotributo
          metodo_pago_monotributo: fiscalData.metodoPagoMonotributo || null,
          estado_pago_monotributo: fiscalData.estadoPagoMonotributo || 'al_dia',
          cbu_debito: fiscalData.cbuDebito || null,
          // Accesos ARCA
          nivel_clave_fiscal: fiscalData.nivelClaveFiscal || null,
          servicios_delegados: fiscalData.serviciosDelegados || false,
          fecha_delegacion: fiscalData.fechaDelegacion || null,
          factura_electronica_habilitada: fiscalData.facturaElectronicaHabilitada || false,
          // Historial categoria
          categoria_anterior: fiscalData.categoriaAnterior || null,
          fecha_cambio_categoria: fiscalData.fechaCambioCategoria || null,
          motivo_cambio_categoria: fiscalData.motivoCambioCategoria || null
        })
      }
    } catch (fiscalError) {
      console.error('Error actualizando datos fiscales:', fiscalError)
      // No lanzar error para no bloquear la actualización del perfil
    }
  }

  return data
}

/**
 * Activa o desactiva un usuario
 * @param {string} id - UUID del usuario
 * @param {boolean} isActive - Estado a establecer
 */
export async function toggleUserActive(id, isActive) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene contadores disponibles para asignar clientes
 */
export async function getAvailableCounters() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre,
      apellido,
      email,
      role:roles!inner(name)
    `)
    .in('role.name', ['admin', 'contadora_principal', 'contador_secundario'])
    .eq('is_active', true)

  if (error) throw error
  return data
}

/**
 * Resetea la contraseña de un usuario
 * @param {string} userId - UUID del usuario
 * @param {string} newPassword - Nueva contraseña (mínimo 6 caracteres)
 */
export async function resetUserPassword(userId, newPassword) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No hay sesión activa. Por favor, volvé a iniciar sesión.')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ userId, newPassword })
    }
  )

  let data
  try {
    const text = await response.text()
    data = JSON.parse(text)
  } catch (e) {
    throw new Error('Error de conexión con el servidor')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Error al resetear contraseña')
  }

  return { success: true, message: data.message }
}
