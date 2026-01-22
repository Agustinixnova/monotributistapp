import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../auth/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonationData, setImpersonationData] = useState(null)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      // Verificar estado de impersonación
      const { isImpersonating: impersonating, impersonationData: impData } = authService.getImpersonationState()
      setIsImpersonating(impersonating)
      setImpersonationData(impData)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Re-verificar estado de impersonación en cada cambio de auth
        const { isImpersonating: impersonating, impersonationData: impData } = authService.getImpersonationState()
        setIsImpersonating(impersonating)
        setImpersonationData(impData)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await authService.signIn(email, password)
    if (error) {
      return { error }
    }
    setUser(data.user)
    setSession(data.session)
    return { data }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    if (!error) {
      setUser(null)
      setSession(null)
    }
    return { error }
  }

  const signUpFree = async (userData) => {
    const { data, error } = await authService.signUpFree(userData)
    if (error) {
      return { error }
    }
    // Después del registro exitoso, el usuario queda logueado
    if (data?.user) {
      setUser(data.user)
      setSession(data.session)
    }
    return { data }
  }

  const impersonateUser = async (targetUserId) => {
    const result = await authService.impersonateUser(targetUserId)
    if (result.success) {
      // La sesión se actualizará automáticamente via onAuthStateChange
      // Forzar recarga de la página para limpiar estado
      window.location.reload()
    }
    return result
  }

  const exitImpersonation = async () => {
    const result = await authService.exitImpersonation()
    if (result.success) {
      // La sesión se actualizará automáticamente via onAuthStateChange
      // Forzar recarga de la página para limpiar estado
      window.location.reload()
    }
    return result
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUpFree,
    isAuthenticated: !!user,
    // Impersonación
    isImpersonating,
    impersonationData,
    impersonateUser,
    exitImpersonation,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
