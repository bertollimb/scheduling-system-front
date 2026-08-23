import apiClient from './client'

export async function listServices() {
  const response = await apiClient.get('/services')
  return response.data
}

export async function getService(serviceId) {
  const response = await apiClient.get(`/services/${serviceId}`)
  return response.data
}

export async function createService(data) {
  const response = await apiClient.post('/services', data)
  return response.data
}

export async function updateService(serviceId, data) {
  const response = await apiClient.patch(`/services/${serviceId}`, data)
  return response.data
}

export async function deleteService(serviceId) {
  await apiClient.delete(`/services/${serviceId}`)
}