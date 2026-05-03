/**
 * API functions for data source endpoints.
 * All functions communicate with the real Django backend.
 */

/** Fetches all data sources for the given project. */
export async function fetchDataSources(projectId) {
  const response = await fetch(`/api/projects/${projectId}/datasources/`)
  if (!response.ok) {
    throw new Error('Failed to fetch data sources.')
  }
  const data = await response.json()
  return data.data_sources
}

/** Creates a new data source for the given project. Returns the created data source. */
export async function createDataSource(projectId, dataSource) {
  const response = await fetch(`/api/projects/${projectId}/datasources/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataSource),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create data source.')
  }
  return data
}
