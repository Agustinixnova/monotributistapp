import { useAuthContext } from '../../context/AuthContext'

/**
 * Hook to access authentication state and methods
 * @returns {{
 *   user: object|null,
 *   session: object|null,
 *   loading: boolean,
 *   isAuthenticated: boolean,
 *   signIn: (email: string, password: string) => Promise<{data?: object, error?: object}>,
 *   signOut: () => Promise<{error?: object}>
 * }}
 */
export function useAuth() {
  const { user, session, loading, isAuthenticated, signIn, signOut } = useAuthContext()

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signOut,
  }
}
