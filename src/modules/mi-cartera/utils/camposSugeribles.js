/**
 * Configuracion de campos que el cliente puede sugerir cambiar
 *
 * Para cada campo se define:
 * - label: Nombre legible
 * - tabla: Tabla donde esta el campo
 * - tipo: Tipo de input (text, number, boolean, select, etc)
 * - opciones: Para tipo select
 * - descripcion: Ayuda para el cliente
 */
export const CAMPOS_SUGERIBLES = {
  // ========================================
  // DATOS PERSONALES (tabla: profiles)
  // ========================================
  nombre: {
    label: 'Nombre',
    tabla: 'profiles',
    tipo: 'text',
    descripcion: 'Tu nombre de pila'
  },
  apellido: {
    label: 'Apellido',
    tabla: 'profiles',
    tipo: 'text',
    descripcion: 'Tu apellido'
  },
  telefono: {
    label: 'Telefono',
    tabla: 'profiles',
    tipo: 'tel',
    descripcion: 'Numero de telefono de contacto'
  },
  whatsapp: {
    label: 'WhatsApp',
    tabla: 'profiles',
    tipo: 'tel',
    descripcion: 'Numero de WhatsApp'
  },
  email: {
    label: 'Email',
    tabla: 'profiles',
    tipo: 'email',
    descripcion: 'Correo electronico'
  },

  // ========================================
  // SITUACION LABORAL (tabla: client_fiscal_data)
  // ========================================
  trabaja_relacion_dependencia: {
    label: 'Trabaja en relacion de dependencia',
    tabla: 'client_fiscal_data',
    tipo: 'boolean',
    descripcion: 'Si tenes un empleo ademas del monotributo'
  },
  empleador_cuit: {
    label: 'CUIT del empleador',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'CUIT de la empresa donde trabajas'
  },
  empleador_razon_social: {
    label: 'Nombre del empleador',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Nombre de la empresa donde trabajas'
  },
  sueldo_bruto: {
    label: 'Sueldo bruto',
    tabla: 'client_fiscal_data',
    tipo: 'currency',
    descripcion: 'Tu sueldo bruto mensual'
  },

  // ========================================
  // EMPLEADOS (tabla: client_fiscal_data)
  // ========================================
  tiene_empleados: {
    label: 'Tiene empleados',
    tabla: 'client_fiscal_data',
    tipo: 'boolean',
    descripcion: 'Si tenes empleados a tu cargo'
  },
  cantidad_empleados: {
    label: 'Cantidad de empleados',
    tabla: 'client_fiscal_data',
    tipo: 'number',
    descripcion: 'Cantidad de empleados (maximo 3 para monotributo)'
  },

  // ========================================
  // LOCALES (tabla: client_locales - manejo especial)
  // ========================================
  locales: {
    label: 'Locales comerciales',
    tabla: 'client_locales',
    tipo: 'array',
    descripcion: 'Informacion sobre tus locales comerciales',
    campos: ['descripcion', 'alquiler', 'superficie', 'esPropio']
  },

  // ========================================
  // OBRA SOCIAL (tabla: client_fiscal_data)
  // ========================================
  obra_social: {
    label: 'Obra social',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Obra social elegida'
  },
  obra_social_tipo_cobertura: {
    label: 'Tipo de cobertura',
    tabla: 'client_fiscal_data',
    tipo: 'select',
    opciones: [
      { value: 'titular', label: 'Solo titular' },
      { value: 'grupo_familiar', label: 'Grupo familiar' }
    ],
    descripcion: 'Si la cobertura es solo para vos o incluye familia'
  },
  obra_social_adicional: {
    label: 'Obra social adicional',
    tabla: 'client_fiscal_data',
    tipo: 'boolean',
    descripcion: 'Si pagas un plan adicional/superador'
  },
  obra_social_adicional_nombre: {
    label: 'Nombre plan adicional',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Nombre del plan adicional que pagas'
  },

  // ========================================
  // GRUPO FAMILIAR (tabla: client_grupo_familiar - manejo especial)
  // ========================================
  grupo_familiar: {
    label: 'Grupo familiar',
    tabla: 'client_grupo_familiar',
    tipo: 'array',
    descripcion: 'Integrantes de tu grupo familiar en la obra social',
    campos: ['nombre', 'dni', 'parentesco']
  },

  // ========================================
  // FACTURACION (tabla: client_fiscal_data)
  // ========================================
  punto_venta_afip: {
    label: 'Punto de venta ARCA',
    tabla: 'client_fiscal_data',
    tipo: 'number',
    descripcion: 'Numero de punto de venta para facturar'
  },

  // ========================================
  // PAGO MONOTRIBUTO (tabla: client_fiscal_data)
  // ========================================
  metodo_pago_monotributo: {
    label: 'Metodo de pago de la cuota',
    tabla: 'client_fiscal_data',
    tipo: 'select',
    opciones: [
      { value: 'debito_automatico', label: 'Debito automatico' },
      { value: 'vep', label: 'VEP' },
      { value: 'mercadopago', label: 'Mercado Pago' },
      { value: 'efectivo', label: 'Efectivo / Rapipago / PagoFacil' },
      { value: 'otro', label: 'Otro' }
    ],
    descripcion: 'Como pagas la cuota mensual del monotributo'
  },
  cbu_debito: {
    label: 'CBU para debito',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'CBU o alias de la cuenta para debito automatico'
  },

  // ========================================
  // INGRESOS BRUTOS (tabla: client_fiscal_data)
  // ========================================
  regimen_iibb: {
    label: 'Regimen de Ingresos Brutos',
    tabla: 'client_fiscal_data',
    tipo: 'select',
    opciones: [
      { value: 'local', label: 'Local (Provincial)' },
      { value: 'simplificado', label: 'Simplificado' },
      { value: 'convenio_multilateral', label: 'Convenio Multilateral' },
      { value: 'exento', label: 'Exento' },
      { value: 'no_inscripto', label: 'No inscripto' }
    ],
    descripcion: 'Tu regimen de Ingresos Brutos'
  },
  numero_iibb: {
    label: 'Numero de inscripcion IIBB',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Tu numero de inscripcion en Ingresos Brutos'
  },

  // ========================================
  // DOMICILIO (tabla: client_fiscal_data)
  // ========================================
  domicilio_fiscal: {
    label: 'Direccion fiscal',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Calle, numero, piso, departamento'
  },
  localidad: {
    label: 'Localidad',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'Ciudad o localidad'
  },
  codigo_postal: {
    label: 'Codigo postal',
    tabla: 'client_fiscal_data',
    tipo: 'text',
    descripcion: 'CP de tu domicilio fiscal'
  },
  provincia: {
    label: 'Provincia',
    tabla: 'client_fiscal_data',
    tipo: 'select',
    opciones: [
      { value: 'Buenos Aires', label: 'Buenos Aires' },
      { value: 'CABA', label: 'CABA' },
      { value: 'Catamarca', label: 'Catamarca' },
      { value: 'Chaco', label: 'Chaco' },
      { value: 'Chubut', label: 'Chubut' },
      { value: 'Cordoba', label: 'Cordoba' },
      { value: 'Corrientes', label: 'Corrientes' },
      { value: 'Entre Rios', label: 'Entre Rios' },
      { value: 'Formosa', label: 'Formosa' },
      { value: 'Jujuy', label: 'Jujuy' },
      { value: 'La Pampa', label: 'La Pampa' },
      { value: 'La Rioja', label: 'La Rioja' },
      { value: 'Mendoza', label: 'Mendoza' },
      { value: 'Misiones', label: 'Misiones' },
      { value: 'Neuquen', label: 'Neuquen' },
      { value: 'Rio Negro', label: 'Rio Negro' },
      { value: 'Salta', label: 'Salta' },
      { value: 'San Juan', label: 'San Juan' },
      { value: 'San Luis', label: 'San Luis' },
      { value: 'Santa Cruz', label: 'Santa Cruz' },
      { value: 'Santa Fe', label: 'Santa Fe' },
      { value: 'Santiago del Estero', label: 'Santiago del Estero' },
      { value: 'Tierra del Fuego', label: 'Tierra del Fuego' },
      { value: 'Tucuman', label: 'Tucuman' }
    ],
    descripcion: 'Provincia de tu domicilio fiscal'
  }
}

/**
 * Campos que el cliente NO puede sugerir cambiar
 */
export const CAMPOS_NO_SUGERIBLES = [
  'cuit',
  'categoria_monotributo',
  'categoria_anterior',
  'fecha_alta_monotributo',
  'estado_pago_monotributo', // No queremos que sepa que "debe"
  'nivel_clave_fiscal',
  'servicios_delegados',
  'fecha_delegacion',
  'factura_electronica_habilitada',
  'notas_internas_fiscales'
]

/**
 * Obtener configuracion de un campo
 */
export function getCampoConfig(campo) {
  return CAMPOS_SUGERIBLES[campo] || null
}

/**
 * Verificar si un campo es sugerible
 */
export function esCampoSugerible(campo) {
  return campo in CAMPOS_SUGERIBLES && !CAMPOS_NO_SUGERIBLES.includes(campo)
}

/**
 * Obtener label legible de un campo
 */
export function getCampoLabel(campo) {
  return CAMPOS_SUGERIBLES[campo]?.label || campo.replace(/_/g, ' ')
}
