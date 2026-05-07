import api from './api'
export default {
  depenses: {
    liste: (params) => api.get('/api/depenses/', { params }),
    creer: (data)   => api.post('/api/depenses/', data),
    supprimer: (id) => api.delete(`/api/depenses/${id}/`),
  },
  creances: {
    liste:   (params)    => api.get('/api/creances/', { params }),
    creer:   (data)      => api.post('/api/creances/', data),
    paiement:(id, data)  => api.post(`/api/creances/${id}/paiement/`, data),
  },
}