/**
 * Service para clientes de agenda
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'

/**
 * Obtener todos los clientes del usuario
 * @param {Object} options
 * @param {boolean} options.soloActivos - Si solo traer activos (default: true)
 * @param {string} options.busqueda - Texto para buscar por nombre/teléfono
 * @param {number} options.limite - Límite de resultados
 * @param {string} options.tipo - 'todos', 'propios', 'globales'
 */
export async function getClientes(options = {}) {
  const { soloActivos = true, busqueda = '', limite = 100, tipo = 'todos' } = options

  try {
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener usuario actual real (no el efectivo)
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('agenda_clientes')
      .select('*')
      .order('nombre', { ascending: true })
      .limit(limite)

    // Si es dueño, ve todos sus clientes
    if (esDuenio) {
      query = query.eq('duenio_id', userId)
    } else {
      // Empleado: según el tipo solicitado
      if (tipo === 'propios') {
        // Solo sus clientes privados
        query = query
          .eq('creado_por', user.id)
          .eq('es_cliente_empleado', true)
      } else if (tipo === 'globales') {
        // Solo clientes del dueño (del local)
        query = query
          .eq('duenio_id', userId)
          .eq('es_cliente_empleado', false)
      } else {
        // Todos: clientes del dueño (globales) + sus propios clientes (privados)
        query = query.or(
          `and(duenio_id.eq.${userId},es_cliente_empleado.eq.false),and(creado_por.eq.${user.id},es_cliente_empleado.eq.true)`
        )
      }
    }

    if (soloActivos) {
      query = query.eq('activo', true)
    }

    if (busqueda) {
      query = query.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%,whatsapp.ilike.%${busqueda}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Agregar marca visual de tipo de cliente
    const clientesConTipo = (data || []).map(c => ({
      ...c,
      tipoCliente: c.es_cliente_empleado ? 'privado' : 'local',
      esMio: c.creado_por === user.id
    }))

    return { data: clientesConTipo, error: null }
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un cliente por ID
 */
export async function getClienteById(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching cliente:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo cliente
 */
export async function createCliente(clienteData) {
  try {
    const { userId, esDuenio, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener usuario actual real
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('agenda_clientes')
      .insert({
        duenio_id: userId, // Siempre el dueño
        creado_por: user.id, // Quien realmente lo crea
        nombre: clienteData.nombre,
        apellido: clienteData.apellido || null,
        whatsapp: clienteData.whatsapp || null,
        email: clienteData.email || null,
        instagram: clienteData.instagram || null,
        origen: clienteData.origen || null,
        notas: clienteData.notas || null,
        es_cliente_empleado: !esDuenio && clienteData.esClientePropio, // Solo si es empleado y lo marca como propio
        // Campos de dirección (para domicilio)
        direccion: clienteData.direccion || null,
        piso: clienteData.piso || null,
        departamento: clienteData.departamento || null,
        localidad: clienteData.localidad || null,
        provincia: clienteData.provincia || null,
        indicaciones_ubicacion: clienteData.indicaciones_ubicacion || null,
        activo: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating cliente:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un cliente
 */
export async function updateCliente(id, clienteData) {
  try {
    const updateData = {}

    if (clienteData.nombre !== undefined) updateData.nombre = clienteData.nombre
    if (clienteData.apellido !== undefined) updateData.apellido = clienteData.apellido
    if (clienteData.whatsapp !== undefined) updateData.whatsapp = clienteData.whatsapp
    if (clienteData.email !== undefined) updateData.email = clienteData.email
    if (clienteData.instagram !== undefined) updateData.instagram = clienteData.instagram
    if (clienteData.origen !== undefined) updateData.origen = clienteData.origen
    if (clienteData.notas !== undefined) updateData.notas = clienteData.notas
    if (clienteData.activo !== undefined) updateData.activo = clienteData.activo
    // Campos de dirección
    if (clienteData.direccion !== undefined) updateData.direccion = clienteData.direccion
    if (clienteData.piso !== undefined) updateData.piso = clienteData.piso
    if (clienteData.departamento !== undefined) updateData.departamento = clienteData.departamento
    if (clienteData.localidad !== undefined) updateData.localidad = clienteData.localidad
    if (clienteData.provincia !== undefined) updateData.provincia = clienteData.provincia
    if (clienteData.indicaciones_ubicacion !== undefined) updateData.indicaciones_ubicacion = clienteData.indicaciones_ubicacion

    const { data, error } = await supabase
      .from('agenda_clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating cliente:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar un cliente (soft delete)
 */
export async function deleteCliente(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_clientes')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return { data: null, error }
  }
}

/**
 * Buscar clientes (para autocomplete)
 */
export async function buscarClientes(texto, limite = 10) {
  return getClientes({
    soloActivos: true,
    busqueda: texto,
    limite
  })
}

/**
 * Obtener estadísticas de un cliente
 */
export async function getEstadisticasCliente(clienteId) {
  try {
    const { data, error } = await supabase
      .rpc('agenda_estadisticas_cliente', { p_cliente_id: clienteId })

    if (error) throw error

    // La función RPC retorna una fila
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching estadísticas cliente:', error)
    return { data: null, error }
  }
}
