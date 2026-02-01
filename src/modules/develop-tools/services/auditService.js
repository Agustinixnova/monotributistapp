/**
 * Servicio de Auditoría
 * Para registrar acciones que no son CRUD automático
 */

import { supabase } from '../../../lib/supabase'

/**
 * Registrar una acción manualmente en el log de auditoría
 * Usar para acciones que no son INSERT/UPDATE/DELETE en tablas con trigger
 *
 * @param {Object} params
 * @param {string} params.accion - Tipo de acción (ej: 'EXPORT', 'LOGIN', 'CONFIG_CHANGE')
 * @param {string} params.tabla - Entidad afectada (ej: 'reportes', 'sesiones')
 * @param {string} [params.registroId] - ID del registro afectado
 * @param {string} [params.descripcion] - Descripción legible de la acción
 * @param {Object} [params.datosAntes] - Estado anterior (si aplica)
 * @param {Object} [params.datosDespues] - Estado nuevo (si aplica)
 * @param {string} [params.modulo] - Módulo donde ocurrió la acción
 *
 * @example
 * // Loguear exportación de datos
 * await registrarAuditoria({
 *   accion: 'EXPORT',
 *   tabla: 'clientes',
 *   descripcion: 'Exportación de listado de clientes a CSV',
 *   modulo: 'mi-cartera'
 * })
 *
 * @example
 * // Loguear cambio de configuración
 * await registrarAuditoria({
 *   accion: 'CONFIG_CHANGE',
 *   tabla: 'configuracion_negocio',
 *   descripcion: 'Cambio de horario de atención',
 *   datosAntes: { horario: '9-18' },
 *   datosDespues: { horario: '10-20' },
 *   modulo: 'agenda-turnos'
 * })
 */
export async function registrarAuditoria({
  accion,
  tabla,
  registroId = null,
  descripcion = null,
  datosAntes = null,
  datosDespues = null,
  modulo = null
}) {
  try {
    const { data, error } = await supabase.rpc('registrar_auditoria', {
      p_accion: accion,
      p_tabla: tabla,
      p_registro_id: registroId,
      p_descripcion: descripcion,
      p_datos_antes: datosAntes,
      p_datos_despues: datosDespues,
      p_modulo: modulo
    })

    if (error) {
      console.error('[Audit] Error registrando auditoría:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[Audit] Error:', err)
    return null
  }
}

/**
 * Acciones predefinidas comunes
 */
export const ACCIONES_AUDIT = {
  // Acceso y sesiones
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  IMPERSONATE: 'IMPERSONATE',

  // Datos
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  BULK_UPDATE: 'BULK_UPDATE',
  BULK_DELETE: 'BULK_DELETE',

  // Configuración
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',

  // Acciones especiales
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
  SYSTEM_ACTION: 'SYSTEM_ACTION'
}
