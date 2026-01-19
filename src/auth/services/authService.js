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
   * @param {object} userData - User data
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {string} userData.nombre
   * @param {string} userData.apellido
   * @param {string} userData.whatsapp
   * @param {string} userData.origen - recomendacion, instagram, tiktok, google, otros
   * @param {string} userData.origenDetalle - Optional detail
   * @returns {Promise<{data: object, error: object}>}
   */
  async signUpFree({ email, password, nombre, apellido, whatsapp, origen, origenDetalle }) {
    try {
      // 1. Crear usuario en auth.users con todos los datos en metadata
      // El trigger 'on_auth_user_created_free' se encargará de crear el perfil en usuarios_free
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            whatsapp,
            origen,
            origen_detalle: origenDetalle || null,
            tipo_usuario: 'free'
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        return { data: null, error: authError }
      }

      if (!authData.user) {
        return { data: null, error: { message: 'No se pudo crear el usuario' } }
      }

      // El trigger ya creó el perfil en usuarios_free automáticamente
      // Solo verificamos si tiene sesión activa (email confirmation deshabilitada)
      // o si necesita confirmar email (email confirmation habilitada)
      const needsConfirmation = authData.session === null

      return {
        data: authData,
        error: null,
        needsConfirmation,
        message: needsConfirmation
          ? 'Te enviamos un email para confirmar tu cuenta'
          : 'Cuenta creada exitosamente'
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
