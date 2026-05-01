import api from './api'

const saHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('sa_access')}`,
  }
})

const superadminService = {
  login:        (username, password) =>
    api.post('/api/auth/token/', { username, password }),
  getBoutiques: () => api.get('/superadmin/boutiques/', saHeaders()),
  getStats:     () => api.get('/superadmin/stats/', saHeaders()),
  getBoutique:  (id) => api.get(`/superadmin/boutiques/${id}/`, saHeaders()),
  bloquer:      (id) => api.post(`/superadmin/boutiques/${id}/bloquer/`, {}, saHeaders()),
  debloquer:    (id) => api.post(`/superadmin/boutiques/${id}/debloquer/`, {}, saHeaders()),
}

export default superadminService