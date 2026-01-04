/**
 * Validate email format
 * @param {string} email
 * @returns {{isValid: boolean, error: string|null}}
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'El email es requerido' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'El formato del email no es válido' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate password
 * @param {string} password
 * @returns {{isValid: boolean, error: string|null}}
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' }
  }

  if (password.length < 6) {
    return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  return { isValid: true, error: null }
}

/**
 * Validate login form
 * @param {string} email
 * @param {string} password
 * @returns {{isValid: boolean, errors: {email: string|null, password: string|null}}}
 */
export function validateLoginForm(email, password) {
  const emailValidation = validateEmail(email)
  const passwordValidation = validatePassword(password)

  return {
    isValid: emailValidation.isValid && passwordValidation.isValid,
    errors: {
      email: emailValidation.error,
      password: passwordValidation.error,
    },
  }
}
