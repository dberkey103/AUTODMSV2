import React, { createContext, useContext, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from './client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('autodms_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading] = useState(false)

  const login = async (username, password) => {
    const r = await apiLogin(username, password)
    const userData = r.data.user
    localStorage.setItem('autodms_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    await apiLogout()
    localStorage.removeItem('autodms_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)