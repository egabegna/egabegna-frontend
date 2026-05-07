import api from './api'
const fournisseurService = {
  liste:     (params={}) => api.get('/api/fournisseurs/', { params }),
  creer:     (data)      => api.post('/api/fournisseurs/', data),
  modifier:  (id, data)  => api.patch(`/api/fournisseurs/${id}/`, data),
  desactiver:(id)        => api.delete(`/api/fournisseurs/${id}/`),
}
export default fournisseurService