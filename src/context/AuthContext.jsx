import { createContext, useContext, useState } from 'react'
import { login as loginRequest } from '../api/auth'
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

  function logout() {
    clearTokens()
    setIsAuthenticated(false)
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