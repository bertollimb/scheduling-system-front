import apiClient from './client'

export async function listSchedulings(date) {
  const response = await apiClient.get('/schedulings', {
    params: date ? { date } : {},
  })
  return response.data
}

export async function getScheduling(schedulingId) {
  const response = await apiClient.get(`/schedulings/${schedulingId}`)
  return response.data
}

export async function createScheduling(data) {
  const response = await apiClient.post('/schedulings', data)
  return response.data
}

export async function completeEvaluation(schedulingId, estimatedDurationMinutes) {
  const response = await apiClient.patch(`/schedulings/${schedulingId}/complete-evaluation`, {
    estimated_duration_minutes: estimatedDurationMinutes,
  })
  return response.data
}

export async function cancelScheduling(schedulingId) {
  const response = await apiClient.patch(`/schedulings/${schedulingId}/cancel`)
  return response.data
}