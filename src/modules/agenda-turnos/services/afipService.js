/**
 * Servicio de Facturación Electrónica AFIP
 *
 * Permite emitir:
 * - Factura C (código 11)
 * - Nota de Crédito C (código 13)
 * - Nota de Débito C (código 12)
 */

import Afip from '@afipsdk/afip.js'
import { supabase } from '../../../lib/supabase'

// Tipos de comprobante
export const TIPOS_COMPROBANTE = {
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13
}

// Tipos de documento del receptor
export const TIPOS_DOCUMENTO = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  DNI: 96,
  CONSUMIDOR_FINAL: 99
}

// Conceptos
export const CONCEPTOS = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3
}

/**
 * Obtiene la configuración AFIP del usuario actual
 */
export async function getConfiguracionAfip(duenioId) {
  const { data, error } = await supabase
    .from('agenda_config_afip')
    .select('*')
    .eq('duenio_id', duenioId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Guarda o actualiza la configuración AFIP
 */
export async function guardarConfiguracionAfip(duenioId, config) {
  const { data: existente } = await supabase
    .from('agenda_config_afip')
    .select('id')
    .eq('duenio_id', duenioId)
    .maybeSingle()

  if (existente) {
    // Actualizar
    const { data, error } = await supabase
      .from('agenda_config_afip')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('duenio_id', duenioId)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Insertar
    const { data, error } = await supabase
      .from('agenda_config_afip')
      .insert({
        duenio_id: duenioId,
        created_by: duenioId,
        ...config
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Crea una instancia de Afip con la configuración del usuario
 * Usa el token centralizado de afipsdk.com desde variables de entorno
 */
function crearInstanciaAfip(config) {
  // Determinar si es testing o producción
  const isProduction = config.ambiente === 'produccion'

  // CUIT debe ser número
  const cuitNumero = parseInt(config.cuit, 10)

  // Token centralizado desde variable de entorno
  const afipsdkToken = import.meta.env.VITE_AFIPSDK_TOKEN

  console.log('Creando instancia AFIP:', {
    cuit: cuitNumero,
    ambiente: isProduction ? 'produccion' : 'testing',
    tieneCert: !!config.certificado_crt,
    tieneKey: !!config.clave_privada_key,
    tieneToken: !!afipsdkToken,
    puntoVenta: config.punto_venta
  })

  if (!afipsdkToken) {
    throw new Error('Token de AFIP SDK no configurado. Contactá al administrador.')
  }

  return new Afip({
    CUIT: cuitNumero,
    cert: config.certificado_crt,
    key: config.clave_privada_key,
    production: isProduction,
    access_token: afipsdkToken
  })
}

/**
 * Verifica la conexión con AFIP
 */
export async function verificarConexionAfip(duenioId) {
  try {
    const config = await getConfiguracionAfip(duenioId)
    if (!config) {
      return { ok: false, error: 'No hay configuración AFIP guardada' }
    }

    if (!config.certificado_crt || !config.clave_privada_key) {
      return { ok: false, error: 'Faltan certificados' }
    }

    if (!config.punto_venta) {
      return { ok: false, error: 'Falta configurar el punto de venta' }
    }

    const afip = crearInstanciaAfip(config)

    console.log('Verificando conexión AFIP con punto de venta:', config.punto_venta)

    // Intentar obtener el último comprobante como prueba de conexión
    const ultimoAutorizado = await afip.ElectronicBilling.getLastVoucher(
      parseInt(config.punto_venta, 10),
      TIPOS_COMPROBANTE.FACTURA_C
    )

    // Actualizar estado de verificación
    await supabase
      .from('agenda_config_afip')
      .update({
        ultima_verificacion: new Date().toISOString(),
        ultimo_error: null
      })
      .eq('duenio_id', duenioId)

    return {
      ok: true,
      ultimoComprobante: ultimoAutorizado,
      ambiente: config.ambiente
    }
  } catch (error) {
    // Guardar el error
    await supabase
      .from('agenda_config_afip')
      .update({
        ultima_verificacion: new Date().toISOString(),
        ultimo_error: error.message
      })
      .eq('duenio_id', duenioId)

    return { ok: false, error: error.message }
  }
}

/**
 * Obtiene el último número de comprobante autorizado en AFIP
 */
export async function getUltimoComprobante(duenioId, tipoComprobante = TIPOS_COMPROBANTE.FACTURA_C) {
  const config = await getConfiguracionAfip(duenioId)
  if (!config) throw new Error('No hay configuración AFIP')

  const afip = crearInstanciaAfip(config)

  const ultimo = await afip.ElectronicBilling.getLastVoucher(
    config.punto_venta,
    tipoComprobante
  )

  return ultimo
}

/**
 * Emite una Factura C
 */
export async function emitirFacturaC(duenioId, datosFactura) {
  return emitirComprobante(duenioId, {
    ...datosFactura,
    tipoComprobante: TIPOS_COMPROBANTE.FACTURA_C
  })
}

/**
 * Emite una Nota de Crédito C
 */
export async function emitirNotaCreditoC(duenioId, datosNota) {
  if (!datosNota.comprobanteAsociado) {
    throw new Error('La Nota de Crédito requiere un comprobante asociado')
  }

  return emitirComprobante(duenioId, {
    ...datosNota,
    tipoComprobante: TIPOS_COMPROBANTE.NOTA_CREDITO_C
  })
}

/**
 * Emite una Nota de Débito C
 */
export async function emitirNotaDebitoC(duenioId, datosNota) {
  if (!datosNota.comprobanteAsociado) {
    throw new Error('La Nota de Débito requiere un comprobante asociado')
  }

  return emitirComprobante(duenioId, {
    ...datosNota,
    tipoComprobante: TIPOS_COMPROBANTE.NOTA_DEBITO_C
  })
}

/**
 * Función principal para emitir cualquier tipo de comprobante
 */
async function emitirComprobante(duenioId, datos) {
  const {
    tipoComprobante,
    importeTotal,
    concepto = CONCEPTOS.SERVICIOS,
    receptorTipoDoc = TIPOS_DOCUMENTO.CONSUMIDOR_FINAL,
    receptorNroDoc = '0',
    receptorNombre = 'Consumidor Final',
    fechaServicioDesde,
    fechaServicioHasta,
    descripcion,
    turnoId,
    comprobanteAsociado // Para NC y ND
  } = datos

  // Obtener configuración
  const config = await getConfiguracionAfip(duenioId)
  if (!config) throw new Error('No hay configuración AFIP')
  if (!config.activo) throw new Error('La facturación está desactivada')

  const afip = crearInstanciaAfip(config)

  // Obtener último número
  const ultimoNumero = await afip.ElectronicBilling.getLastVoucher(
    config.punto_venta,
    tipoComprobante
  )
  const nuevoNumero = ultimoNumero + 1

  // Fecha actual en formato AFIP (YYYYMMDD)
  const hoy = new Date()
  const fechaHoy = hoy.toISOString().split('T')[0].replace(/-/g, '')

  // Construir datos del comprobante
  const datosComprobante = {
    CantReg: 1,
    PtoVta: config.punto_venta,
    CbteTipo: tipoComprobante,
    Concepto: concepto,
    DocTipo: receptorTipoDoc,
    DocNro: receptorNroDoc === '0' ? 0 : parseInt(receptorNroDoc),
    CbteDesde: nuevoNumero,
    CbteHasta: nuevoNumero,
    CbteFch: fechaHoy,
    ImpTotal: importeTotal,
    ImpTotConc: 0, // No gravado
    ImpNeto: importeTotal, // Para Factura C, neto = total
    ImpOpEx: 0, // Exento
    ImpIVA: 0, // Monotributista no discrimina IVA
    ImpTrib: 0, // Tributos
    MonId: 'PES', // Pesos argentinos
    MonCotiz: 1
  }

  // Si es servicios, agregar fechas de servicio
  if (concepto === CONCEPTOS.SERVICIOS || concepto === CONCEPTOS.PRODUCTOS_Y_SERVICIOS) {
    const fechaDesde = fechaServicioDesde
      ? fechaServicioDesde.replace(/-/g, '')
      : fechaHoy
    const fechaHasta = fechaServicioHasta
      ? fechaServicioHasta.replace(/-/g, '')
      : fechaHoy

    datosComprobante.FchServDesde = fechaDesde
    datosComprobante.FchServHasta = fechaHasta
    datosComprobante.FchVtoPago = fechaHoy
  }

  // Si es NC o ND, agregar comprobante asociado
  if (comprobanteAsociado && (tipoComprobante === TIPOS_COMPROBANTE.NOTA_CREDITO_C || tipoComprobante === TIPOS_COMPROBANTE.NOTA_DEBITO_C)) {
    datosComprobante.CbtesAsoc = [{
      Tipo: comprobanteAsociado.tipo,
      PtoVta: comprobanteAsociado.puntoVenta,
      Nro: comprobanteAsociado.numero,
      Cuit: config.cuit,
      CbteFch: comprobanteAsociado.fecha?.replace(/-/g, '') || fechaHoy
    }]
  }

  // Emitir comprobante
  const resultado = await afip.ElectronicBilling.createVoucher(datosComprobante)

  // Formatear CAE vencimiento - AFIP devuelve en formato YYYYMMDD
  let caeVencimientoFormateado = formatearFechaAfip(resultado.CAEFchVto)

  // Fallback: si no viene el vencimiento, usar fecha actual + 10 días (default AFIP)
  if (!caeVencimientoFormateado) {
    const fechaVto = new Date()
    fechaVto.setDate(fechaVto.getDate() + 10)
    caeVencimientoFormateado = fechaVto.toISOString().split('T')[0]
    console.warn('CAEFchVto no recibido de AFIP, usando fallback:', caeVencimientoFormateado)
  }

  // Guardar en base de datos
  const { data: facturaGuardada, error: errorGuardar } = await supabase
    .from('agenda_facturas')
    .insert({
      duenio_id: duenioId,
      turno_id: turnoId || null,
      tipo_comprobante: tipoComprobante,
      punto_venta: config.punto_venta,
      numero_comprobante: nuevoNumero,
      cae: resultado.CAE,
      cae_vencimiento: caeVencimientoFormateado,
      receptor_tipo_doc: receptorTipoDoc,
      receptor_nro_doc: receptorNroDoc,
      receptor_nombre: receptorNombre,
      importe_total: importeTotal,
      importe_neto: importeTotal,
      concepto: concepto,
      fecha_comprobante: hoy.toISOString().split('T')[0],
      fecha_servicio_desde: fechaServicioDesde || hoy.toISOString().split('T')[0],
      fecha_servicio_hasta: fechaServicioHasta || hoy.toISOString().split('T')[0],
      comprobante_asociado_tipo: comprobanteAsociado?.tipo,
      comprobante_asociado_pto_vta: comprobanteAsociado?.puntoVenta,
      comprobante_asociado_nro: comprobanteAsociado?.numero,
      descripcion: descripcion,
      afip_response: resultado,
      created_by: duenioId
    })
    .select()
    .single()

  if (errorGuardar) {
    console.error('Error guardando factura en DB:', errorGuardar)
    // La factura ya se emitió en AFIP, no podemos revertir
    // Devolvemos el resultado pero marcamos el error
    return {
      ok: true,
      factura: {
        tipo: tipoComprobante,
        puntoVenta: config.punto_venta,
        numero: nuevoNumero,
        cae: resultado.CAE,
        caeVencimiento: resultado.CAEFchVto,
        importeTotal: importeTotal,
        fecha: hoy.toISOString().split('T')[0]
      },
      facturaDb: null,
      afipResponse: resultado,
      advertencia: 'La factura se emitió en AFIP pero hubo un error al guardarla en la base de datos. Contactá al soporte.'
    }
  }

  return {
    ok: true,
    factura: {
      tipo: tipoComprobante,
      puntoVenta: config.punto_venta,
      numero: nuevoNumero,
      cae: resultado.CAE,
      caeVencimiento: resultado.CAEFchVto,
      importeTotal: importeTotal,
      fecha: hoy.toISOString().split('T')[0]
    },
    facturaDb: facturaGuardada,
    afipResponse: resultado
  }
}

/**
 * Obtiene el historial de facturas emitidas
 */
export async function getFacturasEmitidas(duenioId, filtros = {}) {
  let query = supabase
    .from('agenda_facturas')
    .select('*')
    .eq('duenio_id', duenioId)
    .order('created_at', { ascending: false })

  if (filtros.tipoComprobante) {
    query = query.eq('tipo_comprobante', filtros.tipoComprobante)
  }

  if (filtros.fechaDesde) {
    query = query.gte('fecha_comprobante', filtros.fechaDesde)
  }

  if (filtros.fechaHasta) {
    query = query.lte('fecha_comprobante', filtros.fechaHasta)
  }

  if (filtros.limit) {
    query = query.limit(filtros.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Obtiene una factura por ID
 */
export async function getFacturaPorId(duenioId, facturaId) {
  const { data, error } = await supabase
    .from('agenda_facturas')
    .select('*')
    .eq('duenio_id', duenioId)
    .eq('id', facturaId)
    .single()

  if (error) throw error
  return data
}

/**
 * Formatea nombre del tipo de comprobante
 */
export function getNombreTipoComprobante(tipo) {
  switch (tipo) {
    case TIPOS_COMPROBANTE.FACTURA_C:
      return 'Factura C'
    case TIPOS_COMPROBANTE.NOTA_CREDITO_C:
      return 'Nota de Crédito C'
    case TIPOS_COMPROBANTE.NOTA_DEBITO_C:
      return 'Nota de Débito C'
    default:
      return 'Comprobante'
  }
}

/**
 * Formatea número de comprobante completo
 */
export function formatearNumeroComprobante(puntoVenta, numero) {
  const pv = String(puntoVenta).padStart(5, '0')
  const num = String(numero).padStart(8, '0')
  return `${pv}-${num}`
}

/**
 * Convierte fecha AFIP (YYYYMMDD) a formato ISO (YYYY-MM-DD)
 */
function formatearFechaAfip(fechaAfip) {
  if (!fechaAfip || fechaAfip.length !== 8) return null
  return `${fechaAfip.slice(0, 4)}-${fechaAfip.slice(4, 6)}-${fechaAfip.slice(6, 8)}`
}

/**
 * Genera el link para ver/descargar la factura en AFIP
 */
export function getLinkFacturaAfip(cuit, tipoComprobante, puntoVenta, numero, cae) {
  // URL del QR de AFIP
  const data = {
    ver: 1,
    fecha: new Date().toISOString().split('T')[0],
    cuit: cuit,
    ptoVta: puntoVenta,
    tipoCmp: tipoComprobante,
    nroCmp: numero,
    importe: 0, // Se puede agregar
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: 99,
    nroDocRec: 0,
    tipoCodAut: 'E',
    codAut: cae
  }

  const base64Data = btoa(JSON.stringify(data))
  return `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`
}
