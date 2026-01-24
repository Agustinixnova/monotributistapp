/**
 * Service para arqueos de caja
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'
import { getFechaHoyArgentina, getHoraArgentina } from '../utils/dateUtils'
import { createMovimiento } from './movimientosService'

/**
 * Obtener efectivo esperado actual
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getEfectivoEsperado(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_efectivo_esperado_actual', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
      })

    if (error) throw error
    return { data: data || 0, error: null }
  } catch (error) {
    console.error('Error fetching efectivo esperado:', error)
    return { data: 0, error }
  }
}

/**
 * Obtener arqueos del día
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 */
export async function getArqueosByFecha(fecha) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_arqueos_del_dia', {
        p_user_id: userId,
        p_fecha: fecha || getFechaHoyArgentina()
      })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching arqueos:', error)
    return { data: [], error }
  }
}

/**
 * Crear un nuevo arqueo
 * Si hay diferencia, crea automáticamente un movimiento de ajuste
 * @param {object} arqueo - { fecha, efectivo_esperado, efectivo_real, diferencia, motivo_diferencia, notas }
 */
export async function createArqueo(arqueo) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Obtener el ID del usuario autenticado (puede ser diferente de userId si es empleado)
    const { data: { user } } = await supabase.auth.getUser()
    const createdById = user?.id || userId

    const { data, error } = await supabase
      .from('caja_arqueos')
      .insert({
        user_id: userId,
        created_by_id: createdById,
        hora: getHoraArgentina(),
        ...arqueo
      })
      .select()
      .single()

    if (error) throw error

    // Si hay diferencia, crear movimiento de ajuste automático
    const diferencia = parseFloat(arqueo.diferencia || 0)
    if (diferencia !== 0) {
      await crearMovimientoAjuste(userId, arqueo.fecha, diferencia, arqueo.motivo_diferencia)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error creating arqueo:', error)
    return { data: null, error }
  }
}

/**
 * Crear movimiento de ajuste de caja por diferencia en arqueo
 * @param {string} userId - ID del usuario dueño
 * @param {string} fecha - Fecha del arqueo
 * @param {number} diferencia - Diferencia (positivo = sobrante, negativo = faltante)
 * @param {string} motivo - Motivo de la diferencia (opcional)
 */
async function crearMovimientoAjuste(userId, fecha, diferencia, motivo) {
  try {
    // Buscar categoría "Ajuste de caja" (del sistema)
    const { data: categorias } = await supabase
      .from('caja_categorias')
      .select('id')
      .is('user_id', null)
      .eq('nombre', 'Ajuste de caja')
      .eq('activo', true)
      .single()

    if (!categorias?.id) {
      console.warn('No se encontró la categoría "Ajuste de caja"')
      return
    }

    // Buscar método de pago "Efectivo" (del sistema)
    const { data: metodoEfectivo } = await supabase
      .from('caja_metodos_pago')
      .select('id')
      .is('user_id', null)
      .eq('nombre', 'Efectivo')
      .eq('activo', true)
      .single()

    if (!metodoEfectivo?.id) {
      console.warn('No se encontró el método de pago "Efectivo"')
      return
    }

    // Determinar tipo de movimiento y monto
    // diferencia > 0 = sobrante = entrada
    // diferencia < 0 = faltante = salida
    const tipo = diferencia > 0 ? 'entrada' : 'salida'
    const monto = Math.abs(diferencia)

    // Construir descripción
    let descripcion = `Ajuste de caja por arqueo (${diferencia > 0 ? 'sobrante' : 'faltante'})`
    if (motivo) {
      descripcion += ` - ${motivo}`
    }

    // Crear el movimiento de ajuste
    await createMovimiento({
      tipo,
      categoria_id: categorias.id,
      descripcion,
      fecha: fecha || getFechaHoyArgentina(),
      pagos: [{
        metodo_pago_id: metodoEfectivo.id,
        monto
      }]
    })

    console.log(`Movimiento de ajuste creado: ${tipo} de $${monto}`)
  } catch (error) {
    console.error('Error creando movimiento de ajuste:', error)
    // No lanzamos el error para que el arqueo se guarde igual
  }
}

/**
 * Obtener arqueos con diferencia en un rango de fechas
 * Para incluir en reportes de ingresos/egresos
 * @param {object} params - { fechaDesde, fechaHasta, tipo: 'positivo'|'negativo'|'todos' }
 */
export async function getArqueosConDiferencia({ fechaDesde, fechaHasta, tipo = 'todos' } = {}) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    let query = supabase
      .from('caja_arqueos')
      .select(`
        id,
        fecha,
        hora,
        efectivo_esperado,
        efectivo_real,
        diferencia,
        motivo_diferencia,
        created_by_id
      `)
      .eq('user_id', userId)
      .neq('diferencia', 0)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    // Filtrar por fechas
    if (fechaDesde) {
      query = query.gte('fecha', fechaDesde)
    }
    if (fechaHasta) {
      query = query.lte('fecha', fechaHasta)
    }

    // Filtrar por tipo de diferencia
    if (tipo === 'positivo') {
      query = query.gt('diferencia', 0)
    } else if (tipo === 'negativo') {
      query = query.lt('diferencia', 0)
    }

    const { data, error } = await query

    if (error) throw error

    // Obtener nombres de los creadores usando la función RPC
    if (data && data.length > 0) {
      const creadorIds = [...new Set(data.map(a => a.created_by_id).filter(Boolean))]

      if (creadorIds.length > 0) {
        const { data: perfiles } = await supabase
          .rpc('get_users_names', { user_ids: creadorIds })

        if (perfiles && perfiles.length > 0) {
          // Crear mapa de id -> nombre_completo
          const nombresMap = {}
          perfiles.forEach(p => {
            nombresMap[p.id] = p.nombre_completo
          })

          // Agregar creador_nombre a cada arqueo
          data.forEach(arqueo => {
            arqueo.creador_nombre = nombresMap[arqueo.created_by_id] || 'Usuario'
          })
        }
      }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching arqueos con diferencia:', error)
    return { data: [], error }
  }
}

/**
 * Eliminar un arqueo
 * Requiere permiso eliminar_arqueos si es empleado
 * @param {string} id - ID del arqueo
 */
export async function deleteArqueo(id) {
  try {
    const { userId, esDuenio, permisos, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    // Verificar permiso si es empleado
    if (!esDuenio && !permisos?.eliminar_arqueos) {
      throw new Error('No tienes permisos para eliminar arqueos')
    }

    const { error } = await supabase
      .from('caja_arqueos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting arqueo:', error)
    return { success: false, error }
  }
}
