import api from './api'

const venteService = {
  creer:    (data)        => api.post('/api/ventes/', data),
  liste:    (params = {}) => api.get('/api/ventes/', { params }),
  detail:   (id)          => api.get(`/api/ventes/${id}/`),
  annuler:  (id)          => api.patch(`/api/ventes/${id}/annuler/`),
}

export default venteService