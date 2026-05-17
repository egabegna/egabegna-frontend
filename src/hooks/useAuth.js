import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../store/AuthContext'
import api from '../services/api'

export const useAuth = () => {
  const { setSession, logout } = useAuthContext()
  const navigate = useNavigate()

  const inscription = useCallback(async (formData) => {
    const response = await api.post('/api/auth/inscription/', formData)
    setSession(response.data)
  }, [setSession])

 const login = useCallback(async (formData) => {
  const response = await api.post('/api/auth/login/', formData)
  const data = response.data

  // 2FA activée → stocker token temp + rediriger
  if (data.deux_facteurs) {
    localStorage.setItem('2fa_token_temp', data.token_temp)
    localStorage.setItem('2fa_email',      formData.email)
    navigate('/2fa-login')
    return
  }

  // Multi-boutique
  if (data.multi_boutique) {
    localStorage.setItem('mb_email',     formData.email)
    localStorage.setItem('mb_boutiques', JSON.stringify(data.boutiques))
    navigate('/choisir-boutique')
    return
  }

  // Mono-boutique
  setSession(data)
}, [setSession, navigate])

  const choisirBoutique = useCallback(async (boutiqueId) => {
    const email = localStorage.getItem('mb_email')
    const response = await api.post('/api/auth/choisir-boutique/', {
      email:       email,
      boutique_id: boutiqueId,
    })

    // Nettoyer le stockage temporaire
    localStorage.removeItem('mb_email')
    localStorage.removeItem('mb_boutiques')

    setSession(response.data)
  }, [setSession])

  return { inscription, login, choisirBoutique, logout }
}