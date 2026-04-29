const authStore = {
  getAccessToken:  () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
  },

  clearTokens: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}

export default authStore