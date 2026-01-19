/**
 * Service para gestión de empleados de caja
 */

import { supabase } from '../../../lib/supabase'

// Permisos por defecto para nuevos empleados
const PERMISOS_DEFAULT = {
  anular_movimientos: false,
  eliminar_arqueos: false,
  editar_saldo_inicial: false,
  agregar_categorias: false,
  agregar_metodos_pago: false,
  editar_cierre: false,
  reabrir_dia: false
}

/**
 * Obtener empleados del usuario actual (dueño)
 */
export async function getEmpleados() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_empleados')
      .select(`
        id,
        empleado_id,
        permisos,
        activo,
        created_at,
        usuarios_free!caja_empleados_empleado_id_fkey (
          nombre,
          apellido,
          email,
          whatsapp
        )
      `)
      .eq('duenio_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Formatear datos
    const empleados = data.map(emp => ({
      id: emp.id,
      empleado_id: emp.empleado_id,
      nombre: emp.usuarios_free?.nombre || '',
      apellido: emp.usuarios_free?.apellido || '',
      email: emp.usuarios_free?.email || '',
      whatsapp: emp.usuarios_free?.whatsapp || '',
      permisos: emp.permisos,
      activo: emp.activo,
      created_at: emp.created_at
    }))

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
    // Guardar la sesión actual del dueño antes de crear el empleado
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) throw new Error('Usuario no autenticado')

    const user = currentSession.user
    const { email, password, nombre, apellido, whatsapp, permisos } = empleadoData

    // 1. Crear usuario en auth.users
    // Nota: signUp crea una nueva sesión, pero la restauraremos después
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido,
          tipo_usuario: 'empleado'
        }
      }
    })

    if (authError) {
      if (authError.message?.includes('already registered')) {
        throw new Error('Este email ya está registrado')
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('Error al crear el usuario')
    }

    // Restaurar la sesión del dueño inmediatamente
    await supabase.auth.setSession({
      access_token: currentSession.access_token,
      refresh_token: currentSession.refresh_token
    })

    // 2. Obtener el rol operador_gastos_empleado
    const { data: rolData, error: rolError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'operador_gastos_empleado')
      .single()

    if (rolError) throw new Error('No se encontró el rol de empleado')

    // 3. Insertar en usuarios_free
    const { error: userFreeError } = await supabase
      .from('usuarios_free')
      .insert({
        id: authData.user.id,
        email,
        nombre,
        apellido,
        whatsapp,
        role_id: rolData.id,
        origen: 'recomendacion', // Los empleados vienen por recomendación del dueño
        origen_detalle: `Empleado de ${user.email}`
      })

    if (userFreeError) throw userFreeError

    // 4. Crear la relación en caja_empleados
    const { data: empleadoRelacion, error: relacionError } = await supabase
      .from('caja_empleados')
      .insert({
        duenio_id: user.id,
        empleado_id: authData.user.id,
        permisos: permisos || PERMISOS_DEFAULT,
        activo: true
      })
      .select()
      .single()

    if (relacionError) throw relacionError

    return {
      data: {
        id: empleadoRelacion.id,
        empleado_id: authData.user.id,
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

/**
 * Obtener permisos del usuario actual (si es empleado)
 */
export async function getMisPermisos() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('caja_empleados')
      .select('permisos')
      .eq('empleado_id', user.id)
      .eq('activo', true)
      .maybeSingle()

    if (error) throw error

    // Si no es empleado, tiene todos los permisos (es dueño)
    if (!data) {
      return {
        data: {
          esDuenio: true,
          permisos: {
            anular_movimientos: true,
            eliminar_arqueos: true,
            editar_saldo_inicial: true,
            agregar_categorias: true,
            agregar_metodos_pago: true,
            editar_cierre: true,
            reabrir_dia: true
          }
        },
        error: null
      }
    }

    return {
      data: {
        esDuenio: false,
        permisos: data.permisos
      },
      error: null
    }
  } catch (error) {
    console.error('Error obteniendo permisos:', error)
    return { data: null, error }
  }
}
