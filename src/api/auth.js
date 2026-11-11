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

export async function logout(refresh_token) {
  // The access token goes in the Authorization header (request
  // interceptor). skipAuthRefresh: a 401 here must not start a refresh,
  // and the short timeout keeps a slow backend from blocking the logout.
  await apiClient.post(
    '/auth/logout',
    { refresh_token },
    { skipAuthRefresh: true, timeout: 5000 }
  )
}

export async function changePassword(current_password, new_password) {
  // Returns a new token pair: every token issued before the change is
  // revoked by the backend.
  const response = await apiClient.post('/auth/change-password', {
    current_password,
    new_password,
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