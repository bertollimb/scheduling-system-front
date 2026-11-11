import apiClient from './client'

export async function login(email, password) {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  // skipAuthRefresh: a 401 here means wrong credentials, not an expired
  // session, so the interceptor must not try to refresh or redirect.
  const response = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    skipAuthRefresh: true,
  })

  return response.data
}

export async function refreshToken(refresh_token) {
  const response = await apiClient.post(
    '/auth/refresh',
    { refresh_token },
    { skipAuthRefresh: true }
  )
  return response.data
}