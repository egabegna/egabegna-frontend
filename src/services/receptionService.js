import api from './api'
const receptionService = {
  liste:    (params={}) => api.get('/api/receptions/', { params }),
  creer:    (data)      => api.post('/api/receptions/', data),
  valider:  (id)        => api.patch(`/api/receptions/${id}/`, { action: 'valider' }),
  annuler:  (id)        => api.patch(`/api/receptions/${id}/`, { action: 'annuler' }),
}
export default receptionService