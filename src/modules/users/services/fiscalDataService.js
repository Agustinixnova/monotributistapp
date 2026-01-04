import { supabase } from '../../../lib/supabase'

/**
 * Servicio para gestión de datos fiscales
 */

/**
 * Obtiene los datos fiscales de un usuario
 * @param {string} userId - UUID del usuario
 */
export async function getFiscalDataByUserId(userId) {
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data
}

/**
 * Crea datos fiscales para un usuario
 * @param {Object} fiscalData
 */
export async function createFiscalData(fiscalData) {
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .insert(fiscalData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza datos fiscales
 * @param {string} userId - UUID del usuario
 * @param {Object} fiscalData
 */
export async function updateFiscalData(userId, fiscalData) {
  const {
    cuit,
    razonSocial,
    tipoContribuyente,
    categoriaMonotributo,
    tipoActividad,
    actividades,
    fechaInscripcionMonotributo,
    fechaInscripcionArca,
    domicilioFiscal,
    codigoPostal,
    localidad,
    provincia,
    obraSocial,
    regimenIibb,
    numeroIibb,
    tieneEmpleados,
    cantidadEmpleados,
    facturadorElectronico
  } = fiscalData

  const updateData = {}
  if (cuit !== undefined) updateData.cuit = cuit
  if (razonSocial !== undefined) updateData.razon_social = razonSocial
  if (tipoContribuyente !== undefined) updateData.tipo_contribuyente = tipoContribuyente
  if (categoriaMonotributo !== undefined) updateData.categoria_monotributo = categoriaMonotributo
  if (tipoActividad !== undefined) updateData.tipo_actividad = tipoActividad
  if (actividades !== undefined) updateData.actividades = actividades
  if (fechaInscripcionMonotributo !== undefined) updateData.fecha_inscripcion_monotributo = fechaInscripcionMonotributo
  if (fechaInscripcionArca !== undefined) updateData.fecha_inscripcion_arca = fechaInscripcionArca
  if (domicilioFiscal !== undefined) updateData.domicilio_fiscal = domicilioFiscal
  if (codigoPostal !== undefined) updateData.codigo_postal = codigoPostal
  if (localidad !== undefined) updateData.localidad = localidad
  if (provincia !== undefined) updateData.provincia = provincia
  if (obraSocial !== undefined) updateData.obra_social = obraSocial
  if (regimenIibb !== undefined) updateData.regimen_iibb = regimenIibb
  if (numeroIibb !== undefined) updateData.numero_iibb = numeroIibb
  if (tieneEmpleados !== undefined) updateData.tiene_empleados = tieneEmpleados
  if (cantidadEmpleados !== undefined) updateData.cantidad_empleados = cantidadEmpleados
  if (facturadorElectronico !== undefined) updateData.facturador_electronico = facturadorElectronico

  const { data, error } = await supabase
    .from('client_fiscal_data')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Elimina datos fiscales de un usuario
 * @param {string} userId - UUID del usuario
 */
export async function deleteFiscalData(userId) {
  const { error } = await supabase
    .from('client_fiscal_data')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
  return true
}

/**
 * Busca por CUIT
 * @param {string} cuit - CUIT a buscar
 */
export async function findByCuit(cuit) {
  const { data, error } = await supabase
    .from('client_fiscal_data')
    .select(`
      *,
      user:profiles(id, nombre, apellido, email)
    `)
    .eq('cuit', cuit)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Obtiene las categorías del monotributo vigentes
 */
export async function getMonotributoCategorias() {
  const { data, error } = await supabase
    .from('monotributo_categorias')
    .select('*')
    .is('vigente_hasta', null)
    .order('categoria', { ascending: true })

  if (error) throw error
  return data
}
