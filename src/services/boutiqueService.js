import api from './api'

const boutiqueService = {
  get:              ()      => api.get('/api/auth/boutique/me/'),
  patch:            (data)  => api.patch('/api/auth/boutique/me/', data),
  getRegimes:       ()      => api.get('/api/auth/boutique/me/regimes/'),
}

export default boutiqueService