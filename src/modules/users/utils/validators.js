/**
 * Validadores para el módulo de usuarios
 */

/**
 * Valida un CUIT argentino usando el algoritmo oficial
 * @param {string} cuit - CUIT a validar (con o sin guiones)
 * @returns {boolean}
 */
export function validateCUIT(cuit) {
  if (!cuit) return false

  // Eliminar guiones y espacios
  const cleanCuit = cuit.replace(/[-\s]/g, '')

  // Debe tener 11 dígitos
  if (!/^\d{11}$/.test(cleanCuit)) return false

  // Algoritmo de validación CUIT argentino
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCuit[i]) * multipliers[i]
  }

  const remainder = sum % 11
  let verifier = 11 - remainder

  if (verifier === 11) verifier = 0
  if (verifier === 10) verifier = 9

  return verifier === parseInt(cleanCuit[10])
}

/**
 * Valida un email
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida un número de teléfono argentino
 * @param {string} phone - Número con o sin código de área
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return false
  // Eliminar espacios, guiones y paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  // Acepta números de 8 a 13 dígitos (con o sin código de país)
  return /^\d{8,13}$/.test(cleanPhone)
}

/**
 * Valida una contraseña
 * Requisitos: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = []

  if (!password) {
    return { valid: false, errors: ['La contraseña es requerida'] }
  }

  if (password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula')
  }

  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valida un DNI argentino
 * @param {string} dni
 * @returns {boolean}
 */
export function validateDNI(dni) {
  if (!dni) return false
  // Eliminar puntos y espacios
  const cleanDni = dni.replace(/[\.\s]/g, '')
  // DNI debe tener entre 7 y 8 dígitos
  return /^\d{7,8}$/.test(cleanDni)
}

/**
 * Valida que un campo requerido no esté vacío
 * @param {string} value
 * @returns {boolean}
 */
export function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Valida el formulario de usuario completo (paso 1 - datos personales)
 * @param {Object} userData
 * @param {boolean} isNewUser - Si es un usuario nuevo (requiere password)
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateUserForm(userData, isNewUser = true) {
  const errors = {}

  if (!validateRequired(userData.nombre)) {
    errors.nombre = 'El nombre es requerido'
  }

  if (!validateRequired(userData.apellido)) {
    errors.apellido = 'El apellido es requerido'
  }

  if (!validateEmail(userData.email)) {
    errors.email = 'Email inválido'
  }

  // La contraseña solo es requerida para usuarios nuevos
  if (isNewUser && !userData.password) {
    errors.password = 'La contraseña es requerida'
  } else if (userData.password) {
    const passwordValidation = validatePassword(userData.password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors.join('. ')
    }
  }

  if (userData.telefono && !validatePhone(userData.telefono)) {
    errors.telefono = 'Teléfono inválido'
  }

  // WhatsApp es obligatorio
  if (!validateRequired(userData.whatsapp)) {
    errors.whatsapp = 'El WhatsApp es requerido'
  } else if (!validatePhone(userData.whatsapp)) {
    errors.whatsapp = 'WhatsApp inválido'
  }

  // DNI es obligatorio
  if (!validateRequired(userData.dni)) {
    errors.dni = 'El DNI es requerido'
  } else if (!validateDNI(userData.dni)) {
    errors.dni = 'DNI inválido'
  }

  // NOTA: roleId se valida en el paso 2, no aquí

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Valida el formulario de datos fiscales
 * @param {Object} fiscalData
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateFiscalDataForm(fiscalData) {
  const errors = {}

  if (!validateCUIT(fiscalData.cuit)) {
    errors.cuit = 'CUIT inválido'
  }

  if (!fiscalData.tipoContribuyente) {
    errors.tipoContribuyente = 'Debe seleccionar el tipo de contribuyente'
  }

  if (fiscalData.tipoContribuyente === 'monotributista' && !fiscalData.categoriaMonotributo) {
    errors.categoriaMonotributo = 'Debe seleccionar la categoría'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
