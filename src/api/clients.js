import apiClient from './client'

export async function listClients() {
  const response = await apiClient.get('/clients')
  return response.data
}

export async function getClient(clientId) {
  const response = await apiClient.get(`/clients/${clientId}`)
  return response.data
}

export async function createClient(data) {
  const response = await apiClient.post('/clients', data)
  return response.data
}

export async function updateClient(clientId, data) {
  const response = await apiClient.patch(`/clients/${clientId}`, data)
  return response.data
}

export async function deleteClient(clientId) {
  await apiClient.delete(`/clients/${clientId}`)
}