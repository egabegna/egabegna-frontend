import api from './api'
const rapportService = {
  ventes:      (params={}) => api.get('/api/rapports/ventes/',       { params }),
  topProduits: (params={}) => api.get('/api/rapports/top-produits/', { params }),
  employes:    (params={}) => api.get('/api/rapports/employes/',     { params }),
  dashboard:   (params={}) => api.get('/api/finances/dashboard/',    { params }),
}
export default rapportService