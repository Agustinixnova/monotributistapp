/**
 * Service para gestión de empleados de caja
 */

import { supabase } from '../../../lib/supabase'

// Permisos por defecto para nuevos empleados
// editar_cierre en true porque es operación normal de fin de turno
const PERMISOS_DEFAULT = {
  anular_movimientos: false,
  eliminar_arqueos: false,
  editar_saldo_inicial: false,
  agregar_categorias: false,
  agregar_metodos_pago: false,
  editar_cierre: true,
  reabrir_dia: false,
  editar_cuentas_corrientes: false,
  eliminar_clientes_cc: false,
  editar_movimientos_cc: false,
  ver_dias_anteriores: false
}

/**
 * Obtener empleados del usuario actual (dueño)
 */
export async function getEmpleados() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    // Primero obtener los empleados
    const { data: empleadosData, error: empleadosError } = await supabase
      .from('caja_empleados')
      .select('id, empleado_id, permisos, activo, created_at')
      .eq('duenio_id', user.id)
      .order('created_at', { ascending: false })

    if (empleadosError) throw empleadosError

    if (!empleadosData || empleadosData.length === 0) {
      return { data: [], error: null }
    }

    // Obtener los datos de usuarios_free para cada empleado
    const empleadoIds = empleadosData.map(e => e.empleado_id)
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios_free')
      .select('id, nombre, apellido, email, whatsapp')
      .in('id', empleadoIds)

    if (usuariosError) {
      console.error('Error fetching usuarios_free:', usuariosError)
      // Continuar sin los datos de usuario
    }

    // Crear un mapa para acceso rápido
    const usuariosMap = new Map()
    if (usuariosData) {
      usuariosData.forEach(u => usuariosMap.set(u.id, u))
    }

    // Formatear datos
    const empleados = empleadosData.map(emp => {
      const usuario = usuariosMap.get(emp.empleado_id)
      return {
        id: emp.id,
        empleado_id: emp.empleado_id,
        nombre: usuario?.nombre || '',
        apellido: usuario?.apellido || '',
        email: usuario?.email || '',
        whatsapp: usuario?.whatsapp || '',
        permisos: emp.permisos,
        activo: emp.activo,
        created_at: emp.created_at
      }
    })

    return { data: empleados, error: null }
  } catch (error) {
    console.error('Error fetching empleados:', error)
    return { data: [], error }
  }
}

/**
 * Crear un nuevo empleado
 * @param {object} empleadoData - Datos del empleado
 * @param {string} empleadoData.email
 * @param {string} empleadoData.password
 * @param {string} empleadoData.nombre
 * @param {string} empleadoData.apellido
 * @param {string} empleadoData.whatsapp
 * @param {object} empleadoData.permisos - Permisos opcionales
 */
export async function crearEmpleado(empleadoData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { email, password, nombre, apellido, whatsapp, permisos } = empleadoData

    // 1. Crear usuario usando la Edge Function (Admin API)
    // Esto evita problemas de sesiones y usa el SERVICE_ROLE_KEY
    const { data: empleadoCreado, error: createError } = await supabase.functions.invoke('register-free-user', {
      body: {
        email,
        password,
        nombre,
        apellido,
        whatsapp,
        origen: 'recomendacion',
        origen_detalle: `Empleado de ${user.email}`,
        role_name: 'operador_gastos_empleado' // Rol específico para empleados
      }
    })

    if (createError) {
      if (createError.message?.includes('already registered') || createError.message?.includes('User already registered')) {
        throw new Error('Este email ya está registrado')
      }
      throw createError
    }

    if (!empleadoCreado || !empleadoCreado.userId) {
      throw new Error('Error al crear el empleado')
    }

    // 2. Crear la relación en caja_empleados
    const { data: empleadoRelacion, error: relacionError } = await supabase
      .from('caja_empleados')
      .insert({
        duenio_id: user.id,
        empleado_id: empleadoCreado.userId,
        permisos: permisos || PERMISOS_DEFAULT,
        activo: true
      })
      .select()
      .single()

    if (relacionError) throw relacionError

    return {
      data: {
        id: empleadoRelacion.id,
        empleado_id: empleadoCreado.userId,
        nombre,
        apellido,
        email,
        whatsapp,
        permisos: empleadoRelacion.permisos,
        activo: true
      },
      error: null
    }
  } catch (error) {
    console.error('Error creando empleado:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar permisos de un empleado
 * @param {string} id - ID de la relación caja_empleados
 * @param {object} permisos - Nuevos permisos
 */
export async function actualizarPermisos(id, permisos) {
  try {
    const { data, error } = await supabase
      .from('caja_empleados')
      .update({ permisos })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando permisos:', error)
    return { data: null, error }
  }
}

/**
 * Actualizar horarios de acceso de un empleado
 * @param {string} id - ID de la relación empleado
 * @param {object|null} horarios - Objeto con horarios o null para sin restricciones
 */
export async function actualizarHorarios(id, horarios) {
  try {
    const { data, error } = await supabase
      .from('caja_empleados')
      .update({ horarios_acceso: horarios })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando horarios:', error)
    return { data: null, error }
  }
}

/**
 * Activar/desactivar un empleado
 * @param {string} id - ID de la relación
 * @param {boolean} activo - Estado
 */
export async function toggleEmpleadoActivo(id, activo) {
  try {
    const { data, error } = await supabase
      .from('caja_empleados')
      .update({ activo })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error toggleando empleado:', error)
    return { data: null, error }
  }
}

/**
 * Eliminar un empleado (solo desvincula, no borra el usuario)
 * @param {string} id - ID de la relación
 */
export async function eliminarEmpleado(id) {
  try {
    const { error } = await supabase
      .from('caja_empleados')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error eliminando empleado:', error)
    return { success: false, error }
  }
}

/**
 * Obtener historial de activación/desactivación de un empleado
 * @param {string} empleadoRelId - ID de la relación caja_empleados
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getHistorialEmpleado(empleadoRelId) {
  try {
    const { data, error } = await supabase
      .rpc('get_historial_empleado', { p_empleado_rel_id: empleadoRelId })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error obteniendo historial empleado:', error)
    return { data: [], error }
  }
}

/**
 * Verificar si el usuario actual es empleado de alguien
 * @returns {Promise<{esEmpleado: boolean, duenio: object|null, permisos: object|null}>}
 */
export async function verificarSiEsEmpleado() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { esEmpleado: false, duenio: null, permisos: null }

    const { data, error } = await supabase
      .from('caja_empleados')
      .select(`
        permisos,
        duenio_id,
        usuarios_free!caja_empleados_duenio_id_fkey (
          nombre,
          apellido,
          email
        )
      `)
      .eq('empleado_id', user.id)
      .eq('activo', true)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return { esEmpleado: false, duenio: null, permisos: null }
    }

    return {
      esEmpleado: true,
      duenio: {
        id: data.duenio_id,
        nombre: data.usuarios_free?.nombre || '',
        apellido: data.usuarios_free?.apellido || '',
        email: data.usuarios_free?.email || ''
      },
      permisos: data.permisos
    }
  } catch (error) {
    console.error('Error verificando si es empleado:', error)
    return { esEmpleado: false, duenio: null, permisos: null }
  }
}

// Key para localStorage del contexto de caja
const STORAGE_KEY_CONTEXTO = 'caja_contexto_seleccionado'

/**
 * Obtiene el user_id efectivo para operaciones de caja
 * - Si es dueño: retorna su propio user.id
 * - Si es empleado Y contexto es 'empleador': retorna el duenio_id (comportamiento original)
 * - Si es empleado Y contexto es 'propio': retorna su propio user.id (caja personal)
 *
 * El contexto se lee de localStorage para permitir que el empleado elija
 * entre ver su propia caja o la del empleador.
 */
export async function getEffectiveUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { userId: null, esDuenio: false, permisos: null, error: new Error('No autenticado') }

    // Leer contexto seleccionado (por defecto 'empleador' para mantener compatibilidad)
    const contextoSeleccionado = localStorage.getItem(STORAGE_KEY_CONTEXTO) || 'empleador'

    // Verificar si es empleado
    const { data, error } = await supabase
      .from('caja_empleados')
      .select('duenio_id, permisos')
      .eq('empleado_id', user.id)
      .eq('activo', true)
      .maybeSingle()

    if (error) throw error

    // Si es empleado
    if (data) {
      // Si eligió ver su propia caja, usar su propio ID
      if (contextoSeleccionado === 'propio') {
        return {
          userId: user.id,
          createdById: user.id,
          esDuenio: true, // Es dueño de su propia caja
          permisos: {
            anular_movimientos: true,
            eliminar_arqueos: true,
            editar_saldo_inicial: true,
            agregar_categorias: true,
            agregar_metodos_pago: true,
            editar_cierre: true,
            reabrir_dia: true,
            editar_movimientos_cc: true,
            editar_cuentas_corrientes: true,
            eliminar_clientes_cc: true,
            ver_dias_anteriores: true
          },
          error: null,
          usandoCajaPropia: true
        }
      }

      // Por defecto o si eligió 'empleador', usar el ID del dueño
      // createdById = ID real del empleado (quien hizo la acción)
      return {
        userId: data.duenio_id,
        createdById: user.id,
        esDuenio: false,
        permisos: data.permisos,
        error: null,
        usandoCajaPropia: false
      }
    }

    // Si no es empleado, es dueño - usar su propio ID
    return {
      userId: user.id,
      createdById: user.id,
      esDuenio: true,
      permisos: {
        anular_movimientos: true,
        eliminar_arqueos: true,
        editar_saldo_inicial: true,
        agregar_categorias: true,
        agregar_metodos_pago: true,
        editar_cierre: true,
        reabrir_dia: true,
        editar_movimientos_cc: true,
        editar_cuentas_corrientes: true,
        eliminar_clientes_cc: true,
        ver_dias_anteriores: true
      },
      error: null
    }
  } catch (error) {
    console.error('Error obteniendo effective user id:', error)
    return { userId: null, esDuenio: false, permisos: null, error }
  }
}

/**
 * Obtener permisos del usuario actual
 * Respeta el contexto seleccionado (caja propia vs caja del empleador)
 */
export async function getMisPermisos() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    // Leer contexto seleccionado
    const contextoSeleccionado = localStorage.getItem(STORAGE_KEY_CONTEXTO) || 'empleador'

    // Intentar con horarios_acceso, si falla (columna no existe), intentar sin ella
    let data, error
    const result = await supabase
      .from('caja_empleados')
      .select('permisos, horarios_acceso')
      .eq('empleado_id', user.id)
      .eq('activo', true)
      .maybeSingle()

    if (result.error) {
      // Puede que la columna horarios_acceso no exista, intentar sin ella
      const fallback = await supabase
        .from('caja_empleados')
        .select('permisos')
        .eq('empleado_id', user.id)
        .eq('activo', true)
        .maybeSingle()
      data = fallback.data
      error = fallback.error
    } else {
      data = result.data
      error = result.error
    }

    if (error) throw error

    // Permisos completos de dueño
    const permisosCompletos = {
      anular_movimientos: true,
      eliminar_arqueos: true,
      editar_saldo_inicial: true,
      agregar_categorias: true,
      agregar_metodos_pago: true,
      editar_cierre: true,
      reabrir_dia: true,
      ver_reportes: true,
      ver_total_dia: true,
      ver_estadisticas: true,
      editar_cuentas_corrientes: true,
      eliminar_clientes_cc: true,
      editar_movimientos_cc: true,
      ver_dias_anteriores: true
    }

    // Si no es empleado de nadie, tiene todos los permisos (es dueño)
    if (!data) {
      return {
        data: {
          esDuenio: true,
          permisos: permisosCompletos,
          horariosAcceso: null
        },
        error: null
      }
    }

    // Es empleado de alguien, pero eligió ver su propia caja
    if (contextoSeleccionado === 'propio') {
      return {
        data: {
          esDuenio: true, // Es dueño de su propia caja
          permisos: permisosCompletos,
          horariosAcceso: null, // Sin restricciones en su propia caja
          usandoCajaPropia: true
        },
        error: null
      }
    }

    // Es empleado y está viendo la caja del empleador
    return {
      data: {
        esDuenio: false,
        permisos: data.permisos,
        horariosAcceso: data.horarios_acceso || null,
        usandoCajaPropia: false
      },
      error: null
    }
  } catch (error) {
    console.error('Error obteniendo permisos:', error)
    return { data: null, error }
  }
}
