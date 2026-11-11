import apiClient from './client'

// The API reports a past confirmed scheduling as "completed", but it is
// still stored and treated as confirmed by every backend rule (it can be
// cancelled, completed as an evaluation and linked to a procedure), so
// all action/eligibility logic must treat both values the same way.
export function isActiveStatus(status) {
  return status === 'confirmed' || status === 'completed'
}

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