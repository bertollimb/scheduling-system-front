import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

function endSession() {
  clearTokens()
  window.location.href = '/login'
}

// The refresh token rotates: every refresh returns a new pair and
// invalidates the old refresh token, so two concurrent refreshes would
// make one of them fail with 401. All requests that hit a 401 at the same
// time share this single in-flight promise instead of refreshing again.
let refreshPromise = null

async function refreshTokens() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  // Plain axios (not apiClient) so this call never goes through the
  // interceptors below.
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/refresh`,
    { refresh_token: refreshToken }
  )
  setTokens(response.data.access_token, response.data.refresh_token)
  return response.data.access_token
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Requests flagged with skipAuthRefresh (login, logout) handle their
    // own errors and must never trigger a refresh or a redirect.
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error)
    }

    // A request that already got a fresh token and still returns 401
    // means the session is gone: don't refresh again.
    if (originalRequest._retry) {
      endSession()
      return Promise.reject(error)
    }
    originalRequest._retry = true

    try {
      const currentToken = localStorage.getItem('access_token')
      const sentAuthorization = originalRequest.headers.Authorization

      let newToken
      if (currentToken && sentAuthorization !== `Bearer ${currentToken}`) {
        // Another request already refreshed while this one was in
        // flight: just retry with the current token.
        newToken = currentToken
      } else {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null
          })
        }
        newToken = await refreshPromise
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      // A missing refresh token or an auth rejection (4xx) from
      // /auth/refresh ends the session. A network or server error keeps
      // the tokens so a later request can try again.
      const isNetworkOrServerError = refreshError.response
        ? refreshError.response.status >= 500
        : refreshError.isAxiosError === true
      if (!isNetworkOrServerError) {
        endSession()
      }
      return Promise.reject(error)
    }
  }
)

export default apiClient
