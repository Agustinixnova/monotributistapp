/**
 * Service para servicios de agenda
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'

/**
 * Obtener todos los servicios del usuario
 * @param {boolean} soloActivos - Si solo traer activos (default: true)
 */
export async function getServicios(soloActivos = true) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    let query = supabase
      .from('agenda_servicios')
      .select('*')
      .eq('duenio_id', userId)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (soloActivos) {
      query = query.eq('activo', true)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching servicios:', error)
    return { data: null, error }
  }
}

/**
 * Obtener un servicio por ID
 */
export async function getServicioById(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_servicios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching servicio:', error)
    return { data: null, error }
  }
}

/**
 * Crear un nuevo servicio
 */
export async function createServicio(servicioData) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('agenda_servicios')
      .insert({
        duenio_id: userId,
        nombre: servicioData.nombre,
        descripcion: servicioData.descripcion || null,
        duracion_minutos: servicioData.duracion_minutos || 30,
        duracion_minima: servicioData.duracion_minima || null,
        duracion_maxima: servicioData.duracion_maxima || null,
        precio: servicioData.precio || 0,
        precio_variable: servicioData.precio_variable || false,
        costo_estimado: servicioData.costo_estimado || null,
        requiere_sena: servicioData.requiere_sena || false,
        porcentaje_sena: servicioData.porcentaje_sena || 0,
        color: servicioData.color || '#3B82F6',
        orden: servicioData.orden || 0,
        activo: true,
        // Configuración por modalidad
        disponible_local: servicioData.disponible_local !== false,
        disponible_domicilio: servicioData.disponible_domicilio !== false,
        disponible_videollamada: servicioData.disponible_videollamada !== false,
        precio_local: servicioData.precio_local || null,
        precio_domicilio: servicioData.precio_domicilio || null,
        precio_videollamada: servicioData.precio_videollamada || null
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating servicio:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar un servicio
 */
export async function updateServicio(id, servicioData) {
  try {
    const updateData = {}

    if (servicioData.nombre !== undefined) updateData.nombre = servicioData.nombre
    if (servicioData.descripcion !== undefined) updateData.descripcion = servicioData.descripcion
    if (servicioData.duracion_minutos !== undefined) updateData.duracion_minutos = servicioData.duracion_minutos
    if (servicioData.duracion_minima !== undefined) updateData.duracion_minima = servicioData.duracion_minima
    if (servicioData.duracion_maxima !== undefined) updateData.duracion_maxima = servicioData.duracion_maxima
    if (servicioData.precio !== undefined) updateData.precio = servicioData.precio
    if (servicioData.precio_variable !== undefined) updateData.precio_variable = servicioData.precio_variable
    if (servicioData.costo_estimado !== undefined) updateData.costo_estimado = servicioData.costo_estimado
    if (servicioData.requiere_sena !== undefined) updateData.requiere_sena = servicioData.requiere_sena
    if (servicioData.porcentaje_sena !== undefined) updateData.porcentaje_sena = servicioData.porcentaje_sena
    if (servicioData.color !== undefined) updateData.color = servicioData.color
    if (servicioData.orden !== undefined) updateData.orden = servicioData.orden
    if (servicioData.activo !== undefined) updateData.activo = servicioData.activo
    // Configuración por modalidad
    if (servicioData.disponible_local !== undefined) updateData.disponible_local = servicioData.disponible_local
    if (servicioData.disponible_domicilio !== undefined) updateData.disponible_domicilio = servicioData.disponible_domicilio
    if (servicioData.disponible_videollamada !== undefined) updateData.disponible_videollamada = servicioData.disponible_videollamada
    if (servicioData.precio_local !== undefined) updateData.precio_local = servicioData.precio_local
    if (servicioData.precio_domicilio !== undefined) updateData.precio_domicilio = servicioData.precio_domicilio
    if (servicioData.precio_videollamada !== undefined) updateData.precio_videollamada = servicioData.precio_videollamada

    const { data, error } = await supabase
      .from('agenda_servicios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating servicio:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar un servicio (soft delete)
 */
export async function deleteServicio(id) {
  try {
    const { data, error } = await supabase
      .from('agenda_servicios')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting servicio:', error)
    return { data: null, error }
  }
}

/**
 * Reordenar servicios
 * @param {Array} orden - Array de {id, orden}
 */
export async function reordenarServicios(orden) {
  try {
    const promises = orden.map(({ id, orden: nuevoOrden }) =>
      supabase
        .from('agenda_servicios')
        .update({ orden: nuevoOrden })
        .eq('id', id)
    )

    await Promise.all(promises)
    return { success: true, error: null }
  } catch (error) {
    console.error('Error reordenando servicios:', error)
    return { success: false, error }
  }
}

/**
 * Obtener profesionales asignados a un servicio
 */
export async function getProfesionalesServicio(servicioId) {
  try {
    const { data, error } = await supabase
      .from('agenda_servicio_profesionales')
      .select(`
        id,
        profesional_id,
        precio_override,
        activo
      `)
      .eq('servicio_id', servicioId)
      .eq('activo', true)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching profesionales del servicio:', error)
    return { data: null, error }
  }
}

/**
 * Obtener servicios que puede ofrecer un profesional
 */
export async function getServiciosProfesional(profesionalId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('agenda_servicio_profesionales')
      .select(`
        id,
        precio_override,
        activo,
        servicio:agenda_servicios(*)
      `)
      .eq('profesional_id', profesionalId)
      .eq('activo', true)

    if (error) throw error

    // Mapear para devolver servicios con precio override si existe
    const servicios = (data || []).map(sp => ({
      ...sp.servicio,
      precio: sp.precio_override || sp.servicio.precio,
      precio_original: sp.servicio.precio,
      tiene_precio_especial: sp.precio_override !== null
    }))

    return { data: servicios, error: null }
  } catch (error) {
    console.error('Error fetching servicios del profesional:', error)
    return { data: null, error }
  }
}

/**
 * Asignar un profesional a un servicio
 */
export async function asignarProfesionalServicio(servicioId, profesionalId, precioOverride = null) {
  try {
    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('agenda_servicio_profesionales')
      .select('id')
      .eq('servicio_id', servicioId)
      .eq('profesional_id', profesionalId)
      .single()

    if (existente) {
      // Reactivar si existía
      const { data, error } = await supabase
        .from('agenda_servicio_profesionales')
        .update({ activo: true, precio_override: precioOverride })
        .eq('id', existente.id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    }

    // Crear nuevo
    const { data, error } = await supabase
      .from('agenda_servicio_profesionales')
      .insert({
        servicio_id: servicioId,
        profesional_id: profesionalId,
        precio_override: precioOverride,
        activo: true
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error asignando profesional a servicio:', error)
    return { data: null, error }
  }
}

/**
 * Quitar un profesional de un servicio
 */
export async function quitarProfesionalServicio(servicioId, profesionalId) {
  try {
    const { data, error } = await supabase
      .from('agenda_servicio_profesionales')
      .update({ activo: false })
      .eq('servicio_id', servicioId)
      .eq('profesional_id', profesionalId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error quitando profesional de servicio:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar precio especial de un profesional para un servicio
 */
export async function actualizarPrecioServicioProfesional(servicioId, profesionalId, precioOverride) {
  try {
    const { data, error } = await supabase
      .from('agenda_servicio_profesionales')
      .update({ precio_override: precioOverride })
      .eq('servicio_id', servicioId)
      .eq('profesional_id', profesionalId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando precio:', error)
    return { data: null, error }
  }
}

/**
 * Obtener servicios con información de profesionales para la vista de lista
 */
export async function getServiciosConProfesionales() {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data: servicios, error: serviciosError } = await supabase
      .from('agenda_servicios')
      .select(`
        *,
        profesionales:agenda_servicio_profesionales(
          profesional_id,
          precio_override,
          activo
        )
      `)
      .eq('duenio_id', userId)
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (serviciosError) throw serviciosError

    // Filtrar profesionales activos
    const serviciosConProfs = (servicios || []).map(s => ({
      ...s,
      profesionales: (s.profesionales || []).filter(p => p.activo)
    }))

    return { data: serviciosConProfs, error: null }
  } catch (error) {
    console.error('Error fetching servicios con profesionales:', error)
    return { data: null, error }
  }
}
