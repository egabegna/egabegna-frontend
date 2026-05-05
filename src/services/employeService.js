import api from './api'

const employeService = {
  liste:              ()       => api.get('/api/employes/'),
  creer:              (data)   => api.post('/api/employes/', data),
  modifier:           (id, data) => api.patch(`/api/employes/${id}/`, data),
  desactiver:         (id)     => api.patch(`/api/employes/${id}/desactiver/`),
  renvoyerInvitation: (id)     => api.post(`/api/employes/${id}/renvoyer-invitation/`),
}

export default employeService