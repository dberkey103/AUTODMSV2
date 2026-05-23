import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from './client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verify session on mount via cookie — single source of truth
  useEffect(() => {
    getMe()
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('autodms_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const r = await apiLogin(username, password)
    const userData = r.data?.user ?? r.data
    localStorage.setItem('autodms_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try { await apiLogout() } catch {}
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