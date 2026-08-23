import apiClient from './client'

export async function login(email, password) {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return response.data
}

export async function refreshToken(refresh_token) {
  const response = await apiClient.post('/auth/refresh', { refresh_token })
  return response.data
}