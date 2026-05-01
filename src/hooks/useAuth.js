import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import authStore from '../store/authStore'

export const useAuth = () => {
  const navigate = useNavigate()

  const inscription = useCallback(async (formData) => {
    const response = await api.post('/api/auth/inscription/', formData)
    const { access, refresh, role, nom_boutique } = response.data

    authStore.setTokens(access, refresh)
    localStorage.setItem('role', role)
    localStorage.setItem('nom_boutique', nom_boutique)

    navigate('/dashboard')
  }, [navigate])

  const login = useCallback(async (formData) => {
    const response = await api.post('/api/auth/login/', formData)
    const { access, refresh, role, nom_boutique } = response.data

    authStore.setTokens(access, refresh)
    localStorage.setItem('role', role)
    localStorage.setItem('nom_boutique', nom_boutique)

    navigate('/dashboard')
  }, [navigate])

  return { inscription, login }
}