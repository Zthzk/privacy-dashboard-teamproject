import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

function normalizeError(error) {
  const data = error.response?.data

  if (!data) {
    return error
  }

  if (data.errors) {
    return {
      ...data,
      ...data.errors,
    }
  }

  return data
}

export async function getProjectRiskAssessment(projectId) {
  try {
    const response = await apiClient.get(`/projects/${projectId}/risk-assessment/`)
    return response.data
  } catch (error) {
    throw normalizeError(error)
  }
}
