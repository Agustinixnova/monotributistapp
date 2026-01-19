import { useAuthContext } from '../../context/AuthContext'

/**
 * Hook to access authentication state and methods
 * @returns {{
 *   user: object|null,
 *   session: object|null,
 *   loading: boolean,
 *   isAuthenticated: boolean,
 *   signIn: (email: string, password: string) => Promise<{data?: object, error?: object}>,
 *   signOut: () => Promise<{error?: object}>,
 *   signUpFree: (userData: object) => Promise<{data?: object, error?: object}>
 * }}
 */
export function useAuth() {
  const { user, session, loading, isAuthenticated, signIn, signOut, signUpFree } = useAuthContext()

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    signUpFree,
  }
}
