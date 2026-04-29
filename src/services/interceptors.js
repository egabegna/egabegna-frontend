import api from './api'
import authStore from '../store/authStore'

let isRefreshing = false
let failedQueue = []  // requêtes en attente pendant le refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

export const setupInterceptors = (navigate) => {

  // ── Intercepteur REQUEST — injecter le Bearer token ──────────────
  api.interceptors.request.use(
    (config) => {
      const token = authStore.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // ── Intercepteur RESPONSE — gérer les 401 ────────────────────────
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Si pas un 401 ou déjà retenté → on laisse passer
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      // Si un refresh est déjà en cours → mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = authStore.getRefreshToken()

      if (!refreshToken) {
        authStore.clearTokens()
        navigate('/login')
        return Promise.reject(error)
      }

      try {
        const { data } = await api.post('/api/auth/refresh/', {
          refresh: refreshToken,
        })

        authStore.setTokens(data.access, data.refresh)
        processQueue(null, data.access)

        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        authStore.clearTokens()
        navigate('/login')
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }
  )
}