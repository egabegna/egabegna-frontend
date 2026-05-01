import { useCallback } from 'react'
import { useAuthContext } from '../store/AuthContext'
import api from '../services/api'

export const useAuth = () => {
  const { setSession, logout } = useAuthContext()

  const inscription = useCallback(async (formData) => {
    const response = await api.post('/api/auth/inscription/', formData)
    setSession(response.data)
  }, [setSession])

  const login = useCallback(async (formData) => {
    const response = await api.post('/api/auth/login/', formData)
    setSession(response.data)
  }, [setSession])

  return { inscription, login, logout }
}