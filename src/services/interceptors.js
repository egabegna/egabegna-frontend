import api from './api'
import authStore from '../store/authStore'

let isRefreshing = false
let failedQueue  = []
let interceptorsSetup = false   // ← ajouter cette ligne


const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

export const setupInterceptors = (logout) => {

  api.interceptors.request.use(
    (config) => {
      // Ne pas toucher les requêtes superadmin
      if (config.url?.includes('/superadmin/')) return config

      const token = authStore.getAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => Promise.reject(error)
  )

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config

      // Ne pas intercepter les erreurs superadmin
      if (original.url?.includes('/superadmin/')) {
        return Promise.reject(error)
      }

      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(err => Promise.reject(err))
      }

      original._retry = true
      isRefreshing    = true

      const refreshToken = authStore.getRefreshToken()

      if (!refreshToken) {
        logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await api.post('/api/auth/refresh/', {
          refresh: refreshToken,
        })

        authStore.setTokens(data.access, data.refresh)
        processQueue(null, data.access)

        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)

      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }
  )
}