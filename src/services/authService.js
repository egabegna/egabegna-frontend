import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const authService = {
  resetPasswordDemande: (email) =>
    axios.post(`${API_BASE}/api/auth/reset-password/`, { email }),

  resetPasswordConfirm: (token, mot_de_passe, confirmation_mdp) =>
    axios.post(`${API_BASE}/api/auth/reset-password/confirm/`, {
      token, mot_de_passe, confirmation_mdp
    }),
}

export default authService