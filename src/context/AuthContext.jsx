import { createContext, useContext, useState } from 'react'
import { login as loginRequest, logout as logoutRequest } from '../api/auth'
import { setTokens, clearTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  )

  async function login(email, password) {
    const data = await loginRequest(email, password)
    setTokens(data.access_token, data.refresh_token)
    setIsAuthenticated(true)
  }

  async function logout() {
    try {
      await logoutRequest(localStorage.getItem('refresh_token'))
    } catch {
      // Revoking on the server is best effort: on a network error, a 503
      // or an expired token the local session is still cleared below, so
      // the user is never stuck logged in.
    } finally {
      clearTokens()
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}