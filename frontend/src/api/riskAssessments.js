import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

function normalizeError(error) {
  const data = error.response?.data
  const status = error.response?.status

  if (!data) {
    return error
  }

  if (data.errors) {
    return {
      status,
      ...data,
      ...data.errors,
    }
  }

  if (typeof data === 'object') {
    return {
      status,
      ...data,
    }
  }

  return {
    status,
    error: data,
  }
}

export async function getProjectRiskAssessment(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/risk-assessment/`)
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}
