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
    gestionFacturacion,
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
    facturadorElectronico,
    // Campos agregados previamente
    fechaAltaMonotributo,
    fechaUltimaRecategorizacion,
    codigoActividadAfip,
    descripcionActividadAfip,
    puntoVentaAfip,
    notasInternasFiscales,
    // Situacion especial
    trabajaRelacionDependencia,
    empleadorCuit,
    empleadorRazonSocial,
    sueldoBruto,
    tieneLocal,
    // Obra social ampliada
    obraSocialTipoCobertura,
    obraSocialAdicional,
    obraSocialAdicionalNombre,
    // Pago monotributo
    metodoPagoMonotributo,
    estadoPagoMonotributo,
    cbuDebito,
    // Accesos ARCA
    nivelClaveFiscal,
    serviciosDelegados,
    fechaDelegacion,
    facturaElectronicaHabilitada,
    // Historial categoria simple
    categoriaAnterior,
    fechaCambioCategoria,
    motivoCambioCategoria
  } = fiscalData

  const updateData = {}
  if (cuit !== undefined) updateData.cuit = cuit
  if (razonSocial !== undefined) updateData.razon_social = razonSocial
  if (tipoContribuyente !== undefined) updateData.tipo_contribuyente = tipoContribuyente
  if (categoriaMonotributo !== undefined) updateData.categoria_monotributo = categoriaMonotributo
  if (tipoActividad !== undefined) updateData.tipo_actividad = tipoActividad
  if (gestionFacturacion !== undefined) updateData.gestion_facturacion = gestionFacturacion || 'contadora'
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
  if (cantidadEmpleados !== undefined) updateData.cantidad_empleados = cantidadEmpleados || 0
  if (facturadorElectronico !== undefined) updateData.facturador_electronico = facturadorElectronico || null
  // Campos agregados previamente
  if (fechaAltaMonotributo !== undefined) updateData.fecha_alta_monotributo = fechaAltaMonotributo || null
  if (fechaUltimaRecategorizacion !== undefined) updateData.fecha_ultima_recategorizacion = fechaUltimaRecategorizacion || null
  if (codigoActividadAfip !== undefined) updateData.codigo_actividad_afip = codigoActividadAfip || null
  if (descripcionActividadAfip !== undefined) updateData.descripcion_actividad_afip = descripcionActividadAfip || null
  if (puntoVentaAfip !== undefined) updateData.punto_venta_afip = puntoVentaAfip || null
  if (notasInternasFiscales !== undefined) updateData.notas_internas_fiscales = notasInternasFiscales || null
  // Situacion especial
  if (trabajaRelacionDependencia !== undefined) updateData.trabaja_relacion_dependencia = trabajaRelacionDependencia
  if (empleadorCuit !== undefined) updateData.empleador_cuit = empleadorCuit || null
  if (empleadorRazonSocial !== undefined) updateData.empleador_razon_social = empleadorRazonSocial || null
  if (sueldoBruto !== undefined) updateData.sueldo_bruto = sueldoBruto || null
  if (tieneLocal !== undefined) updateData.tiene_local = tieneLocal
  // Obra social ampliada
  if (obraSocialTipoCobertura !== undefined) updateData.obra_social_tipo_cobertura = obraSocialTipoCobertura || 'titular'
  if (obraSocialAdicional !== undefined) updateData.obra_social_adicional = obraSocialAdicional
  if (obraSocialAdicionalNombre !== undefined) updateData.obra_social_adicional_nombre = obraSocialAdicionalNombre || null
  // Pago monotributo
  if (metodoPagoMonotributo !== undefined) updateData.metodo_pago_monotributo = metodoPagoMonotributo || null
  if (estadoPagoMonotributo !== undefined) updateData.estado_pago_monotributo = estadoPagoMonotributo || 'al_dia'
  if (cbuDebito !== undefined) updateData.cbu_debito = cbuDebito || null
  // Accesos ARCA
  if (nivelClaveFiscal !== undefined) updateData.nivel_clave_fiscal = nivelClaveFiscal || null
  if (serviciosDelegados !== undefined) updateData.servicios_delegados = serviciosDelegados
  if (fechaDelegacion !== undefined) updateData.fecha_delegacion = fechaDelegacion || null
  if (facturaElectronicaHabilitada !== undefined) updateData.factura_electronica_habilitada = facturaElectronicaHabilitada
  // Historial categoria simple
  if (categoriaAnterior !== undefined) updateData.categoria_anterior = categoriaAnterior || null
  if (fechaCambioCategoria !== undefined) updateData.fecha_cambio_categoria = fechaCambioCategoria || null
  if (motivoCambioCategoria !== undefined) updateData.motivo_cambio_categoria = motivoCambioCategoria || null

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
