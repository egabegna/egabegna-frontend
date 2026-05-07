import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import authStore from './authStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [auth, setAuth] = useState({
    user:            null,
    role:            localStorage.getItem('role')         || null,
    nom_boutique:    localStorage.getItem('nom_boutique') || null,
    is_superuser:    localStorage.getItem('is_superuser') === 'true',
    devise:          localStorage.getItem('devise')       || 'XOF',
    logo:            localStorage.getItem('logo')         || '',
    isAuthenticated: !!authStore.getAccessToken(),
    isLoading:       true,
  })

  useEffect(() => {
    const token = authStore.getAccessToken()
    if (!token) {
      setAuth(prev => ({ ...prev, isLoading: false }))
      return
    }
    setAuth(prev => ({ ...prev, isLoading: false }))
  }, [])

  const setSession = useCallback((data) => {
    const {
        access, refresh, role, nom_boutique,
        is_superuser = false,
        devise = 'XOF',
        logo   = '',
    } = data   // ← il manquait cette extraction

    authStore.setTokens(access, refresh)
    localStorage.setItem('role',         role)
    localStorage.setItem('nom_boutique', nom_boutique)
    localStorage.setItem('is_superuser', String(is_superuser))
    localStorage.setItem('devise',       devise)
    localStorage.setItem('logo',         logo)

    setAuth({
        role, nom_boutique, is_superuser,
        devise, logo,
        isAuthenticated: true,
        isLoading:       false,
        user:            null,
    })
}, [])

  const logout = useCallback(async () => {
    const refresh = authStore.getRefreshToken()

    try {
      if (refresh) {
        await api.post('/api/auth/deconnexion/', { refresh })
      }
    } catch {
      // silencieux
    } finally {
      authStore.clearTokens()
      localStorage.removeItem('role')
      localStorage.removeItem('nom_boutique')
      localStorage.removeItem('is_superuser')

      setAuth({
        user: null, role: null, nom_boutique: null,
        is_superuser: false, isAuthenticated: false, isLoading: false,
      })

      navigate('/connexion')
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ ...auth, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext doit être utilisé dans AuthProvider')
  return ctx
}