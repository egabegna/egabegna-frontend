import api from './api'

const clientService = {
  liste:      (params={}) => api.get('/api/clients/', { params }),
  detail:     (id)        => api.get(`/api/clients/${id}/`),
  creer:      (data)      => api.post('/api/clients/', data),
  modifier:   (id, data)  => api.patch(`/api/clients/${id}/`, data),
  supprimer:  (id)        => api.delete(`/api/clients/${id}/`),
  historique: (id)        => api.get(`/api/clients/${id}/historique/`),
  creances:   (id)        => api.get(`/api/clients/${id}/creances/`),
}

export default clientService