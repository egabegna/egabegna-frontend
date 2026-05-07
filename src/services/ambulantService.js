import api from './api'
const ambulantService = {
  liste:         ()          => api.get('/api/ambulant/'),
  demarrer:      (data)      => api.post('/api/ambulant/', data),
  detail:        (id)        => api.get(`/api/ambulant/${id}/`),
  venteAmbulant: (id, data)  => api.post(`/api/ambulant/${id}/vente/`, data),
  cloturer:      (id, data)  => api.patch(`/api/ambulant/${id}/`, data),
}
export default ambulantService