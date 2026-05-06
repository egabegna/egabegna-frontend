import api from './api'

const produitService = {
  // Catégories
  getCategories:    ()        => api.get('/api/categories/'),
  creerCategorie:   (data)    => api.post('/api/categories/', data),
  modifierCategorie:(id, data)=> api.patch(`/api/categories/${id}/`, data),
  supprimerCategorie:(id)     => api.delete(`/api/categories/${id}/`),

  // Produits
  getProduits: (params = {}) => api.get('/api/produits/', { params }),
  getProduit:  (id)          => api.get(`/api/produits/${id}/`),
  creerProduit:(data)        => api.post('/api/produits/', data),
  modifierProduit:(id, data) => api.patch(`/api/produits/${id}/`, data),
  desactiverProduit:(id)     => api.delete(`/api/produits/${id}/`),

  // Stock
  getMouvements: (params={}) => api.get('/api/stock/mouvements/', { params }),
  ajusterStock:  (data)      => api.post('/api/stock/ajuster/', data),
}

export default produitService