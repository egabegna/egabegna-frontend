import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import authStore from './authStore'

const SuperadminContext = createContext(null)

export function SuperadminProvider({ children }) {
  const navigate = useNavigate()

  const [superadmin, setSuperadmin] = useState({
    isAuthenticated: !!localStorage.getItem('sa_access'),
    access:          localStorage.getItem('sa_access') || null,
  })

  const saLogin = useCallback((access, refresh) => {
    localStorage.setItem('sa_access',  access)
    localStorage.setItem('sa_refresh', refresh)
    setSuperadmin({ isAuthenticated: true, access })
    navigate('/superadmin/boutiques')
  }, [navigate])

  const saLogout = useCallback(() => {
    localStorage.removeItem('sa_access')
    localStorage.removeItem('sa_refresh')
    setSuperadmin({ isAuthenticated: false, access: null })
    navigate('/superadmin/login')
  }, [navigate])

  const getSaToken = useCallback(() =>
    localStorage.getItem('sa_access'), [])

  return (
    <SuperadminContext.Provider value={{ ...superadmin, saLogin, saLogout, getSaToken }}>
      {children}
    </SuperadminContext.Provider>
  )
}

export const useSuperadmin = () => {
  const ctx = useContext(SuperadminContext)
  if (!ctx) throw new Error('useSuperadmin doit être dans SuperadminProvider')
  return ctx
}