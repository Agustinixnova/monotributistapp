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
