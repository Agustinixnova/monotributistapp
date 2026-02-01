/**
 * Service para Caja Secundaria
 * Maneja transferencias, gastos y reintegros de la caja secundaria
 */

import { supabase } from '../../../lib/supabase'
import { getFechaHoyArgentina, getHoraArgentina } from '../utils/dateUtils'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener el método de pago "Efectivo"
 */
async function getMetodoEfectivoId(userId) {
  // Buscar por flag es_efectivo (sistema o del usuario)
  let { data } = await supabase
    .from('caja_metodos_pago')
    .select('id')
    .eq('es_efectivo', true)
    .eq('activo', true)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .limit(1)
    .maybeSingle()

  if (data) return data.id

  // Si no hay, buscar por nombre
  const { data: dataByName } = await supabase
    .from('caja_metodos_pago')
    .select('id')
    .ilike('nombre', '%efectivo%')
    .eq('activo', true)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .limit(1)
    .maybeSingle()

  if (dataByName) return dataByName.id

  throw new Error('No se encontró el método de pago Efectivo. Verificá la configuración de caja.')
}

/**
 * Obtener el saldo actual de la caja secundaria
 */
export async function getSaldoCajaSecundaria() {
  const { userId, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  const { data, error } = await supabase
    .rpc('caja_secundaria_saldo', { p_user_id: userId })

  if (error) throw error
  return { data: data || 0, error: null }
}

/**
 * Obtener historial de movimientos de caja secundaria
 */
export async function getMovimientosCajaSecundaria(limite = 50) {
  const { userId, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  const { data, error } = await supabase
    .from('caja_secundaria_movimientos')
    .select(`
      *,
      categoria:caja_categorias(id, nombre)
    `)
    .eq('user_id', userId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(limite)

  if (error) throw error
  return { data, error: null }
}

/**
 * Transferir dinero de caja principal a caja secundaria
 * @param {number} monto - Monto a transferir
 * @param {string} descripcion - Descripción opcional
 * @param {string} categoriaId - ID de la categoría "A caja secundaria" en caja principal
 */
export async function transferirACajaSecundaria(monto, descripcion = '', categoriaId) {
  const { userId, createdById, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  const fecha = getFechaHoyArgentina()
  const hora = getHoraArgentina()

  // Obtener método efectivo
  const metodoEfectivoId = await getMetodoEfectivoId(userId)

  // 1. Crear salida en caja principal
  const { data: movPrincipal, error: errorPrincipal } = await supabase
    .from('caja_movimientos')
    .insert({
      user_id: userId,
      fecha,
      hora,
      tipo: 'salida',
      monto_total: monto,
      categoria_id: categoriaId,
      descripcion: descripcion || 'Transferencia a caja secundaria',
      created_by_id: createdById || userId,
      anulado: false
    })
    .select()
    .single()

  if (errorPrincipal) throw errorPrincipal

  // 2. Crear pago en efectivo
  const { error: errorPago } = await supabase
    .from('caja_movimientos_pagos')
    .insert({
      movimiento_id: movPrincipal.id,
      metodo_pago_id: metodoEfectivoId,
      monto: monto
    })

  if (errorPago) {
    // Rollback: eliminar movimiento
    await supabase.from('caja_movimientos').delete().eq('id', movPrincipal.id)
    throw errorPago
  }

  // 3. El movimiento en caja secundaria se crea automáticamente por el trigger sync_caja_secundaria()
  // No es necesario crearlo manualmente aquí

  return { data: { movPrincipal }, error: null }
}

/**
 * Reintegrar dinero de caja secundaria a caja principal
 * @param {number} monto - Monto a reintegrar
 * @param {string} descripcion - Descripción opcional
 * @param {string} categoriaId - ID de la categoría "Desde caja secundaria" en caja principal
 */
export async function reintegrarACajaPrincipal(monto, descripcion = '', categoriaId) {
  const { userId, createdById, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  // Verificar que hay saldo suficiente
  const { data: saldo } = await getSaldoCajaSecundaria()
  if (saldo < monto) {
    throw new Error(`Saldo insuficiente. Disponible: $${saldo.toLocaleString('es-AR')}`)
  }

  const fecha = getFechaHoyArgentina()
  const hora = getHoraArgentina()

  // Obtener método efectivo
  const metodoEfectivoId = await getMetodoEfectivoId(userId)

  // 1. Crear entrada en caja principal
  const { data: movPrincipal, error: errorPrincipal } = await supabase
    .from('caja_movimientos')
    .insert({
      user_id: userId,
      fecha,
      hora,
      tipo: 'entrada',
      monto_total: monto,
      categoria_id: categoriaId,
      descripcion: descripcion || 'Reintegro desde caja secundaria',
      created_by_id: createdById || userId,
      anulado: false
    })
    .select()
    .single()

  if (errorPrincipal) throw errorPrincipal

  // 2. Crear pago en efectivo
  const { error: errorPago } = await supabase
    .from('caja_movimientos_pagos')
    .insert({
      movimiento_id: movPrincipal.id,
      metodo_pago_id: metodoEfectivoId,
      monto: monto
    })

  if (errorPago) {
    await supabase.from('caja_movimientos').delete().eq('id', movPrincipal.id)
    throw errorPago
  }

  // 3. El movimiento en caja secundaria se crea automáticamente por el trigger sync_caja_secundaria()
  // No es necesario crearlo manualmente aquí

  return { data: { movPrincipal }, error: null }
}

/**
 * Registrar un gasto desde caja secundaria
 * @param {number} monto - Monto del gasto
 * @param {string} categoriaId - ID de la categoría de gasto
 * @param {string} descripcion - Descripción del gasto
 */
export async function registrarGastoCajaSecundaria(monto, categoriaId, descripcion = '') {
  const { userId, createdById, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  // Verificar que hay saldo suficiente
  const { data: saldo } = await getSaldoCajaSecundaria()
  if (saldo < monto) {
    throw new Error(`Saldo insuficiente. Disponible: $${saldo.toLocaleString('es-AR')}`)
  }

  const fecha = getFechaHoyArgentina()
  const hora = getHoraArgentina()

  const { data, error } = await supabase
    .from('caja_secundaria_movimientos')
    .insert({
      user_id: userId,
      fecha,
      hora,
      tipo: 'salida',
      monto,
      categoria_id: categoriaId,
      descripcion,
      origen: 'gasto',
      created_by_id: createdById || userId
    })
    .select(`
      *,
      categoria:caja_categorias(id, nombre)
    `)
    .single()

  if (error) throw error
  return { data, error: null }
}

/**
 * Transferir desde arqueo a caja secundaria
 * @param {number} monto - Monto a transferir
 * @param {string} categoriaId - ID de la categoría "A caja secundaria"
 */
export async function transferirDesdeArqueo(monto, categoriaId) {
  const { userId, createdById, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  const fecha = getFechaHoyArgentina()
  const hora = getHoraArgentina()

  // Obtener método efectivo
  const metodoEfectivoId = await getMetodoEfectivoId(userId)

  // 1. Crear salida en caja principal
  const { data: movPrincipal, error: errorPrincipal } = await supabase
    .from('caja_movimientos')
    .insert({
      user_id: userId,
      fecha,
      hora,
      tipo: 'salida',
      monto_total: monto,
      categoria_id: categoriaId,
      descripcion: 'A caja secundaria (desde arqueo)',
      created_by_id: createdById || userId,
      anulado: false
    })
    .select()
    .single()

  if (errorPrincipal) throw errorPrincipal

  // 2. Crear pago en efectivo
  const { error: errorPago } = await supabase
    .from('caja_movimientos_pagos')
    .insert({
      movimiento_id: movPrincipal.id,
      metodo_pago_id: metodoEfectivoId,
      monto: monto
    })

  if (errorPago) {
    await supabase.from('caja_movimientos').delete().eq('id', movPrincipal.id)
    throw errorPago
  }

  // 3. El movimiento en caja secundaria se crea automáticamente por el trigger sync_caja_secundaria()
  // No es necesario crearlo manualmente aquí

  return { data: { movPrincipal }, error: null }
}

/**
 * Obtener detalle completo de un movimiento de caja secundaria incluyendo creador
 * @param {string} movimientoId - ID del movimiento
 */
export async function getMovimientoSecundariaDetalle(movimientoId) {
  const { userId, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  const { data, error } = await supabase
    .from('caja_secundaria_movimientos')
    .select(`
      *,
      categoria:caja_categorias(id, nombre, icono)
    `)
    .eq('id', movimientoId)
    .eq('user_id', userId)
    .single()

  if (error) throw error

  // Obtener nombre del creador si existe
  if (data?.created_by_id) {
    try {
      // Obtener usuario actual
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Si el creador es el usuario actual, usar su info directamente
      if (currentUser && currentUser.id === data.created_by_id) {
        // Obtener perfil del usuario actual
        const { data: miPerfil } = await supabase
          .from('profiles')
          .select('nombre, apellido, email')
          .eq('id', currentUser.id)
          .single()

        if (miPerfil) {
          const nombreCompleto = [miPerfil.nombre, miPerfil.apellido].filter(Boolean).join(' ').trim()
          data.creador = {
            nombre: miPerfil.nombre,
            apellido: miPerfil.apellido,
            email: miPerfil.email || currentUser.email,
            nombre_completo: nombreCompleto || (miPerfil.email || currentUser.email)?.split('@')[0] || 'Usuario'
          }
        } else {
          // Usar email del auth si no hay perfil
          data.creador = {
            nombre: null,
            apellido: null,
            email: currentUser.email,
            nombre_completo: currentUser.email?.split('@')[0] || 'Usuario'
          }
        }
      } else {
        // Si es otro usuario, intentar con RPC (tiene SECURITY DEFINER)
        const { data: perfiles, error: perfilError } = await supabase
          .rpc('get_users_names', { user_ids: [data.created_by_id] })

        if (!perfilError && perfiles && perfiles.length > 0) {
          const perfil = perfiles[0]
          data.creador = {
            nombre: perfil.nombre,
            apellido: perfil.apellido,
            email: perfil.email,
            nombre_completo: perfil.nombre_completo !== 'Usuario' ? perfil.nombre_completo : perfil.email?.split('@')[0] || 'Usuario'
          }
        } else {
          // Fallback: intentar query directa a profiles
          const { data: perfil } = await supabase
            .from('profiles')
            .select('nombre, apellido, email')
            .eq('id', data.created_by_id)
            .single()

          if (perfil) {
            const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ').trim()
            data.creador = {
              nombre: perfil.nombre,
              apellido: perfil.apellido,
              email: perfil.email,
              nombre_completo: nombreCompleto || perfil.email?.split('@')[0] || 'Usuario'
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error obteniendo creador del movimiento secundaria:', err)
    }
  }

  return { data, error: null }
}

/**
 * Obtener o crear las categorías de sistema para caja secundaria
 */
export async function getOCrearCategoriasSistema() {
  const { userId, error: userError } = await getEffectiveUserId()
  if (userError || !userId) throw userError || new Error('No autenticado')

  // Buscar categorías existentes (case insensitive)
  const { data: categoriasExistentes, error: errorBuscar } = await supabase
    .from('caja_categorias')
    .select('*')
    .eq('user_id', userId)

  if (errorBuscar) {
    console.error('Error buscando categorías:', errorBuscar)
    throw errorBuscar
  }

  // Buscar de forma case-insensitive
  let catACajaSecundaria = categoriasExistentes?.find(c =>
    c.nombre?.toLowerCase() === 'a caja secundaria'
  )
  let catDesdeCajaSecundaria = categoriasExistentes?.find(c =>
    c.nombre?.toLowerCase() === 'desde caja secundaria'
  )

  // Crear si no existen
  if (!catACajaSecundaria) {
    const { data, error } = await supabase
      .from('caja_categorias')
      .insert({
        user_id: userId,
        nombre: 'A caja secundaria',
        tipo: 'salida',
        es_sistema: true
      })
      .select()
      .single()

    if (error) {
      // Si es duplicate key, intentar buscar de nuevo
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('caja_categorias')
          .select('*')
          .eq('user_id', userId)
          .ilike('nombre', 'a caja secundaria')
          .single()
        catACajaSecundaria = retry
      } else {
        console.error('Error creando categoría "A caja secundaria":', error)
        throw error
      }
    } else {
      catACajaSecundaria = data
    }
  }

  if (!catDesdeCajaSecundaria) {
    const { data, error } = await supabase
      .from('caja_categorias')
      .insert({
        user_id: userId,
        nombre: 'Desde caja secundaria',
        tipo: 'entrada',
        es_sistema: true
      })
      .select()
      .single()

    if (error) {
      // Si es duplicate key, intentar buscar de nuevo
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('caja_categorias')
          .select('*')
          .eq('user_id', userId)
          .ilike('nombre', 'desde caja secundaria')
          .single()
        catDesdeCajaSecundaria = retry
      } else {
        console.error('Error creando categoría "Desde caja secundaria":', error)
        throw error
      }
    } else {
      catDesdeCajaSecundaria = data
    }
  }

  return {
    catACajaSecundaria,
    catDesdeCajaSecundaria
  }
}

/**
 * Anular (eliminar) un movimiento de caja secundaria
 * El trigger bidireccional se encarga automáticamente de:
 * - Si es transferencia: anula el movimiento principal (restaurando el dinero)
 * - Si es gasto: solo se elimina de caja secundaria
 * @param {string} id - ID del movimiento
 * @param {string} motivo - Motivo de la anulación (opcional)
 */
export async function anularMovimientoSecundaria(id, motivo = '') {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('No autenticado')

    // Eliminar el movimiento - el trigger se encarga del resto
    const { error } = await supabase
      .from('caja_secundaria_movimientos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error anulando movimiento secundaria:', error)
    return { success: false, error }
  }
}

/**
 * Actualizar comentario/descripción de un movimiento de caja secundaria
 * @param {string} id - ID del movimiento
 * @param {string} descripcion - Nueva descripción/comentario
 */
export async function actualizarComentarioSecundaria(id, descripcion) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('No autenticado')

    const { data, error } = await supabase
      .from('caja_secundaria_movimientos')
      .update({ descripcion: descripcion?.trim() || null })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error actualizando comentario secundaria:', error)
    return { data: null, error }
  }
}
