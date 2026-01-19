import { supabase } from '../../lib/supabase'

export const authService = {
  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{data: object, error: object}>}
   */
  async signIn(email, password) {
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
          error: { message: error.message || 'Error al crear la cuenta' }
        }
      }

      if (data.error) {
        console.error('Server error:', data.error)
        return {
          data: null,
          error: { message: data.error || 'Error al crear la cuenta' }
        }
      }

      // La Edge Function ya creó el usuario Y lo logueo
      // Establecer la sesión en el cliente
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
}
