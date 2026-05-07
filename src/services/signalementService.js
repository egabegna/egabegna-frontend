import api from './api'
const signalementService = {
  liste:    (params={}) => api.get('/api/signalements/', { params }),
  count:    ()          => api.get('/api/signalements/count/'),
  lire:     (id)        => api.patch(`/api/signalements/${id}/lire/`),
  lireTout: ()          => api.patch('/api/signalements/lire-tout/'),
}
export default signalementService