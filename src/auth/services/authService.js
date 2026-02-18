import { supabase } from '../../lib/supabase'

// Keys para localStorage de impersonación
const IMPERSONATION_KEY = 'impersonation_data'
const ORIGINAL_SESSION_KEY = 'original_session'

export const authService = {
  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{data: object, error: object}>}
   */
  async signIn(email, password) {
    // Limpiar datos de impersonación stale antes de iniciar sesión
    localStorage.removeItem(IMPERSONATION_KEY)
    localStorage.removeItem(ORIGINAL_SESSION_KEY)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  /**
   * Sign up a new free user (operador_gastos)
   * Usa Edge Function para crear usuario pre-confirmado con Admin API
   * @param {object} userData - User data
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} userData.nombre
   * @param {string} userData.apellido
   * @param {string} userData.whatsapp
   * @param {string} userData.origen - recomendacion, instagram, tiktok, google, otros
   * @param {string} userData.origenDetalle - Optional detail
   * @returns {Promise<{data: object, error: object, session: object}>}
   */
  async signUpFree({ email, password, nombre, apellido, whatsapp, origen, origenDetalle }) {
    try {
      // Limpiar datos de impersonación stale
      localStorage.removeItem(IMPERSONATION_KEY)
      localStorage.removeItem(ORIGINAL_SESSION_KEY)

      // Llamar a Edge Function que usa Admin API (seguro)
      const { data, error } = await supabase.functions.invoke('register-free-user', {
        body: {
          email,
          password,
          nombre,
          apellido,
          whatsapp,
          origen,
          origenDetalle
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        return {
          data: null,
          error: {
            message: error.message || 'Error al crear la cuenta',
            details: error
          }
        }
      }

      if (data.error) {
        console.error('Server error:', data.error)
        console.error('Error details:', data.details)
        return {
          data: null,
          error: {
            message: data.error || 'Error al crear la cuenta',
            details: data.details
          }
        }
      }

      // La Edge Function ya creó el usuario Y lo logueo (si pudo)
      // Establecer la sesión en el cliente si existe
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        })
      }

      return {
        data: {
          user: data.user,
          session: data.session
        },
        error: null,
        needsConfirmation: false, // Siempre false porque usamos Admin API
        needsManualLogin: data.needsManualLogin || false, // Si true, usuario debe loguearse manualmente
        message: data.message || 'Cuenta creada exitosamente'
      }
    } catch (error) {
      console.error('Error in signUpFree:', error)
      return {
        data: null,
        error: { message: error.message || 'Error al crear la cuenta' }
      }
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<{error: object}>}
   */
  async signOut() {
    // Limpiar datos de impersonación al cerrar sesión
    localStorage.removeItem(IMPERSONATION_KEY)
    localStorage.removeItem(ORIGINAL_SESSION_KEY)

    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get the current session
   * @returns {Promise<{data: {session: object}, error: object}>}
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  /**
   * Get the current user
   * @returns {Promise<{data: {user: object}, error: object}>}
   */
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  /**
   * Subscribe to auth state changes
   * @param {function} callback
   * @returns {object} subscription
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  /**
   * Impersonate a user (solo para rol desarrollo)
   * @param {string} targetUserId - ID del usuario a impersonar
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async impersonateUser(targetUserId) {
    try {
      // Obtener sesión actual para guardarla
      const { data: currentSession } = await supabase.auth.getSession()

      if (!currentSession?.session) {
        return { success: false, error: 'No hay sesión activa' }
      }

      // Llamar a la Edge Function para obtener el token de impersonación
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { targetUserId }
      })

      if (error) {
        console.error('Error en impersonate-user:', error)
        return { success: false, error: error.message || 'Error al impersonar usuario' }
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Error al impersonar usuario' }
      }

      // Guardar sesión original y datos de impersonación en localStorage
      localStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify({
        access_token: currentSession.session.access_token,
        refresh_token: currentSession.session.refresh_token
      }))

      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
        impersonatedUser: data.data.impersonatedUser,
        impersonatedBy: data.data.impersonatedBy,
        startedAt: new Date().toISOString()
      }))

      // Usar verifyOtp con el token para establecer la nueva sesión
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.data.token_hash,
        type: 'magiclink'
      })

      if (verifyError) {
        // Limpiar localStorage si falla
        localStorage.removeItem(ORIGINAL_SESSION_KEY)
        localStorage.removeItem(IMPERSONATION_KEY)
        console.error('Error verificando OTP:', verifyError)
        return { success: false, error: 'Error al establecer sesión de impersonación' }
      }

      return { success: true, data: verifyData }

    } catch (error) {
      console.error('Error en impersonateUser:', error)
      localStorage.removeItem(ORIGINAL_SESSION_KEY)
      localStorage.removeItem(IMPERSONATION_KEY)
      return { success: false, error: error.message || 'Error al impersonar usuario' }
    }
  },

  /**
   * Terminar impersonación y volver a la sesión original
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async exitImpersonation() {
    try {
      const originalSessionStr = localStorage.getItem(ORIGINAL_SESSION_KEY)

      // Limpiar localStorage siempre, sin importar el resultado
      localStorage.removeItem(ORIGINAL_SESSION_KEY)
      localStorage.removeItem(IMPERSONATION_KEY)

      if (!originalSessionStr) {
        // No hay sesión original - hacer signOut limpio
        await supabase.auth.signOut()
        return { success: true }
      }

      const originalSession = JSON.parse(originalSessionStr)

      // Restaurar sesión original
      const { error } = await supabase.auth.setSession({
        access_token: originalSession.access_token,
        refresh_token: originalSession.refresh_token
      })

      if (error) {
        console.error('Error restaurando sesión:', error)
        // Sesión original expirada/inválida - hacer signOut limpio
        await supabase.auth.signOut()
        return { success: true }
      }

      return { success: true }

    } catch (error) {
      console.error('Error en exitImpersonation:', error)
      // Asegurar limpieza en caso de error
      localStorage.removeItem(ORIGINAL_SESSION_KEY)
      localStorage.removeItem(IMPERSONATION_KEY)
      await supabase.auth.signOut()
      return { success: true }
    }
  },

  /**
   * Verificar si hay una impersonación activa
   * @returns {{isImpersonating: boolean, impersonationData: object|null}}
   */
  getImpersonationState() {
    const impersonationStr = localStorage.getItem(IMPERSONATION_KEY)
    const originalSessionStr = localStorage.getItem(ORIGINAL_SESSION_KEY)

    if (impersonationStr && originalSessionStr) {
      try {
        return {
          isImpersonating: true,
          impersonationData: JSON.parse(impersonationStr)
        }
      } catch {
        return { isImpersonating: false, impersonationData: null }
      }
    }

    return { isImpersonating: false, impersonationData: null }
  },
}
