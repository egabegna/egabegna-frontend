import api from './api'

const boutiqueService = {
  get:    ()     => api.get('/api/auth/boutique/me/'),
  patch:  (data) => api.patch('/api/auth/boutique/me/', data),
}

export default boutiqueService