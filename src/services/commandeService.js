import api from './api'

const commandeService = {
  liste:         (params={}) => api.get('/api/fournisseurs/commandes/', { params }),
  detail:        (id)        => api.get(`/api/fournisseurs/commandes/${id}/`),
  creer:         (data)      => api.post('/api/fournisseurs/commandes/', data),
  modifier:      (id, data)  => api.patch(`/api/fournisseurs/commandes/${id}/`, data),
  supprimer:     (id)        => api.delete(`/api/fournisseurs/commandes/${id}/`),
  envoyer:       (id)        => api.patch(`/api/fournisseurs/commandes/${id}/envoyer/`),
  envoyerEmail:  (id)        => api.post(`/api/fournisseurs/commandes/${id}/envoyer-email/`),
  annuler:       (id)        => api.patch(`/api/fournisseurs/commandes/${id}/annuler/`),
}

export default commandeService