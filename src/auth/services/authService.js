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
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido,
          tipo_usuario: 'free' // Para identificar que es usuario gratuito
        }
      }
    })

    if (authError) {
      return { data: null, error: authError }
    }

    // 2. El trigger o la inserción manual creará el registro en usuarios_free
    // Por ahora lo hacemos manualmente ya que necesitamos obtener el role_id
    try {
      // Obtener el rol operador_gastos
      const { data: rolData, error: rolError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'operador_gastos')
        .single()

      if (rolError) throw rolError

      // Insertar en usuarios_free
      const { error: insertError } = await supabase
        .from('usuarios_free')
        .insert({
          id: authData.user.id,
          email,
          nombre,
          apellido,
          whatsapp,
          role_id: rolData.id,
          origen,
          origen_detalle: origenDetalle || null
        })

      if (insertError) throw insertError

      return { data: authData, error: null }
    } catch (error) {
      // Si falla la inserción en usuarios_free, intentar limpiar el usuario de auth
      // (esto no siempre funciona desde el cliente, pero lo intentamos)
      console.error('Error creating free user profile:', error)
      return { data: null, error }
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
