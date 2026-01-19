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
      // 1. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            tipo_usuario: 'free'
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        return { data: null, error: authError }
      }

      // Si el usuario requiere confirmación de email, authData.user existe pero session puede ser null
      if (!authData.user) {
        return { data: null, error: { message: 'No se pudo crear el usuario' } }
      }

      // 2. Obtener el rol operador_gastos
      const { data: rolData, error: rolError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'operador_gastos')
        .single()

      if (rolError) {
        console.error('Role error:', rolError)
        throw new Error('No se encontró el rol operador_gastos')
      }

      // 3. Insertar en usuarios_free
      // Nota: Si email confirmation está habilitada, esto podría fallar por RLS
      // En ese caso, necesitamos crear el perfil con un trigger o edge function
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

      if (insertError) {
        console.error('Insert error:', insertError)
        // Si el error es por RLS (usuario no autenticado por confirmación pendiente)
        // retornamos éxito de todos modos, pero con un flag especial
        if (insertError.code === 'PGRST301' || insertError.message?.includes('JWT')) {
          return {
            data: authData,
            error: null,
            needsConfirmation: true,
            message: 'Te enviamos un email para confirmar tu cuenta'
          }
        }
        throw insertError
      }

      return {
        data: authData,
        error: null,
        needsConfirmation: authData.session === null,
        message: authData.session ? 'Cuenta creada exitosamente' : 'Te enviamos un email para confirmar tu cuenta'
      }
    } catch (error) {
      console.error('Error in signUpFree:', error)
      return { data: null, error: { message: error.message || 'Error al crear la cuenta' } }
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
