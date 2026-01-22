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
 *   signUpFree: (userData: object) => Promise<{data?: object, error?: object}>,
 *   isImpersonating: boolean,
 *   impersonationData: object|null,
 *   impersonateUser: (targetUserId: string) => Promise<{success: boolean, error?: string}>,
 *   exitImpersonation: () => Promise<{success: boolean, error?: string}>
 * }}
 */
export function useAuth() {
  const {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    signUpFree,
    isImpersonating,
    impersonationData,
    impersonateUser,
    exitImpersonation
  } = useAuthContext()

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    signUpFree,
    // Impersonación
    isImpersonating,
    impersonationData,
    impersonateUser,
    exitImpersonation,
  }
}
